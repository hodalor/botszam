import { SearchX, SlidersHorizontal, X } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useInfiniteProducts } from '@/api/products'
import { ProductGrid } from '@/components/product/ProductCard'
import { ShopFilters } from '@/components/shop/ShopFilters'
import { SORT_OPTIONS, useShopFilters, type FilterKey } from '@/components/shop/useShopFilters'
import { Button, EmptyState, ErrorState, Modal, Select, Spinner } from '@/components/ui'
import { cn } from '@/lib/cn'
import { PageMeta } from '@/components/seo/PageMeta'
import { NotFoundPage } from './NotFoundPage'

export function ShopPage() {
  const filters = useShopFilters()
  const [sheetOpen, setSheetOpen] = useState(false)
  const current = filters.categories.find((c) => c.slug === filters.category)

  const query = useInfiniteProducts(filters.apiFilters, {
    enabled: !filters.invalidCategory && !filters.categoriesLoading,
  })

  if (filters.invalidCategory) return <NotFoundPage />

  const products = query.data?.pages.flatMap((p) => p.items) ?? []
  const total = query.data?.pages[0]?.pagination.total
  const updating = query.isPlaceholderData || (query.isFetching && !query.isFetchingNextPage && !query.isPending)

  const chips: { key: FilterKey; label: string }[] = []
  if (filters.search) chips.push({ key: 'search', label: `“${filters.search}”` })
  if (filters.colour) chips.push({ key: 'colour', label: filters.colour })
  if (filters.size) chips.push({ key: 'size', label: filters.size })
  if (filters.min !== undefined || filters.max !== undefined) {
    chips.push({
      key: 'min',
      label:
        filters.min !== undefined && filters.max !== undefined
          ? `K ${filters.min} – K ${filters.max}`
          : filters.min !== undefined
            ? `From K ${filters.min}`
            : `Up to K ${filters.max}`,
    })
  }
  const removeChip = (key: FilterKey) =>
    filters.update(key === 'min' ? { min: undefined, max: undefined } : { [key]: undefined })

  const sortSelect = (
    <Select
      label="Sort by"
      hideLabel
      value={filters.sort}
      options={SORT_OPTIONS}
      onChange={(e) => filters.update({ sort: e.target.value })}
      className="w-full sm:w-52"
    />
  )

  const categoryTabs = [
    { slug: undefined as string | undefined, name: 'All', description: 'Everything in stock' },
    ...filters.categories.map((c) => ({ slug: c.slug, name: c.name, description: c.description })),
  ]

  return (
    <>
      <PageMeta
        title={current?.name ?? (filters.search ? `Search: ${filters.search}` : 'Shop')}
        description={
          current
            ? `${current.name} — ${current.description || 'Premium towels from Botswana, delivered across Zambia.'}`
            : 'Shop bath towels, hand towels and sets in heavyweight cotton. Imported from Botswana.'
        }
        path={current ? `/shop/${current.slug}` : filters.search ? `/shop?q=${encodeURIComponent(filters.search)}` : '/shop'}
      />
      <div className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_at_top,_var(--color-rose-soft)_0%,_transparent_60%),radial-gradient(ellipse_at_80%_0%,_var(--color-coral-soft)_0%,_transparent_45%)]"
        />

        <div className="container-page relative">
          <header className="pb-6 pt-10 md:pb-8 md:pt-14">
            <p className="eyebrow mb-3 text-coral">
              {current ? 'Collection' : filters.search ? 'Search' : 'Shop'}
            </p>
            <h1 className="text-[2.5rem] leading-[1.05] md:text-6xl">
              {current?.name ?? (filters.search ? `Results for “${filters.search}”` : 'All towels')}
            </h1>
            <p className="mt-4 max-w-xl text-[0.9375rem] leading-relaxed text-charcoal-soft md:text-base">
              {current?.description ||
                'Bath towels, hand towels and gift sets in heavyweight cotton. All imported from Botswana.'}
            </p>
          </header>

          {/* Marketplace-style aligned category row */}
          <nav aria-label="Product categories" className="-mx-5 mb-8 border-y border-rose/40 bg-cream/80 md:-mx-8">
            <ul className="flex gap-1 overflow-x-auto px-5 py-3 md:justify-center md:gap-2 md:px-8 md:py-3.5">
              {filters.categoriesLoading
                ? [0, 1, 2, 3, 4].map((i) => (
                    <li key={i} className="h-10 w-28 shrink-0 animate-pulse rounded-md bg-sand/70" />
                  ))
                : categoryTabs.map((c) => {
                    const active = filters.category === c.slug
                    return (
                      <li key={c.slug ?? 'all'} className="shrink-0">
                        <Link
                          to={filters.categoryHref(c.slug)}
                          aria-current={active ? 'page' : undefined}
                          className={cn(
                            'inline-flex h-10 items-center rounded-md px-4 text-sm font-medium transition-colors',
                            active
                              ? 'bg-coral text-white shadow-soft'
                              : 'bg-white/70 text-charcoal-soft ring-1 ring-sand hover:bg-rose-soft hover:text-charcoal',
                          )}
                        >
                          {c.name}
                        </Link>
                      </li>
                    )
                  })}
            </ul>
          </nav>

          <div className="sticky top-16 z-20 -mx-5 mb-6 flex items-center gap-3 border-b border-sand bg-linen/95 px-5 py-3 backdrop-blur-md md:top-20 md:-mx-8 md:px-8">
            <Button
              variant="secondary"
              className="flex-1 sm:flex-none"
              onClick={() => setSheetOpen(true)}
              leftIcon={<SlidersHorizontal className="size-4" strokeWidth={1.5} aria-hidden="true" />}
              aria-haspopup="dialog"
            >
              Filters{filters.activeCount > 0 && ` (${filters.activeCount})`}
            </Button>
            <p className="hidden text-sm text-stone sm:block" aria-live="polite">
              {total !== undefined && `${total} ${total === 1 ? 'product' : 'products'}`}
            </p>
            <div className="ml-auto w-full max-w-52">{sortSelect}</div>
          </div>

          {chips.length > 0 && (
            <div className="mb-6 flex flex-wrap items-center gap-2">
              {chips.map((chip) => (
                <button
                  key={chip.key}
                  type="button"
                  onClick={() => removeChip(chip.key)}
                  className="inline-flex h-8 items-center gap-1.5 rounded-full border border-coral/30 bg-rose-soft pl-3 pr-2 text-sm text-charcoal transition-colors hover:border-coral/60"
                >
                  {chip.label}
                  <X className="size-3.5 text-stone" aria-hidden="true" />
                  <span className="sr-only">Remove filter</span>
                </button>
              ))}
              <button
                type="button"
                onClick={filters.clearAll}
                className="px-2 text-sm text-stone underline underline-offset-4 hover:text-charcoal"
              >
                Clear all
              </button>
            </div>
          )}

          {query.isError && !query.data ? (
            <ErrorState
              title="We couldn’t load the shop"
              error={query.error}
              onRetry={() => query.refetch()}
              retrying={query.isFetching}
            />
          ) : !query.isPending && products.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title="No towels match those filters"
              description="Try removing a filter or two, or browse the whole collection."
              action={
                chips.length > 0 ? (
                  <Button variant="secondary" onClick={filters.clearAll}>
                    Clear all filters
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div
              aria-busy={updating || undefined}
              className={updating ? 'opacity-55 transition-opacity duration-300' : 'transition-opacity duration-300'}
            >
              <ProductGrid products={products} loading={query.isPending || filters.categoriesLoading} columns={3} count={6} />
            </div>
          )}

          {query.hasNextPage && total !== undefined && (
            <div className="mt-14 flex flex-col items-center gap-4 pb-16">
              <p className="text-sm text-stone">
                Showing {products.length} of {total}
              </p>
              <div className="h-px w-48 overflow-hidden bg-sand" aria-hidden="true">
                <div
                  className="h-full bg-coral transition-[width] duration-500"
                  style={{ width: `${(products.length / total) * 100}%` }}
                />
              </div>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => query.fetchNextPage()}
                loading={query.isFetchingNextPage}
                loadingText="Loading…"
                className="mt-2 min-w-48"
              >
                Load more
              </Button>
            </div>
          )}
          {query.isError && query.data && (
            <p className="mt-6 pb-10 text-center text-sm text-danger" role="alert">
              More products couldn’t be loaded.{' '}
              <button type="button" className="underline underline-offset-4" onClick={() => query.fetchNextPage()}>
                Try again
              </button>
            </p>
          )}
        </div>
      </div>

      <Modal
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Filters"
        size="md"
        footer={
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={filters.clearAll} disabled={chips.length === 0}>
              Clear all
            </Button>
            <Button className="flex-1" onClick={() => setSheetOpen(false)}>
              {query.isFetching && !query.isFetchingNextPage ? (
                <Spinner size="sm" label={null} />
              ) : total !== undefined ? (
                `Show ${total} ${total === 1 ? 'result' : 'results'}`
              ) : (
                'Show results'
              )}
            </Button>
          </div>
        }
      >
        <div className="px-5 py-6 md:px-6">
          <ShopFilters filters={filters} />
        </div>
      </Modal>
    </>
  )
}
