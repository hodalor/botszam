import mongoose, { Types, type ClientSession } from 'mongoose';
import { DeliveryZoneModel } from '../models/DeliveryZone';
import type { MobileMoneyNetwork } from '../models/Settings';
import { OrderModel, type OrderDocument } from '../models/Order';
import { ProductModel } from '../models/Product';
import {
  getProviderByName,
  getProviderForMethod,
  type PaymentActor,
  type PaymentInstructions,
  type PaymentResult,
} from '../payments';
import { AppError } from '../utils/AppError';
import { generateOrderNumber } from '../utils/orderNumber';
import {
  ADMIN_SETTABLE_STATUSES,
  canTransition,
  CUSTOMER_CANCELLABLE_STATUSES,
  STOCK_RELEASED_STATUSES,
  type OrderStatus,
  type PaymentMethod,
} from '../utils/orderStatus';
import { applyStockChange } from './inventory.service';
import { toPaymentContext } from './order.serializer';

export interface CreateOrderInput {
  items: { productId: string; variantSku: string; quantity: number }[];
  customer: { name: string; phone: string; email?: string };
  deliveryAddress: { zoneId: string; area: string; street: string; landmark?: string; notes?: string };
  paymentMethod: PaymentMethod;
  userId: string | null;
}

/** Identifies who is acting on an order from the storefront. */
export interface CustomerAccess {
  phone?: string;
  userId?: string | null;
}

const MAX_ORDER_NUMBER_ATTEMPTS = 5;

export async function createOrder(
  input: CreateOrderInput,
): Promise<{ order: OrderDocument; instructions: PaymentInstructions }> {
  const provider = getProviderForMethod(input.paymentMethod);
  const lines = mergeLines(input.items);

  for (let attempt = 1; ; attempt++) {
    try {
      const order = await mongoose.connection.transaction((session) =>
        placeOrder(input, lines, provider.name, session),
      );
      const instructions = await provider.getInstructions(toPaymentContext(order));
      return { order, instructions };
    } catch (err) {
      if (attempt < MAX_ORDER_NUMBER_ATTEMPTS && isDuplicateOrderNumber(err)) continue;
      throw err;
    }
  }
}

async function placeOrder(
  input: CreateOrderInput,
  lines: CreateOrderInput['items'],
  providerName: string,
  session: ClientSession,
): Promise<OrderDocument> {
  const zone = await DeliveryZoneModel.findOne({ _id: input.deliveryAddress.zoneId, active: true })
    .session(session)
    .lean();
  if (!zone) {
    throw AppError.badRequest('The selected delivery zone is not available', 'INVALID_DELIVERY_ZONE');
  }

  const productIds = [...new Set(lines.map((l) => l.productId))];
  const products = await ProductModel.find({ _id: { $in: productIds }, active: true })
    .session(session)
    .lean();
  const productsById = new Map(products.map((p) => [String(p._id), p]));

  const orderId = new Types.ObjectId();
  const userId = input.userId ? new Types.ObjectId(input.userId) : null;
  const items = [];

  for (const line of lines) {
    const product = productsById.get(line.productId);
    const variant = product?.variants.find((v) => v.sku === line.variantSku);
    if (!product || !variant || variant.active === false) {
      throw new AppError('An item in your cart is no longer available', 409, 'ITEM_UNAVAILABLE', {
        productId: line.productId,
        variantSku: line.variantSku,
      });
    }
    if (variant.stock < line.quantity) {
      throw outOfStock(product.name, line, variant.stock);
    }

    try {
      await applyStockChange(
        {
          productId: product._id,
          variantSku: variant.sku,
          change: -line.quantity,
          reason: 'order',
          orderId,
          userId,
        },
        { session, requireActive: true },
      );
    } catch (err) {
      // Another order took the stock between our read and the conditional update.
      if (err instanceof AppError && err.code === 'INSUFFICIENT_STOCK') {
        throw outOfStock(product.name, line, 0);
      }
      throw err;
    }

    items.push({
      product: product._id,
      variantSku: variant.sku,
      name: product.name,
      size: variant.size,
      colour: variant.colour,
      image: product.images[0]?.url ?? null,
      unitPriceNgwee: variant.priceNgwee,
      quantity: line.quantity,
    });
  }

  const subtotalNgwee = items.reduce((sum, i) => sum + i.unitPriceNgwee * i.quantity, 0);
  const deliveryFeeNgwee = zone.feeNgwee;
  const totalNgwee = subtotalNgwee + deliveryFeeNgwee;
  const orderNumber = generateOrderNumber();

  const provider = getProviderByName(providerName);
  const init = await provider.initiate({ orderNumber, totalNgwee, paymentMethod: input.paymentMethod });

  const [order] = await OrderModel.create(
    [
      {
        _id: orderId,
        orderNumber,
        user: userId,
        customer: input.customer,
        deliveryAddress: {
          zone: zone._id,
          zoneName: zone.name,
          area: input.deliveryAddress.area,
          street: input.deliveryAddress.street,
          landmark: input.deliveryAddress.landmark ?? '',
          notes: input.deliveryAddress.notes ?? '',
        },
        items,
        subtotalNgwee,
        deliveryFeeNgwee,
        totalNgwee,
        paymentMethod: input.paymentMethod,
        payment: { ...init.payment, provider: provider.name },
        status: init.status,
        statusHistory: [{ status: init.status, at: new Date(), by: userId, note: init.note }],
      },
    ],
    { session },
  );
  return order;
}

/* ------------------------------------------------------------------ */
/* Status transitions                                                  */
/* ------------------------------------------------------------------ */

interface TransitionRequest {
  orderNumber: string;
  actor: PaymentActor;
  /** Throws if the actor may not act on this order. */
  authorize?: (order: OrderDocument) => void;
  /** Computes the next status and payment changes from the current order. */
  decide: (order: OrderDocument, session: ClientSession) => Promise<PaymentResult>;
}

/**
 * The single place where order status changes. Runs in a transaction, enforces the allowed
 * transitions, appends to statusHistory and releases stock when an order is cancelled or its
 * payment rejected. Concurrent changes to the same order cause a write conflict and the
 * transaction is retried against the fresh state.
 */
async function transitionOrder(request: TransitionRequest): Promise<OrderDocument> {
  return mongoose.connection.transaction(async (session) => {
    const order = await OrderModel.findOne({ orderNumber: request.orderNumber }).session(session);
    if (!order) throw AppError.notFound('Order not found', 'ORDER_NOT_FOUND');
    request.authorize?.(order);

    const from = order.status as OrderStatus;
    const result = await request.decide(order, session);
    if (!canTransition(from, result.status)) {
      throw AppError.conflict(
        `Cannot change an order from ${from} to ${result.status}`,
        'INVALID_STATUS_TRANSITION',
      );
    }

    for (const [key, value] of Object.entries(result.payment)) {
      if (key !== 'provider') order.set(`payment.${key}`, value);
    }
    order.status = result.status;
    order.statusHistory.push({
      status: result.status,
      at: new Date(),
      by: request.actor.userId,
      note: result.note,
    });

    const wasReleased = STOCK_RELEASED_STATUSES.includes(from);
    const isReleased = STOCK_RELEASED_STATUSES.includes(result.status);
    if (isReleased && !wasReleased) await releaseStock(order, result.status, request.actor, session);
    if (wasReleased && !isReleased) await reserveStock(order, request.actor, session);

    await order.save({ session });
    return order;
  });
}

async function releaseStock(
  order: OrderDocument,
  status: OrderStatus,
  actor: PaymentActor,
  session: ClientSession,
) {
  const reason = status === 'payment_rejected' ? 'payment_rejected' : 'cancel';
  for (const item of order.items) {
    const restored = await applyStockChange(
      {
        productId: item.product,
        variantSku: item.variantSku,
        change: item.quantity,
        reason,
        orderId: order._id,
        userId: actor.userId,
        note: `Restored from ${order.orderNumber}`,
      },
      { session, ignoreMissing: true },
    );
    if (!restored) {
      console.warn(`Could not restore stock for ${item.variantSku} on ${order.orderNumber}: variant no longer exists`);
    }
  }
}

/** Takes stock again for an order whose stock was released (e.g. a resubmitted rejected payment). */
async function reserveStock(order: OrderDocument, actor: PaymentActor, session: ClientSession) {
  for (const item of order.items) {
    try {
      await applyStockChange(
        {
          productId: item.product,
          variantSku: item.variantSku,
          change: -item.quantity,
          reason: 'order',
          orderId: order._id,
          userId: actor.userId,
          note: `Re-reserved for ${order.orderNumber}`,
        },
        { session, requireActive: true },
      );
    } catch (err) {
      if (err instanceof AppError && (err.code === 'INSUFFICIENT_STOCK' || err.code === 'VARIANT_NOT_FOUND')) {
        throw new AppError(
          `${item.name} (${item.size}, ${item.colour}) has sold out since your order was placed. Please place a new order.`,
          409,
          'OUT_OF_STOCK',
          { productId: String(item.product), variantSku: item.variantSku, available: 0 },
        );
      }
      throw err;
    }
  }
}

function assertCustomerAccess(order: OrderDocument, access: CustomerAccess) {
  const isOwner = Boolean(access.userId && order.user && String(order.user) === access.userId);
  const phoneMatches = Boolean(access.phone && access.phone === order.customer.phone);
  // Same response as a missing order, so order numbers cannot be probed.
  if (!isOwner && !phoneMatches) throw AppError.notFound('Order not found', 'ORDER_NOT_FOUND');
}

/* ------------------------------------------------------------------ */
/* Customer actions                                                    */
/* ------------------------------------------------------------------ */

export async function submitPaymentProof(
  orderNumber: string,
  input: { phone: string; network: MobileMoneyNetwork; payerPhone: string; transactionRef: string },
) {
  return transitionOrder({
    orderNumber,
    actor: { userId: null },
    authorize: (order) => assertCustomerAccess(order, { phone: input.phone }),
    decide: async (order, session) => {
      const alreadyUsed = await OrderModel.exists({
        _id: { $ne: order._id },
        'payment.network': input.network,
        'payment.transactionRef': input.transactionRef,
      }).session(session);
      if (alreadyUsed) {
        throw AppError.conflict(
          'This transaction reference has already been used for another order',
          'TRANSACTION_REF_USED',
        );
      }
      return getProviderByName(order.payment.provider).submitProof(toPaymentContext(order), {
        network: input.network,
        payerPhone: input.payerPhone,
        transactionRef: input.transactionRef,
      });
    },
  });
}

export async function cancelOrderByCustomer(orderNumber: string, access: CustomerAccess) {
  return transitionOrder({
    orderNumber,
    actor: { userId: access.userId ? new Types.ObjectId(access.userId) : null },
    authorize: (order) => assertCustomerAccess(order, access),
    decide: async (order) => {
      if (!CUSTOMER_CANCELLABLE_STATUSES.includes(order.status as OrderStatus)) {
        throw AppError.conflict(
          'This order can no longer be cancelled online. Please contact us.',
          'ORDER_NOT_CANCELLABLE',
        );
      }
      return { status: 'cancelled', payment: {}, note: 'Cancelled by customer' };
    },
  });
}

export async function findOrderForCustomer(orderNumber: string, access: CustomerAccess) {
  const order = await OrderModel.findOne({ orderNumber });
  if (!order) throw AppError.notFound('Order not found', 'ORDER_NOT_FOUND');
  assertCustomerAccess(order, access);
  return order;
}

/** Instructions are only relevant while the customer still has something to do or pay. */
export async function getInstructionsIfRelevant(order: OrderDocument): Promise<PaymentInstructions | null> {
  const relevant: OrderStatus[] = ['awaiting_payment', 'payment_rejected', 'pending_confirmation', 'confirmed'];
  if (!relevant.includes(order.status as OrderStatus)) return null;
  return getProviderByName(order.payment.provider).getInstructions(toPaymentContext(order));
}

/* ------------------------------------------------------------------ */
/* Admin actions                                                       */
/* ------------------------------------------------------------------ */

export type AdminSettableStatus = (typeof ADMIN_SETTABLE_STATUSES)[number];

export async function adminUpdateStatus(
  orderNumber: string,
  status: AdminSettableStatus,
  adminId: string,
  note?: string,
) {
  return transitionOrder({
    orderNumber,
    actor: { userId: new Types.ObjectId(adminId) },
    decide: async () => ({ status, payment: {}, note: note ?? `Status set to ${status}` }),
  });
}

export async function adminVerifyPayment(orderNumber: string, adminId: string, note?: string) {
  const actor = { userId: new Types.ObjectId(adminId) };
  return transitionOrder({
    orderNumber,
    actor,
    decide: async (order) => {
      const result = await getProviderByName(order.payment.provider).verify(toPaymentContext(order), actor);
      return note ? { ...result, note: `${result.note}. ${note}` } : result;
    },
  });
}

export async function adminRejectPayment(orderNumber: string, adminId: string, reason: string) {
  const actor = { userId: new Types.ObjectId(adminId) };
  return transitionOrder({
    orderNumber,
    actor,
    decide: async (order) =>
      getProviderByName(order.payment.provider).reject(toPaymentContext(order), actor, reason),
  });
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function mergeLines(items: CreateOrderInput['items']): CreateOrderInput['items'] {
  const merged = new Map<string, CreateOrderInput['items'][number]>();
  for (const item of items) {
    const key = `${item.productId}:${item.variantSku}`;
    const existing = merged.get(key);
    if (existing) existing.quantity += item.quantity;
    else merged.set(key, { ...item });
  }
  return [...merged.values()];
}

function outOfStock(productName: string, line: CreateOrderInput['items'][number], available: number) {
  return new AppError(
    available > 0
      ? `Only ${available} left of ${productName} (${line.variantSku})`
      : `${productName} (${line.variantSku}) is out of stock`,
    409,
    'OUT_OF_STOCK',
    { productId: line.productId, variantSku: line.variantSku, available },
  );
}

function isDuplicateOrderNumber(err: unknown): boolean {
  const e = err as { code?: number; keyPattern?: Record<string, unknown> };
  return e?.code === 11000 && Boolean(e.keyPattern?.orderNumber);
}
