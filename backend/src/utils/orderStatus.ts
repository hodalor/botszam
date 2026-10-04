export const PAYMENT_METHODS = ['mobile_money', 'pay_on_delivery'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const ORDER_STATUSES = [
  'awaiting_payment',
  'payment_submitted',
  'paid',
  'pending_confirmation',
  'confirmed',
  'processing',
  'out_for_delivery',
  'delivered',
  'cancelled',
  'payment_rejected',
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const INITIAL_STATUS: Record<PaymentMethod, OrderStatus> = {
  mobile_money: 'awaiting_payment',
  pay_on_delivery: 'pending_confirmation',
};

/** Allowed status transitions. Terminal statuses have no outgoing transitions. */
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  awaiting_payment: ['payment_submitted', 'cancelled'],
  payment_submitted: ['paid', 'payment_rejected', 'cancelled'],
  // Stock is released on rejection; resubmitting proof re-reserves it (or fails if it sold out).
  payment_rejected: ['payment_submitted'],
  paid: ['processing', 'cancelled'],
  pending_confirmation: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['out_for_delivery', 'cancelled'],
  out_for_delivery: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ORDER_STATUS_TRANSITIONS[from].includes(to);
}

/** Statuses where reserved stock has been released back to inventory. */
export const STOCK_RELEASED_STATUSES: readonly OrderStatus[] = ['cancelled', 'payment_rejected'];

export const CUSTOMER_CANCELLABLE_STATUSES: readonly OrderStatus[] = [
  'awaiting_payment',
  'pending_confirmation',
];

/** Statuses an admin may set directly. Payment statuses go through the payment endpoints. */
export const ADMIN_SETTABLE_STATUSES = [
  'confirmed',
  'processing',
  'out_for_delivery',
  'delivered',
  'cancelled',
] as const satisfies readonly OrderStatus[];

/** Orders whose money has been received (mobile money verified, or cash collected on delivery). */
export const REVENUE_FILTER = {
  $or: [
    { paymentMethod: 'mobile_money', status: { $in: ['paid', 'processing', 'out_for_delivery', 'delivered'] } },
    { paymentMethod: 'pay_on_delivery', status: 'delivered' },
  ],
};
