import { Check, X } from 'lucide-react'
import type { CustomerOrder } from '@/api/types'
import { cn } from '@/lib/cn'
import { formatDateTime } from '@/lib/dates'
import { buildTimeline } from '@/lib/orderStatus'

export function OrderTimeline({ order }: { order: CustomerOrder }) {
  const steps = buildTimeline(order)

  return (
    <ol className="flex flex-col" aria-label="Order progress">
      {steps.map((step, i) => {
        const last = i === steps.length - 1
        return (
          <li key={step.key} className="relative flex gap-4 pb-6 last:pb-0" aria-current={step.state === 'current' ? 'step' : undefined}>
            {!last && (
              <span
                className={cn(
                  'absolute left-[0.6875rem] top-7 h-[calc(100%-1.75rem)] w-px',
                  step.state === 'done' ? 'bg-charcoal/40' : 'bg-sand-deep',
                )}
                aria-hidden="true"
              />
            )}
            <span
              className={cn(
                'relative z-10 mt-0.5 flex size-[1.375rem] shrink-0 items-center justify-center rounded-full border',
                step.state === 'done' && 'border-charcoal bg-charcoal text-linen',
                step.state === 'current' && 'border-terracotta bg-cream',
                step.state === 'upcoming' && 'border-sand-deep bg-cream',
                step.state === 'failed' && 'border-danger bg-danger text-white',
              )}
              aria-hidden="true"
            >
              {step.state === 'done' && <Check className="size-3" strokeWidth={2.5} />}
              {step.state === 'failed' && <X className="size-3" strokeWidth={2.5} />}
              {step.state === 'current' && <span className="size-2 animate-pulse rounded-full bg-terracotta" />}
            </span>
            <div className="min-w-0">
              <p
                className={cn(
                  'text-[0.9375rem] leading-snug',
                  step.state === 'upcoming' ? 'text-stone' : 'font-medium text-charcoal',
                  step.state === 'failed' && 'text-danger',
                )}
              >
                {step.label}
                <span className="sr-only">
                  {step.state === 'done' ? ' (done)' : step.state === 'current' ? ' (current step)' : step.state === 'failed' ? '' : ' (upcoming)'}
                </span>
              </p>
              {step.at && <p className="mt-0.5 text-xs text-stone tabular-nums">{formatDateTime(step.at)}</p>}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
