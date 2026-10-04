import { MessageCircle, Phone, Printer } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import {
  useAdminOrder,
  useRejectPayment,
  useUpdateOrderStatus,
  useVerifyPayment,
} from '@/api/admin'
import type { AdminSettableStatus } from '@/api/types'
import { errorMessage } from '@/api/client'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { Alert, Button, ButtonLink, EmptyState, Input, Select, Skeleton, Textarea } from '@/components/ui'
import { adminNextStatuses, canRejectPayment, canVerifyPayment } from '@/lib/adminOrderStatus'
import { formatDateTime } from '@/lib/dates'
import { formatKwacha } from '@/lib/money'
import { ORDER_STATUS_META } from '@/lib/orderStatus'
import { formatPhoneLocal, toWhatsAppNumber } from '@/lib/phone'
import { PageMeta } from '@/components/seo/PageMeta'

export function AdminOrderDetailPage() {
  const { orderNumber = '' } = useParams()
  const { data: order, isPending, isError, refetch } = useAdminOrder(orderNumber)
  const verify = useVerifyPayment(orderNumber)
  const reject = useRejectPayment(orderNumber)
  const updateStatus = useUpdateOrderStatus(orderNumber)

  const [verifyOpen, setVerifyOpen] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [nextStatus, setNextStatus] = useState('')
  const [statusNote, setStatusNote] = useState('')
  const [statusOpen, setStatusOpen] = useState(false)

  if (isPending) {
    return (
      <div className="space-y-4 px-4 py-8 sm:px-6 md:px-10">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-56 w-full" />
      </div>
    )
  }

  if (isError || !order) {
    return (
      <div className="px-4 py-8 sm:px-6 md:px-10">
        <EmptyState
          title="Order not found"
          description="It may have been deleted or the number is wrong."
          action={
            <ButtonLink to="/admin/orders" variant="secondary">
              Back to orders
            </ButtonLink>
          }
        />
      </div>
    )
  }

  const nextOptions = adminNextStatuses(order.status)
  const customerWa = toWhatsAppNumber(order.customer.phone)
  const tel = order.customer.phone

  const applyStatus = async () => {
    if (!nextStatus) return
    try {
      await updateStatus.mutateAsync({
        status: nextStatus as AdminSettableStatus,
        note: statusNote.trim() || undefined,
      })
      toast.success(`Status updated to ${ORDER_STATUS_META[nextStatus as AdminSettableStatus].label}`)
      setStatusOpen(false)
      setNextStatus('')
      setStatusNote('')
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  return (
    <>
      <PageMeta title={orderNumber ? `Order ${orderNumber}` : 'Order'} noIndex />
      <AdminPageHeader
        title={order.orderNumber}
        description={`Placed ${formatDateTime(order.createdAt)}`}
        backTo="/admin/orders"
        backLabel="Orders"
        actions={
          <>
            <StatusBadge status={order.status} />
            <ButtonLink to={`/admin/orders/${order.orderNumber}/print`} variant="secondary" size="sm">
              <Printer className="size-4" aria-hidden="true" />
              Packing slip
            </ButtonLink>
          </>
        }
      />

      <div className="grid gap-6 px-4 pb-10 sm:px-6 lg:grid-cols-[1fr_22rem] md:px-10">
        <div className="space-y-6">
          <section className="rounded-md border border-sand bg-cream p-4 sm:p-5">
            <h2 className="text-lg">Customer</h2>
            <p className="mt-2 font-medium">{order.customer.name}</p>
            {order.customer.email && <p className="text-sm text-stone">{order.customer.email}</p>}
            <p className="mt-1 text-sm tabular-nums">{formatPhoneLocal(order.customer.phone)}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <a
                href={`tel:${tel}`}
                className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-md bg-terracotta px-4 text-sm font-medium text-white sm:flex-none"
              >
                <Phone className="size-4" aria-hidden="true" />
                Call
              </a>
              {customerWa && (
                <a
                  href={`https://wa.me/${customerWa}?text=${encodeURIComponent(`Hi ${order.customer.name}, regarding your botszam order ${order.orderNumber}:`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-md border border-charcoal/15 bg-cream px-4 text-sm font-medium sm:flex-none"
                >
                  <MessageCircle className="size-4" aria-hidden="true" />
                  WhatsApp
                </a>
              )}
            </div>

            <h3 className="mt-6 text-sm font-medium">Delivery</h3>
            <p className="mt-1 text-sm">
              {order.deliveryAddress.street}
              <br />
              {order.deliveryAddress.area}
              {order.deliveryAddress.landmark ? ` · ${order.deliveryAddress.landmark}` : ''}
              <br />
              {order.deliveryAddress.zoneName}
            </p>
            {order.deliveryAddress.notes && (
              <p className="mt-2 rounded-md bg-linen px-3 py-2 text-sm text-stone">{order.deliveryAddress.notes}</p>
            )}
          </section>

          <section className="rounded-md border border-sand bg-cream p-4 sm:p-5">
            <h2 className="text-lg">Items</h2>
            <ul className="mt-3 divide-y divide-sand">
              {order.items.map((item) => (
                <li key={`${item.variantSku}-${item.product}`} className="flex justify-between gap-3 py-3 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-stone">
                      {item.size} · {item.colour} · {item.variantSku}
                    </p>
                    <p className="tabular-nums text-stone">
                      {item.quantity} × {formatKwacha(item.unitPriceNgwee)}
                    </p>
                  </div>
                  <p className="shrink-0 tabular-nums font-medium">
                    {formatKwacha(item.unitPriceNgwee * item.quantity)}
                  </p>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-1 border-t border-sand pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-stone">Subtotal</dt>
                <dd className="tabular-nums">{formatKwacha(order.subtotalNgwee)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-stone">Delivery</dt>
                <dd className="tabular-nums">{formatKwacha(order.deliveryFeeNgwee)}</dd>
              </div>
              <div className="flex justify-between text-base font-medium">
                <dt>Total</dt>
                <dd className="tabular-nums">{formatKwacha(order.totalNgwee)}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-md border border-sand bg-cream p-4 sm:p-5">
            <h2 className="text-lg">Payment</h2>
            <p className="mt-2 text-sm">
              {order.paymentMethod === 'mobile_money' ? 'Mobile money' : 'Pay on delivery'}
            </p>

            {order.paymentMethod === 'mobile_money' && (
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-stone">Network</dt>
                  <dd className="font-medium">{order.payment.network ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-stone">Paid from</dt>
                  <dd className="font-medium tabular-nums">
                    {order.payment.payerPhone ? formatPhoneLocal(order.payment.payerPhone) : '—'}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-stone">Transaction ref</dt>
                  <dd className="font-medium break-all">{order.payment.transactionRef ?? '—'}</dd>
                </div>
                {order.payment.submittedAt && (
                  <div>
                    <dt className="text-stone">Submitted</dt>
                    <dd>{formatDateTime(order.payment.submittedAt)}</dd>
                  </div>
                )}
                {order.payment.rejectionReason && (
                  <div className="sm:col-span-2">
                    <Alert tone="danger">Rejected: {order.payment.rejectionReason}</Alert>
                  </div>
                )}
              </dl>
            )}

            {order.paymentMethod === 'pay_on_delivery' && order.status === 'pending_confirmation' && (
              <Alert tone="info" className="mt-3">
                Call the customer to confirm before moving the order forward.
              </Alert>
            )}

            {(canVerifyPayment(order.status) || canRejectPayment(order.status)) && (
              <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                {canVerifyPayment(order.status) && (
                  <Button type="button" fullWidth onClick={() => setVerifyOpen(true)}>
                    Verify payment
                  </Button>
                )}
                {canRejectPayment(order.status) && (
                  <Button type="button" variant="secondary" fullWidth onClick={() => setRejectOpen(true)}>
                    Reject
                  </Button>
                )}
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-md border border-sand bg-cream p-4 sm:p-5">
            <h2 className="text-lg">Update status</h2>
            {nextOptions.length === 0 ? (
              <p className="mt-2 text-sm text-stone">No status changes available from here.</p>
            ) : (
              <div className="mt-3 space-y-3">
                <Select
                  label="Next status"
                  placeholder="Choose…"
                  value={nextStatus}
                  onChange={(e) => setNextStatus(e.target.value)}
                  options={nextOptions.map((s) => ({ value: s, label: ORDER_STATUS_META[s].label }))}
                />
                <Textarea
                  label="Note"
                  optional
                  rows={2}
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  placeholder="Optional note for the history"
                />
                <Button
                  type="button"
                  fullWidth
                  disabled={!nextStatus}
                  onClick={() => setStatusOpen(true)}
                >
                  Apply status
                </Button>
              </div>
            )}
          </section>

          <section className="rounded-md border border-sand bg-cream p-4 sm:p-5">
            <h2 className="text-lg">History</h2>
            <ol className="mt-3 space-y-3">
              {(order.statusHistory ?? []).map((entry, i) => (
                <li key={`${entry.status}-${entry.at}-${i}`} className="border-l-2 border-sand pl-3 text-sm">
                  <p className="font-medium">{ORDER_STATUS_META[entry.status].label}</p>
                  <p className="text-xs text-stone">{formatDateTime(entry.at)}</p>
                  {entry.note && <p className="mt-0.5 text-stone">{entry.note}</p>}
                  {entry.by && typeof entry.by === 'object' && (
                    <p className="text-xs text-stone">by {entry.by.name}</p>
                  )}
                </li>
              ))}
              {(order.statusHistory ?? []).length === 0 && (
                <li className="text-sm text-stone">No history recorded.</li>
              )}
            </ol>
          </section>

          <p className="text-center text-sm">
            <Link to="/admin/orders" className="text-stone underline-offset-4 hover:text-charcoal hover:underline">
              ← All orders
            </Link>
          </p>
        </aside>
      </div>

      <ConfirmDialog
        open={verifyOpen}
        onClose={() => setVerifyOpen(false)}
        title="Verify payment?"
        description={`Mark ${order.orderNumber} as paid for ${formatKwacha(order.totalNgwee)}.`}
        confirmLabel="Verify payment"
        loading={verify.isPending}
        onConfirm={async () => {
          try {
            await verify.mutateAsync({})
            toast.success('Payment verified')
            setVerifyOpen(false)
            void refetch()
          } catch (error) {
            toast.error(errorMessage(error))
          }
        }}
      />

      <ConfirmDialog
        open={rejectOpen}
        onClose={() => !reject.isPending && setRejectOpen(false)}
        title="Reject payment?"
        description="Stock will be released. The customer can resubmit proof."
        confirmLabel="Reject payment"
        tone="danger"
        loading={reject.isPending}
        onConfirm={async () => {
          if (rejectReason.trim().length < 3) {
            toast.error('Enter a reason (at least 3 characters)')
            return
          }
          try {
            await reject.mutateAsync({ reason: rejectReason.trim() })
            toast.success('Payment rejected')
            setRejectOpen(false)
            setRejectReason('')
            void refetch()
          } catch (error) {
            toast.error(errorMessage(error))
          }
        }}
      >
        <Input
          label="Reason"
          required
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="e.g. Transaction ID not found on statement"
        />
      </ConfirmDialog>

      <ConfirmDialog
        open={statusOpen}
        onClose={() => setStatusOpen(false)}
        title="Update order status?"
        description={
          nextStatus
            ? `Change to “${ORDER_STATUS_META[nextStatus as AdminSettableStatus].label}”.`
            : undefined
        }
        confirmLabel="Update"
        tone={nextStatus === 'cancelled' ? 'danger' : 'default'}
        loading={updateStatus.isPending}
        onConfirm={applyStatus}
      />
    </>
  )
}
