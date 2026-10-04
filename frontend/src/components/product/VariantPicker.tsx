import { useId } from 'react'
import type { PublicProduct, PublicVariant } from '@/api/types'
import { cn } from '@/lib/cn'
import { findVariant, sizeForColour } from './variants'

interface VariantPickerProps {
  product: PublicProduct
  colour?: string
  size?: string
  onChange: (selection: { colour: string; size: string }) => void
}

export function VariantPicker({ product, colour, size, onChange }: VariantPickerProps) {
  const name = useId()

  const colourInStock = (c: string) => product.variants.some((v) => v.colour === c && v.inStock)

  return (
    <div className="flex flex-col gap-7">
      <fieldset>
        <legend className="mb-3 text-sm">
          <span className="font-medium">Colour</span>
          <span className="text-stone"> · {colour}</span>
        </legend>
        <div className="flex flex-wrap gap-3">
          {product.colours.map((c) => {
            const id = `${name}-colour-${c.name}`
            const available = colourInStock(c.name)
            return (
              <div key={c.name} className="relative">
                <input
                  type="radio"
                  id={id}
                  name={`${name}-colour`}
                  value={c.name}
                  checked={colour === c.name}
                  onChange={() => onChange({ colour: c.name, size: sizeForColour(product, c.name, size) ?? '' })}
                  className="peer sr-only"
                />
                <label
                  htmlFor={id}
                  title={available ? c.name : `${c.name} (sold out)`}
                  className={cn(
                    'relative flex size-10 cursor-pointer items-center justify-center rounded-full ring-1 ring-charcoal/15 ring-offset-[3px] ring-offset-linen transition-shadow duration-200',
                    'hover:ring-charcoal/40 peer-checked:ring-2 peer-checked:ring-charcoal',
                    'peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-charcoal',
                  )}
                >
                  <span className="size-full rounded-full" style={{ backgroundColor: c.hex ?? undefined }} />
                  {!available && (
                    <span
                      aria-hidden="true"
                      className="absolute left-1/2 top-1/2 h-px w-[130%] -translate-x-1/2 -translate-y-1/2 -rotate-45 bg-charcoal/50"
                    />
                  )}
                  <span className="sr-only">
                    {c.name}
                    {!available && ', sold out'}
                  </span>
                </label>
              </div>
            )
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-3 text-sm font-medium">Size</legend>
        <div className="flex flex-wrap gap-2">
          {product.sizes.map((s) => {
            const id = `${name}-size-${s}`
            const variant = colour ? findVariant(product, colour, s) : undefined
            const exists = Boolean(variant)
            const soldOut = exists && !variant!.inStock
            return (
              <div key={s}>
                <input
                  type="radio"
                  id={id}
                  name={`${name}-size`}
                  value={s}
                  checked={size === s}
                  disabled={!exists}
                  onChange={() => colour && onChange({ colour, size: s })}
                  className="peer sr-only"
                />
                <label
                  htmlFor={id}
                  className={cn(
                    'flex h-11 min-w-16 cursor-pointer items-center justify-center rounded-md border px-4 text-sm transition-colors',
                    'border-sand-deep bg-cream text-charcoal hover:border-charcoal/50',
                    'peer-checked:border-charcoal peer-checked:bg-charcoal peer-checked:text-linen',
                    'peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-charcoal',
                    'peer-disabled:cursor-not-allowed peer-disabled:opacity-40 peer-disabled:hover:border-sand-deep',
                    soldOut && 'text-stone line-through decoration-charcoal/40',
                  )}
                >
                  {s}
                  {soldOut && <span className="sr-only"> (sold out)</span>}
                  {!exists && <span className="sr-only"> (not available in {colour})</span>}
                </label>
              </div>
            )
          })}
        </div>
      </fieldset>
    </div>
  )
}

export function StockStatus({ variant }: { variant?: PublicVariant }) {
  const status = !variant
    ? { tone: 'bg-stone', text: 'Not available in this combination' }
    : !variant.inStock
      ? { tone: 'bg-danger', text: 'Out of stock' }
      : variant.lowStock
        ? {
            tone: 'bg-warning',
            text: variant.stockLeft ? `Only ${variant.stockLeft} left` : 'Only a few left',
          }
        : { tone: 'bg-success', text: 'In stock, ready to deliver' }

  return (
    <p className="flex items-center gap-2.5 text-sm" aria-live="polite">
      <span className="relative flex size-2">
        {variant?.lowStock && (
          <span className={cn('absolute inset-0 animate-ping rounded-full opacity-60', status.tone)} aria-hidden="true" />
        )}
        <span className={cn('relative size-2 rounded-full', status.tone)} aria-hidden="true" />
      </span>
      <span className={cn(variant && !variant.inStock ? 'text-danger' : variant?.lowStock ? 'text-warning' : 'text-charcoal-soft')}>
        {status.text}
      </span>
    </p>
  )
}
