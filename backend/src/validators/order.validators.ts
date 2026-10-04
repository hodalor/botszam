import { z } from 'zod';
import { MOBILE_MONEY_NETWORKS } from '../models/Settings';
import { ADMIN_SETTABLE_STATUSES, ORDER_STATUSES, PAYMENT_METHODS } from '../utils/orderStatus';
import { zambianPhoneSchema } from '../utils/phone';
import { lusakaDaySchema, objectIdSchema, paginationQuery } from '../utils/validation';

const MAX_QUANTITY_PER_VARIANT = 20;

const orderItemSchema = z.object({
  productId: objectIdSchema,
  variantSku: z.string().trim().toUpperCase().min(1).max(64),
  quantity: z.number().int().min(1).max(MAX_QUANTITY_PER_VARIANT),
});

/** Totals and prices are deliberately absent: the server always recalculates them. */
export const createOrderSchema = z.object({
  items: z
    .array(orderItemSchema)
    .min(1, 'Your cart is empty')
    .max(50)
    .superRefine((items, ctx) => {
      const totals = new Map<string, number>();
      for (const i of items) {
        const key = `${i.productId}:${i.variantSku}`;
        totals.set(key, (totals.get(key) ?? 0) + i.quantity);
      }
      if ([...totals.values()].some((q) => q > MAX_QUANTITY_PER_VARIANT)) {
        ctx.addIssue({
          code: 'custom',
          message: `You can order at most ${MAX_QUANTITY_PER_VARIANT} of each item`,
        });
      }
    }),
  customer: z.object({
    name: z.string().trim().min(2).max(120),
    phone: zambianPhoneSchema,
    email: z.email().trim().toLowerCase().max(200).optional(),
  }),
  deliveryAddress: z.object({
    zoneId: objectIdSchema,
    area: z.string().trim().min(2).max(120),
    street: z.string().trim().min(2).max(200),
    landmark: z.string().trim().max(200).optional(),
    notes: z.string().trim().max(500).optional(),
  }),
  paymentMethod: z.enum(PAYMENT_METHODS),
});

export const paymentProofSchema = z.object({
  phone: zambianPhoneSchema,
  network: z.enum(MOBILE_MONEY_NETWORKS),
  payerPhone: zambianPhoneSchema,
  transactionRef: z
    .string()
    .trim()
    .toUpperCase()
    .min(4, 'Enter the transaction ID from your confirmation SMS')
    .max(100)
    .regex(/^[A-Z0-9.\-_/]+$/, 'Transaction ID can only contain letters, numbers and . - _ /'),
});

export const trackOrderQuery = z.object({
  orderNumber: z.string().trim().toUpperCase().min(1).max(30),
  phone: zambianPhoneSchema,
});

export const cancelOrderSchema = z.object({
  phone: zambianPhoneSchema.optional(),
});

export const myOrdersQuery = z.object({ ...paginationQuery });

export const adminOrderListQuery = z.object({
  status: z.enum(ORDER_STATUSES).optional(),
  paymentMethod: z.enum(PAYMENT_METHODS).optional(),
  from: lusakaDaySchema.optional(),
  to: lusakaDaySchema.optional(),
  search: z.string().trim().min(1).max(100).optional(),
  ...paginationQuery,
});

export const adminStatusSchema = z.object({
  status: z.enum(ADMIN_SETTABLE_STATUSES),
  note: z.string().trim().max(500).optional(),
});

export const verifyPaymentSchema = z.object({
  note: z.string().trim().max(500).optional(),
});

export const rejectPaymentSchema = z.object({
  reason: z.string().trim().min(3, 'Give a reason the customer will understand').max(500),
});

export const adminOrderParams = z.object({
  orderNumber: z.string().trim().min(1).max(30),
});
