import type { CustomerOrder, OrderStatus, PaymentMethod } from '@/api/types'
import type { BadgeTone } from '@/components/ui'

interface StatusMeta {
  label: string
  tone: BadgeTone
  /** Customer-facing explanation of what is happening now. */
  description: string
}

export const ORDER_STATUS_META: Record<OrderStatus, StatusMeta> = {
  awaiting_payment: {
    label: 'Awaiting payment',
    tone: 'accent',
    description: 'Send your mobile money payment, then tell us the transaction ID.',
  },
  payment_submitted: {
    label: 'Verifying payment',
    tone: 'info',
    description: 'We’re matching your payment against our mobile money statement.',
  },
  paid: { label: 'Payment received', tone: 'success', description: 'Your payment is confirmed. We’re getting your order ready.' },
  pending_confirmation: {
    label: 'Awaiting confirmation',
    tone: 'accent',
    description: 'We’ll call you shortly to confirm your order and delivery time.',
  },
  confirmed: { label: 'Confirmed', tone: 'success', description: 'Your order is confirmed and will be prepared for delivery.' },
  processing: { label: 'Being prepared', tone: 'info', description: 'We’re folding and packing your towels.' },
  out_for_delivery: { label: 'Out for delivery', tone: 'info', description: 'Your order is on its way to you.' },
  delivered: { label: 'Delivered', tone: 'success', description: 'Delivered. We hope you love them.' },
  cancelled: { label: 'Cancelled', tone: 'neutral', description: 'This order was cancelled.' },
  payment_rejected: {
    label: 'Payment not verified',
    tone: 'danger',
    description: 'We couldn’t verify your payment. Please check the details and submit them again.',
  },
}

/** The happy path for each payment method, used to show upcoming steps. */
const ORDER_FLOW: Record<PaymentMethod, OrderStatus[]> = {
  mobile_money: ['awaiting_payment', 'payment_submitted', 'paid', 'processing', 'out_for_delivery', 'delivered'],
  pay_on_delivery: ['pending_confirmation', 'confirmed', 'processing', 'out_for_delivery', 'delivered'],
}

const STEP_LABELS: Partial<Record<OrderStatus, string>> = {
  awaiting_payment: 'Order placed',
  pending_confirmation: 'Order placed',
  payment_submitted: 'Payment submitted',
}

/** Labels for the step currently in progress, which describe what is pending rather than what happened. */
const PENDING_LABELS: Partial<Record<OrderStatus, (current: OrderStatus) => string>> = {
  payment_submitted: (current) => (current === 'awaiting_payment' ? 'Send your payment' : 'Verifying your payment'),
  confirmed: () => 'Confirmation call',
}

/** Mirrors CUSTOMER_CANCELLABLE_STATUSES on the server, which makes the final decision. */
const CUSTOMER_CANCELLABLE: OrderStatus[] = ['awaiting_payment', 'pending_confirmation']

export function canCustomerCancel(status: OrderStatus): boolean {
  return CUSTOMER_CANCELLABLE.includes(status)
}

export interface TimelineStep {
  key: string
  label: string
  at: string | null
  state: 'done' | 'current' | 'upcoming' | 'failed'
}

function stepLabel(status: OrderStatus) {
  return STEP_LABELS[status] ?? ORDER_STATUS_META[status].label
}

export function buildTimeline(order: CustomerOrder): TimelineStep[] {
  const history = order.statusHistory

  if (order.status === 'cancelled' || order.status === 'payment_rejected') {
    const steps = history.map(
      (entry, i): TimelineStep => ({
        key: `${entry.status}-${i}`,
        label: stepLabel(entry.status),
        at: entry.at,
        state: i === history.length - 1 ? 'failed' : 'done',
      }),
    )
    if (order.status === 'payment_rejected') {
      steps.push({ key: 'resubmit', label: 'Resubmit your payment', at: null, state: 'current' })
    }
    return steps
  }

  const flow = ORDER_FLOW[order.paymentMethod]
  // "Order placed" is complete as soon as the order exists; what's pending is the step after it.
  const activeIndex = Math.max(flow.indexOf(order.status), 1)
  return flow.map((status, i) => ({
    key: status,
    label: i === activeIndex ? (PENDING_LABELS[status]?.(order.status) ?? stepLabel(status)) : stepLabel(status),
    at: history.findLast((h) => h.status === status)?.at ?? null,
    state: i < activeIndex ? 'done' : i === activeIndex ? (order.status === 'delivered' ? 'done' : 'current') : 'upcoming',
  }))
}
