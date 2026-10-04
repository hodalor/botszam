import { Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/cn'

interface QuantityStepperProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  /** Used in button labels, e.g. "Decrease quantity of Kalahari Bath Towel". */
  itemLabel?: string
  size?: 'sm' | 'md'
  disabled?: boolean
  className?: string
}

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 99,
  itemLabel,
  size = 'md',
  disabled,
  className,
}: QuantityStepperProps) {
  const of = itemLabel ? ` of ${itemLabel}` : ''
  const button =
    'inline-flex items-center justify-center text-charcoal-soft transition-colors hover:bg-sand/60 hover:text-charcoal ' +
    'disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent focus-visible:outline-offset-[-2px]'
  const dims = 'size-11'

  return (
    <div
      role="group"
      aria-label={`Quantity${of}`}
      className={cn('inline-flex items-center rounded-md border border-sand-deep bg-cream', className)}
    >
      <button
        type="button"
        className={cn(button, dims, 'rounded-l-md')}
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={disabled || value <= min}
        aria-label={`Decrease quantity${of}`}
      >
        <Minus className="size-4" aria-hidden="true" />
      </button>
      <output
        className={cn('min-w-8 text-center font-medium tabular-nums', size === 'sm' ? 'text-sm' : 'text-[0.9375rem]')}
        aria-live="polite"
        aria-atomic="true"
      >
        {value}
      </output>
      <button
        type="button"
        className={cn(button, dims, 'rounded-r-md')}
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={disabled || value >= max}
        aria-label={`Increase quantity${of}`}
      >
        <Plus className="size-4" aria-hidden="true" />
      </button>
    </div>
  )
}
