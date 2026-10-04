import { AlertCircle, Lock } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { DeliveryZone } from '@/api/types'
import type { CheckedLine } from '@/components/cart/useCartCheck'
import { PaymentBadges } from '@/components/layout/PaymentBadges'
import { Alert, Button, ProductImage, Spinner } from '@/components/ui'
import { cn } from '@/lib/cn'
import { formatKwacha } from '@/lib/money'
import { useCart } from '@/stores/cart'
import type { StockIssue } from './checkoutForm'

interface CheckoutSummaryProps {
  lines: CheckedLine[]
  subtotalNgwee: number
  zone: DeliveryZone | undefined
  checking: boolean
  stockIssue: StockIssue | null
  formError: string | null
  submitting: boolean
  submitDisabled: boolean
}

export function CheckoutSummary({
  lines,
  subtotalNgwee,
  zone,
  checking,
  stockIssue,
  formError,
  submitting,
  submitDisabled,
}: CheckoutSummaryProps) {
  const totalNgwee = subtotalNgwee + (zone?.feeNgwee ?? 0)
  const blockedCount = lines.filter((l) => l.blocked).length

  return (
    <aside
      aria-labelledby="checkout-summary"
      className="h-fit rounded-md border border-sand bg-cream p-5 md:p-7 lg:sticky lg:top-28"
    >
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="checkout-summary" className="text-2xl">
          Order summary
        </h2>
        <Link to="/cart" className="text-sm text-charcoal-soft underline-offset-4 hover:text-charcoal hover:underline">
          Edit cart
        </Link>
      </div>

      <ul className="mt-5 divide-y divide-sand border-y border-sand">
        {lines.map((line) => (
          <SummaryLine
            key={line.item.key}
            line={line}
            issue={stockIssue?.key === line.item.key ? stockIssue : null}
          />
        ))}
      </ul>

      <dl className="mt-5 flex flex-col gap-3 text-[0.9375rem]">
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-charcoal-soft">Subtotal</dt>
          <dd className="tabular-nums">{formatKwacha(subtotalNgwee)}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-charcoal-soft">
            Delivery
            {zone && <span className="block text-xs text-stone">{zone.name} · {zone.estimatedDays}</span>}
          </dt>
          <dd className={cn('text-right tabular-nums', !zone && 'text-sm text-stone')}>
            {zone ? (zone.feeNgwee === 0 ? 'Free' : formatKwacha(zone.feeNgwee)) : 'Choose a zone'}
          </dd>
        </div>
        <div className="mt-1 flex items-baseline justify-between gap-4 border-t border-sand pt-4">
          <dt className="font-medium">Total</dt>
          <dd className="font-display text-2xl tabular-nums" aria-live="polite">
            {formatKwacha(totalNgwee)}
          </dd>
        </div>
      </dl>

      <div className="mt-5 flex flex-col gap-3">
        {checking && (
          <p className="flex items-center gap-2 text-sm text-stone" aria-live="polite">
            <Spinner size="sm" label={null} /> Checking prices and stock…
          </p>
        )}
        {blockedCount > 0 && (
          <Alert tone="danger">
            {blockedCount === 1 ? 'One item is' : `${blockedCount} items are`} no longer available. Remove{' '}
            {blockedCount === 1 ? 'it' : 'them'} to place your order.
          </Alert>
        )}
        {formError && <Alert tone="danger">{formError}</Alert>}
      </div>

      <Button
        type="submit"
        size="lg"
        fullWidth
        className="mt-5"
        loading={submitting}
        loadingText="Placing your order…"
        disabled={submitDisabled}
        leftIcon={<Lock className="size-4" strokeWidth={1.75} aria-hidden="true" />}
      >
        Place order · {formatKwacha(totalNgwee)}
      </Button>
      <p className="mt-3 text-center text-xs leading-relaxed text-stone">
        Prices and delivery are confirmed by our system when you place the order.
      </p>
      <PaymentBadges className="mt-4 justify-center" />
    </aside>
  )
}

function SummaryLine({ line, issue }: { line: CheckedLine; issue: StockIssue | null }) {
  const setQuantity = useCart((s) => s.setQuantity)
  const removeItem = useCart((s) => s.removeItem)
  const { item } = line
  // The cart re-check may already have lowered the quantity to what is left; then only explain it.
  const adjusted = issue !== null && item.quantity !== issue.quantityAtError
  const problem = issue && !adjusted ? issue.message : line.blocked ? line.notice?.text : null
  const adjustedNote =
    adjusted && !line.blocked && issue.available
      ? `Only ${issue.available} left, so we’ve changed your quantity to ${item.quantity}.`
      : null
  const canReduce = !adjusted && issue?.available != null && issue.available > 0 && issue.available < item.quantity

  return (
    <li className="flex gap-3.5 py-4">
      <div className={cn('relative shrink-0', line.blocked && 'opacity-50 grayscale')}>
        <div className="aspect-[4/5] w-16 overflow-hidden rounded-md bg-sand/60">
          <ProductImage
            src={item.image}
            alt=""
            width={64}
            height={80}
            className="size-full object-cover"
            fallbackClassName="size-full"
          />
        </div>
        <span className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full bg-charcoal text-xs font-medium text-linen tabular-nums">
          {item.quantity}
          <span className="sr-only"> × </span>
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-display text-[1.0625rem] leading-snug">{item.name}</p>
            <p className="mt-0.5 text-sm text-stone">
              {item.size} · {item.colour}
            </p>
          </div>
          <p className={cn('shrink-0 text-[0.9375rem] tabular-nums', line.blocked && 'text-stone line-through')}>
            {formatKwacha(item.unitPriceNgwee * item.quantity)}
          </p>
        </div>
        {adjustedNote && (
          <p className="mt-2 flex items-start gap-1.5 text-sm text-warning" role="status">
            <AlertCircle className="mt-0.5 size-4 shrink-0" strokeWidth={1.5} aria-hidden="true" />
            {adjustedNote}
          </p>
        )}
        {problem && (
          <div className="mt-2" role="alert">
            <p className="flex items-start gap-1.5 text-sm text-danger">
              <AlertCircle className="mt-0.5 size-4 shrink-0" strokeWidth={1.5} aria-hidden="true" />
              {problem}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {canReduce && (
                <Button size="sm" variant="secondary" onClick={() => setQuantity(item.key, issue.available!)}>
                  Change to {issue.available}
                </Button>
              )}
              <Button size="sm" variant="ghost" onClick={() => removeItem(item.key)}>
                Remove<span className="sr-only"> {item.name}</span>
              </Button>
            </div>
          </div>
        )}
      </div>
    </li>
  )
}
