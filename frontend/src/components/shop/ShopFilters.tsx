import { Check } from 'lucide-react'
import { useId, useState, type FormEvent, type ReactNode } from 'react'
import { useProductFacets } from '@/api/products'
import { Button, Skeleton } from '@/components/ui'
import { controlClasses } from '@/components/ui/styles'
import { cn } from '@/lib/cn'
import { formatKwacha } from '@/lib/money'
import type { ShopFiltersState } from './useShopFilters'

function FilterSection({ title, aside, children }: { title: string; aside?: ReactNode; children: ReactNode }) {
  const id = useId()
  return (
    <section aria-labelledby={id} className="border-t border-sand py-6 first:border-t-0 first:pt-0">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h3 id={id} className="font-sans text-xs font-medium uppercase tracking-[0.16em] text-charcoal">
          {title}
        </h3>
        {aside && <span className="truncate text-xs text-stone">{aside}</span>}
      </div>
      {children}
    </section>
  )
}

/** Lightness of a hex colour, used to pick a visible check mark on the swatch. */
function isLight(hex: string | null) {
  if (!hex) return true
  const n = parseInt(hex.slice(1), 16)
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255]
  return 0.299 * r + 0.587 * g + 0.114 * b > 160
}

export function ShopFilters({ filters }: { filters: ShopFiltersState; onNavigate?: () => void }) {
  const facets = useProductFacets(filters.category)

  return (
    <div>
      {facets.isError ? (
        <div className="border-t border-sand py-6 text-sm text-stone" role="alert">
          Filters couldn’t be loaded.{' '}
          <button type="button" onClick={() => facets.refetch()} className="text-terracotta-ink underline underline-offset-4">
            Try again
          </button>
        </div>
      ) : (
        <>
          <FilterSection title="Colour" aside={filters.colour}>
            {facets.isPending ? (
              <div className="flex flex-wrap gap-2.5">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="size-9 rounded-full" />
                ))}
              </div>
            ) : (
              <ul className="flex flex-wrap gap-2.5">
                {facets.data.colours.map((c) => {
                  const selected = filters.colour?.toLowerCase() === c.name.toLowerCase()
                  return (
                    <li key={c.name}>
                      <button
                        type="button"
                        onClick={() => filters.update({ colour: selected ? undefined : c.name })}
                        aria-pressed={selected}
                        aria-label={c.name}
                        title={c.name}
                        className={cn(
                          'relative flex size-9 items-center justify-center rounded-full ring-1 ring-charcoal/15 transition-shadow duration-200',
                          'ring-offset-2 ring-offset-linen hover:ring-charcoal/40',
                          selected && 'ring-2 ring-charcoal hover:ring-charcoal',
                        )}
                        style={{ backgroundColor: c.hex ?? undefined }}
                      >
                        {selected && (
                          <Check
                            className={cn('size-4', isLight(c.hex) ? 'text-charcoal' : 'text-white')}
                            strokeWidth={2}
                            aria-hidden="true"
                          />
                        )}
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </FilterSection>

          <FilterSection title="Size">
            {facets.isPending ? (
              <div className="flex flex-wrap gap-2">
                {[0, 1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-9 w-24" />
                ))}
              </div>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {facets.data.sizes.map((size) => {
                  const selected = filters.size?.toLowerCase() === size.toLowerCase()
                  return (
                    <li key={size}>
                      <button
                        type="button"
                        onClick={() => filters.update({ size: selected ? undefined : size })}
                        aria-pressed={selected}
                        className={cn(
                          'h-9 rounded-md border px-3 text-sm transition-colors',
                          selected
                            ? 'border-charcoal bg-charcoal text-linen'
                            : 'border-sand-deep bg-cream text-charcoal-soft hover:border-charcoal/40 hover:text-charcoal',
                        )}
                      >
                        {size}
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </FilterSection>

          <FilterSection title="Price">
            <PriceRange
              key={`${filters.min ?? ''}-${filters.max ?? ''}`}
              filters={filters}
              floor={facets.data?.minPriceNgwee ?? null}
              ceiling={facets.data?.maxPriceNgwee ?? null}
            />
          </FilterSection>
        </>
      )}
    </div>
  )
}

function PriceRange({
  filters,
  floor,
  ceiling,
}: {
  filters: ShopFiltersState
  floor: number | null
  ceiling: number | null
}) {
  const [min, setMin] = useState(filters.min?.toString() ?? '')
  const [max, setMax] = useState(filters.max?.toString() ?? '')
  const minId = useId()
  const maxId = useId()

  const dirty = min !== (filters.min?.toString() ?? '') || max !== (filters.max?.toString() ?? '')

  const apply = (event: FormEvent) => {
    event.preventDefault()
    filters.update({ min: min.trim() || undefined, max: max.trim() || undefined })
  }

  const input = cn(controlClasses(), 'h-11 pl-8 pr-2 tabular-nums')

  return (
    <form onSubmit={apply} className="flex flex-col gap-3">
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <label htmlFor={minId} className="mb-1.5 block text-xs text-stone">
            Min price<span className="sr-only"> in Kwacha</span>
          </label>
          <div className="relative">
            <span aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-stone">
              K
            </span>
            <input
              id={minId}
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              value={min}
              onChange={(e) => setMin(e.target.value)}
              placeholder={floor !== null ? String(Math.floor(floor / 100)) : '0'}
              className={input}
            />
          </div>
        </div>
        <span aria-hidden="true" className="pb-3 text-stone">
          –
        </span>
        <div className="flex-1">
          <label htmlFor={maxId} className="mb-1.5 block text-xs text-stone">
            Max price<span className="sr-only"> in Kwacha</span>
          </label>
          <div className="relative">
            <span aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-stone">
              K
            </span>
            <input
              id={maxId}
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              value={max}
              onChange={(e) => setMax(e.target.value)}
              placeholder={ceiling !== null ? String(Math.ceil(ceiling / 100)) : 'Any'}
              className={input}
            />
          </div>
        </div>
      </div>
      {floor !== null && ceiling !== null && (
        <p className="text-xs text-stone">
          Prices range from {formatKwacha(floor)} to {formatKwacha(ceiling)}
        </p>
      )}
      <Button type="submit" variant="secondary" size="sm" disabled={!dirty}>
        Apply price
      </Button>
    </form>
  )
}
