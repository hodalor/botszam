import { keepPreviousData, useInfiniteQuery, useQueries, useQuery } from '@tanstack/react-query'
import { api, cleanParams } from './client'
import type { Paginated, ProductCategory, ProductFacets, ProductFilters, PublicProduct } from './types'

export const productKeys = {
  all: ['products'] as const,
  list: (filters: ProductFilters) => ['products', 'list', filters] as const,
  infinite: (filters: Omit<ProductFilters, 'page'>) => ['products', 'infinite', filters] as const,
  featured: ['products', 'featured'] as const,
  facets: (category?: ProductCategory) => ['products', 'facets', category ?? 'all'] as const,
  detail: (slug: string) => ['products', 'detail', slug] as const,
}

const fetchProducts = async (filters: ProductFilters) =>
  (await api.get<Paginated<PublicProduct>>('/products', { params: cleanParams(filters) })).data

const fetchProduct = async (slug: string) =>
  (await api.get<{ product: PublicProduct }>(`/products/${slug}`)).data.product

export function useProducts(filters: ProductFilters = {}, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: productKeys.list(filters),
    queryFn: () => fetchProducts(filters),
    placeholderData: keepPreviousData,
    enabled: options.enabled ?? true,
  })
}

/** Paged product list for "Load more". */
export function useInfiniteProducts(filters: Omit<ProductFilters, 'page'>, options: { enabled?: boolean } = {}) {
  return useInfiniteQuery({
    queryKey: productKeys.infinite(filters),
    queryFn: ({ pageParam }) => fetchProducts({ ...filters, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.pagination.page < last.pagination.totalPages ? last.pagination.page + 1 : undefined,
    placeholderData: keepPreviousData,
    enabled: options.enabled ?? true,
  })
}

export function useFeaturedProducts() {
  return useQuery({
    queryKey: productKeys.featured,
    queryFn: async () => (await api.get<{ items: PublicProduct[] }>('/products/featured')).data.items,
  })
}

export function useProductFacets(category?: ProductCategory, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: productKeys.facets(category),
    queryFn: async () =>
      (await api.get<{ facets: ProductFacets }>('/products/facets', { params: cleanParams({ category }) })).data
        .facets,
    staleTime: 5 * 60_000,
    enabled: options.enabled ?? true,
  })
}

export function useProduct(slug: string | undefined) {
  return useQuery({
    queryKey: productKeys.detail(slug ?? ''),
    queryFn: () => fetchProduct(slug!),
    enabled: Boolean(slug),
  })
}

/** Live product data for a set of slugs (used to re-check the cart against current prices and stock). */
export function useProductsBySlug(slugs: string[]) {
  return useQueries({
    queries: slugs.map((slug) => ({
      queryKey: productKeys.detail(slug),
      queryFn: () => fetchProduct(slug),
      staleTime: 30_000,
    })),
  })
}
