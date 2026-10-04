import { useCallback, useMemo } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { useCategories } from '@/api/store'
import type { ProductCategory, ProductFilters, ProductSort } from '@/api/types'

export const SORT_OPTIONS: { value: ProductSort; label: string }[] = [
  { value: 'featured', label: 'Featured' },
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
]

const SORTS = new Set<string>(SORT_OPTIONS.map((o) => o.value))

/** Whole kwacha in the URL (readable, shareable); converted to ngwee for the API. */
function parseKwacha(value: string | null): number | undefined {
  if (!value) return undefined
  const n = Number(value)
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : undefined
}

export type FilterKey = 'colour' | 'size' | 'min' | 'max' | 'search'

/** Shop filter state, stored in the URL so it survives refreshes, back/forward and sharing. */
export function useShopFilters() {
  const { category: categoryParam } = useParams()
  const [params, setParams] = useSearchParams()
  const categoriesQuery = useCategories()
  const categories = categoriesQuery.data ?? []

  const category = categories.find((c) => c.slug === categoryParam)?.slug as ProductCategory | undefined
  const categoriesReady = !categoriesQuery.isPending && !categoriesQuery.isError
  const invalidCategory = Boolean(categoryParam && categoriesReady && !category)

  const state = useMemo(() => {
    const sortParam = params.get('sort')
    let min = parseKwacha(params.get('min'))
    let max = parseKwacha(params.get('max'))
    if (min !== undefined && max !== undefined && min > max) [min, max] = [max, min]
    return {
      colour: params.get('colour') ?? undefined,
      size: params.get('size') ?? undefined,
      min,
      max,
      search: params.get('search')?.trim() || undefined,
      sort: (sortParam && SORTS.has(sortParam) ? sortParam : 'featured') as ProductSort,
    }
  }, [params])

  const apiFilters: Omit<ProductFilters, 'page'> = useMemo(
    () => ({
      category: categoryParam && !categoriesReady ? (categoryParam as ProductCategory) : category,
      colour: state.colour,
      size: state.size,
      minPrice: state.min !== undefined ? state.min * 100 : undefined,
      maxPrice: state.max !== undefined ? state.max * 100 : undefined,
      search: state.search,
      sort: state.sort,
      limit: 12,
    }),
    [category, categoryParam, categoriesReady, state],
  )

  const update = useCallback(
    (changes: Partial<Record<FilterKey | 'sort', string | number | undefined>>) => {
      setParams(
        (current) => {
          const next = new URLSearchParams(current)
          for (const [key, value] of Object.entries(changes)) {
            if (value === undefined || value === '') next.delete(key)
            else next.set(key, String(value))
          }
          if (next.get('sort') === 'featured') next.delete('sort')
          return next
        },
        { replace: true, preventScrollReset: true },
      )
    },
    [setParams],
  )

  const clearAll = useCallback(
    () => update({ colour: undefined, size: undefined, min: undefined, max: undefined, search: undefined }),
    [update],
  )

  const activeCount =
    (state.colour ? 1 : 0) + (state.size ? 1 : 0) + (state.min !== undefined || state.max !== undefined ? 1 : 0)

  /** Category links keep the search and sort, but drop filters that may not exist in the other category. */
  const categoryHref = useCallback(
    (slug?: ProductCategory) => {
      const keep = new URLSearchParams()
      for (const key of ['search', 'sort']) {
        const value = params.get(key)
        if (value) keep.set(key, value)
      }
      const query = keep.toString()
      return `/shop${slug ? `/${slug}` : ''}${query ? `?${query}` : ''}`
    },
    [params],
  )

  return {
    category,
    categories,
    categoriesLoading: categoriesQuery.isPending,
    invalidCategory,
    ...state,
    apiFilters,
    update,
    clearAll,
    activeCount,
    categoryHref,
  }
}

export type ShopFiltersState = ReturnType<typeof useShopFilters>
