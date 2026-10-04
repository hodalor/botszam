import { Clock, PhoneCall, Smartphone } from 'lucide-react'
import type { ReactNode } from 'react'
import { usePublicSettings } from '@/api/store'
import type { CustomerOrder, PaymentInstructions } from '@/api/types'
import { Alert, Badge, CopyButton, Skeleton } from '@/components/ui'
import { formatDateTime } from '@/lib/dates'
import { formatKwacha } from '@/lib/money'
import { formatPhoneLocal } from '@/lib/phone'
import { PaymentProofForm } from './PaymentProofForm'

interface PaymentPanelProps {
  order: CustomerOrder
  instructions: PaymentInstructions | null
  accessPhone: string
  onStale: () => void
}

/** The payment-specific part of the order page; renders nothing once payment is no longer the customer's job. */
export function PaymentPanel({ order, instructions, accessPhone, onStale }: PaymentPanelProps) {
  if (order.paymentMethod === 'pay_on_delivery') {
    if (order.status === 'pending_confirmation') {
      return (
        <Panel icon={<PhoneCall className="size-5" strokeWidth={1.5} />} title="We’ll call you to confirm your order">
          <p>
            We’ll call you on <strong className="font-medium text-charcoal">{formatPhoneLocal(order.customer.phone)}</strong> shortly to
            confirm your order and agree a delivery time.
          </p>
          <p className="mt-2">
            Please have <strong className="font-medium text-charcoal">{formatKwacha(order.totalNgwee)}</strong> ready in cash or mobile money
            when your towels arrive.
          </p>
        </Panel>
      )
    }
    if (order.status === 'confirmed' || order.status === 'processing' || order.status === 'out_for_delivery') {
      return (
        <Panel icon={<PhoneCall className="size-5" strokeWidth={1.5} />} title="Pay on delivery">
          <p>
            Please have <strong className="font-medium text-charcoal">{formatKwacha(order.totalNgwee)}</strong> ready in cash or mobile money
            when your towels arrive.
          </p>
        </Panel>
      )
    }
    return null
  }

  if (order.status === 'payment_submitted') {
    return (
      <Panel icon={<Clock className="size-5" strokeWidth={1.5} />} title="Payment submitted — we’re verifying it">
        <p>
          We’re matching your payment against our mobile money statement. This usually takes under an hour during business hours. You can
          close this page; we’ll contact you once it’s confirmed.
        </p>
        <dl className="mt-4 grid gap-x-6 gap-y-2 rounded-md bg-linen-deep/70 p-4 text-sm sm:grid-cols-2">
          <Detail label="Network" value={order.payment.network} />
          <Detail label="Paid from" value={order.payment.payerPhone && formatPhoneLocal(order.payment.payerPhone)} />
          <Detail label="Transaction ID" value={order.payment.transactionRef} mono />
          <Detail label="Submitted" value={order.payment.submittedAt && formatDateTime(order.payment.submittedAt)} />
        </dl>
      </Panel>
    )
  }

  if (order.status !== 'awaiting_payment' && order.status !== 'payment_rejected') return null

  return (
    <div className="flex flex-col gap-6">
      {order.status === 'payment_rejected' && (
        <Alert tone="danger" title="We couldn’t verify your payment">
          {order.payment.rejectionReason && (
            <p>
              <span className="font-medium text-charcoal">Reason:</span> {order.payment.rejectionReason}
            </p>
          )}
          <p className="mt-1">
            Please check the transaction ID in your confirmation SMS and resubmit it below. If the payment didn’t go through, send it again
            first.
          </p>
        </Alert>
      )}
      <MobileMoneyInstructions order={order} instructions={instructions} />
      <section aria-labelledby="proof-heading" className="rounded-md border border-sand bg-cream p-5 md:p-7">
        <h2 id="proof-heading" className="text-2xl">
          {order.status === 'payment_rejected' ? 'Resubmit your payment details' : 'Already paid? Tell us'}
        </h2>
        <p className="mb-6 mt-1 text-sm text-stone">We’ll check these against our statement and confirm your order.</p>
        <PaymentProofForm
          order={order}
          accessPhone={accessPhone}
          networks={instructions?.accounts.map((a) => a.network) ?? []}
          onStale={onStale}
        />
      </section>
    </div>
  )
}

function MobileMoneyInstructions({ order, instructions }: { order: CustomerOrder; instructions: PaymentInstructions | null }) {
  const settings = usePublicSettings()
  const accounts = instructions?.accounts ?? settings.data?.mobileMoneyAccounts ?? []
  const loadingAccounts = !instructions && settings.isPending
  const amount = formatKwacha(order.totalNgwee)
  const amountToCopy = order.totalNgwee % 100 === 0 ? String(order.totalNgwee / 100) : (order.totalNgwee / 100).toFixed(2)

  return (
    <section aria-labelledby="pay-heading" className="overflow-hidden rounded-md border border-charcoal/15 bg-cream">
      <div className="bg-charcoal px-5 py-6 text-linen md:px-7">
        <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-linen/70">
          <Smartphone className="size-4" strokeWidth={1.5} aria-hidden="true" />
          Mobile money payment
        </p>
        <h2 id="pay-heading" className="sr-only">
          Pay {amount} by mobile money
        </h2>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm text-linen/70">Send exactly</p>
            <p className="font-display text-4xl tabular-nums text-linen md:text-5xl">{amount}</p>
          </div>
          <CopyButton value={amountToCopy} label="amount" className="border-linen/25 bg-transparent text-linen hover:border-linen/50 hover:bg-linen/10" />
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-linen/15 pt-4">
          <p className="text-sm">
            <span className="text-linen/70">Reference: </span>
            <span className="font-mono font-medium tracking-wide">{order.orderNumber}</span>
          </p>
          <CopyButton value={order.orderNumber} label="order number" className="border-linen/25 bg-transparent text-linen hover:border-linen/50 hover:bg-linen/10" />
        </div>
      </div>

      <div className="p-5 md:p-7">
        {instructions?.message && <p className="mb-5 text-sm leading-relaxed text-charcoal-soft">{instructions.message}</p>}

        <h3 className="text-sm font-medium">Our mobile money numbers</h3>
        {loadingAccounts ? (
          <div className="mt-3 flex flex-col gap-2">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
        ) : accounts.length === 0 ? (
          <Alert tone="warning" className="mt-3">
            Our payment numbers aren’t available right now. Please chat with us on WhatsApp and we’ll help you pay.
          </Alert>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {accounts.map((account) => (
              <li
                key={`${account.network}-${account.number}`}
                className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-sand bg-linen/60 px-4 py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Badge tone="sand" className="w-16 justify-center">
                    {account.network}
                  </Badge>
                  <div className="min-w-0">
                    <p className="font-mono text-lg font-medium tracking-wide tabular-nums">{formatPhoneLocal(account.number)}</p>
                    <p className="truncate text-xs text-stone">{account.accountName}</p>
                  </div>
                </div>
                <CopyButton value={formatPhoneLocal(account.number).replace(/\s/g, '')} label={`${account.network} number`} />
              </li>
            ))}
          </ul>
        )}

        <h3 className="mt-7 text-sm font-medium">How to pay</h3>
        <ol className="mt-3 flex flex-col gap-3 text-sm leading-relaxed text-charcoal-soft">
          {[
            <>Open your MTN MoMo, Airtel Money or Zamtel Kwacha menu or app.</>,
            <>
              Choose <em>Send money</em> and send exactly <strong className="font-medium text-charcoal">{amount}</strong> to one of the
              numbers above. Check the name shown matches before you confirm.
            </>,
            <>
              If asked for a reference, enter <strong className="font-mono font-medium text-charcoal">{order.orderNumber}</strong>.
            </>,
            <>Wait for the confirmation SMS and note the transaction ID.</>,
            <>Enter the transaction ID below so we can verify your payment.</>,
          ].map((text, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-sand text-xs font-medium text-charcoal tabular-nums">
                {i + 1}
              </span>
              <span className="pt-0.5">{text}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

function Panel({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <section className="rounded-md border border-sand bg-cream p-5 md:p-7" aria-label={title}>
      <div className="flex gap-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-sand/70 text-charcoal" aria-hidden="true">
          {icon}
        </span>
        <div className="min-w-0 text-[0.9375rem] leading-relaxed text-charcoal-soft">
          <h2 className="mb-2 text-xl leading-snug md:text-2xl">{title}</h2>
          {children}
        </div>
      </div>
    </section>
  )
}

function Detail({ label, value, mono }: { label: string; value: string | null | undefined; mono?: boolean }) {
  if (!value) return null
  return (
    <div>
      <dt className="text-xs text-stone">{label}</dt>
      <dd className={mono ? 'font-mono font-medium tracking-wide' : 'font-medium'}>{value}</dd>
    </div>
  )
}
