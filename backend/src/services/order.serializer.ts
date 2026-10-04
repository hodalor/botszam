import type { Order } from '../models/Order';
import type { PaymentOrderContext } from '../payments';
import type { OrderStatus, PaymentMethod } from '../utils/orderStatus';

type OrderLike = Order & { _id: unknown; createdAt?: Date; updatedAt?: Date };

export function toPaymentContext(order: OrderLike): PaymentOrderContext {
  const p = order.payment;
  return {
    orderNumber: order.orderNumber,
    totalNgwee: order.totalNgwee,
    paymentMethod: order.paymentMethod as PaymentMethod,
    status: order.status as OrderStatus,
    payment: {
      provider: p.provider,
      network: p.network ?? undefined,
      payerPhone: p.payerPhone ?? undefined,
      transactionRef: p.transactionRef ?? undefined,
      submittedAt: p.submittedAt ?? undefined,
      verifiedAt: p.verifiedAt ?? undefined,
      rejectionReason: p.rejectionReason ?? undefined,
    },
  };
}

/** Customer-facing view: no internal ids of staff and no internal status notes. */
export function toCustomerOrder(order: OrderLike) {
  return {
    orderNumber: order.orderNumber,
    status: order.status,
    paymentMethod: order.paymentMethod,
    customer: {
      name: order.customer.name,
      phone: order.customer.phone,
      email: order.customer.email ?? null,
    },
    deliveryAddress: {
      zoneName: order.deliveryAddress.zoneName,
      area: order.deliveryAddress.area,
      street: order.deliveryAddress.street,
      landmark: order.deliveryAddress.landmark,
      notes: order.deliveryAddress.notes,
    },
    items: order.items.map((item) => ({
      productId: String(item.product),
      variantSku: item.variantSku,
      name: item.name,
      size: item.size,
      colour: item.colour,
      image: item.image ?? null,
      unitPriceNgwee: item.unitPriceNgwee,
      quantity: item.quantity,
      lineTotalNgwee: item.unitPriceNgwee * item.quantity,
    })),
    subtotalNgwee: order.subtotalNgwee,
    deliveryFeeNgwee: order.deliveryFeeNgwee,
    totalNgwee: order.totalNgwee,
    payment: {
      network: order.payment.network ?? null,
      payerPhone: order.payment.payerPhone ?? null,
      transactionRef: order.payment.transactionRef ?? null,
      submittedAt: order.payment.submittedAt ?? null,
      verifiedAt: order.status === 'payment_rejected' ? null : (order.payment.verifiedAt ?? null),
      rejectionReason: order.payment.rejectionReason ?? null,
    },
    statusHistory: order.statusHistory.map((h) => ({ status: h.status, at: h.at })),
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}
