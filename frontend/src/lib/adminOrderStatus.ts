import type { AdminSettableStatus, OrderStatus } from '@/api/types'

/** Mirrors backend ORDER_STATUS_TRANSITIONS. */
const TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  awaiting_payment: ['payment_submitted', 'cancelled'],
  payment_submitted: ['paid', 'payment_rejected', 'cancelled'],
  payment_rejected: ['payment_submitted'],
  paid: ['processing', 'cancelled'],
  pending_confirmation: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['out_for_delivery', 'cancelled'],
  out_for_delivery: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
}

const ADMIN_SETTABLE = new Set<OrderStatus>([
  'confirmed',
  'processing',
  'out_for_delivery',
  'delivered',
  'cancelled',
])

/** Statuses an admin may pick in the dropdown for the current order state. */
export function adminNextStatuses(current: OrderStatus): AdminSettableStatus[] {
  return TRANSITIONS[current].filter((s): s is AdminSettableStatus => ADMIN_SETTABLE.has(s))
}

export function canVerifyPayment(status: OrderStatus): boolean {
  return status === 'payment_submitted'
}

export function canRejectPayment(status: OrderStatus): boolean {
  return status === 'payment_submitted'
}
