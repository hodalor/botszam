import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, cleanParams } from './client'
import { productKeys } from './products'
import { storeKeys } from './store'
import type {
  AdminCategory,
  AdminCustomer,
  AdminCustomerFilters,
  AdminDeliveryZone,
  AdminOrder,
  AdminOrderFilters,
  AdminProduct,
  AdminProductInput,
  AdminSettableStatus,
  AdminSettings,
  AdminStats,
  InventoryAdjustInput,
  InventoryLog,
  InventoryLogFilters,
  LowStockItem,
  Paginated,
  ProductCategory,
} from './types'

export const adminKeys = {
  all: ['admin'] as const,
  stats: ['admin', 'stats'] as const,
  products: (filters: object) => ['admin', 'products', 'list', filters] as const,
  product: (id: string) => ['admin', 'products', 'detail', id] as const,
  orders: (filters: AdminOrderFilters) => ['admin', 'orders', 'list', filters] as const,
  order: (orderNumber: string) => ['admin', 'orders', 'detail', orderNumber] as const,
  lowStock: ['admin', 'inventory', 'low-stock'] as const,
  logs: (filters: InventoryLogFilters) => ['admin', 'inventory', 'logs', filters] as const,
  zones: ['admin', 'delivery-zones'] as const,
  categories: ['admin', 'categories'] as const,
  settings: ['admin', 'settings'] as const,
  customers: (filters: AdminCustomerFilters) => ['admin', 'customers', filters] as const,
}

/* ---------------------------------------------------------------- Stats */

export function useAdminStats() {
  return useQuery({
    queryKey: adminKeys.stats,
    queryFn: async () => (await api.get<AdminStats>('/admin/stats')).data,
    refetchInterval: 60_000,
  })
}

/* ---------------------------------------------------------------- Products */

export interface AdminProductFilters {
  search?: string
  category?: ProductCategory
  active?: boolean
  featured?: boolean
  page?: number
  limit?: number
}

export function useAdminProducts(filters: AdminProductFilters = {}) {
  return useQuery({
    queryKey: adminKeys.products(filters),
    queryFn: async () =>
      (await api.get<Paginated<AdminProduct>>('/admin/products', { params: cleanParams(filters) })).data,
    placeholderData: keepPreviousData,
  })
}

export function useAdminProduct(id: string | undefined) {
  return useQuery({
    queryKey: adminKeys.product(id ?? ''),
    queryFn: async () => (await api.get<{ product: AdminProduct }>(`/admin/products/${id}`)).data.product,
    enabled: Boolean(id),
  })
}

function useInvalidateProducts() {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
    queryClient.invalidateQueries({ queryKey: ['admin', 'inventory'] })
    queryClient.invalidateQueries({ queryKey: adminKeys.stats })
    queryClient.invalidateQueries({ queryKey: productKeys.all })
  }
}

export function useCreateProduct() {
  const invalidate = useInvalidateProducts()
  return useMutation({
    mutationFn: async (input: AdminProductInput) =>
      (await api.post<{ product: AdminProduct }>('/admin/products', input)).data.product,
    onSuccess: invalidate,
  })
}

export function useUpdateProduct(id: string) {
  const invalidate = useInvalidateProducts()
  return useMutation({
    mutationFn: async (input: Partial<AdminProductInput>) =>
      (await api.patch<{ product: AdminProduct }>(`/admin/products/${id}`, input)).data.product,
    onSuccess: invalidate,
  })
}

export function useDeleteProduct() {
  const invalidate = useInvalidateProducts()
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/products/${id}`)
    },
    onSuccess: invalidate,
  })
}

export function useToggleProduct() {
  const invalidate = useInvalidateProducts()
  return useMutation({
    mutationFn: async ({ id, flag }: { id: string; flag: 'active' | 'featured' }) =>
      (await api.post<{ product: AdminProduct }>(`/admin/products/${id}/toggle-${flag}`)).data.product,
    onSuccess: invalidate,
  })
}

export function useUploadProductImages(id: string) {
  const invalidate = useInvalidateProducts()
  return useMutation({
    mutationFn: async (files: File[]) => {
      const form = new FormData()
      for (const file of files) form.append('images', file)
      return (await api.post<{ product: AdminProduct }>(`/admin/products/${id}/images`, form, { timeout: 120_000 }))
        .data.product
    },
    onSuccess: invalidate,
  })
}

export function useUploadColourImages(id: string) {
  const invalidate = useInvalidateProducts()
  return useMutation({
    mutationFn: async ({ colour, files }: { colour: string; files: File[] }) => {
      const form = new FormData()
      form.append('colour', colour)
      for (const file of files) form.append('images', file)
      return (
        await api.post<{ product: AdminProduct }>(`/admin/products/${id}/colour-images`, form, {
          timeout: 120_000,
        })
      ).data.product
    },
    onSuccess: invalidate,
  })
}

/* ---------------------------------------------------------------- Inventory */

export function useLowStock() {
  return useQuery({
    queryKey: adminKeys.lowStock,
    queryFn: async () => (await api.get<{ items: LowStockItem[] }>('/admin/inventory/low-stock')).data.items,
  })
}

export function useInventoryLogs(filters: InventoryLogFilters = {}) {
  return useQuery({
    queryKey: adminKeys.logs(filters),
    queryFn: async () =>
      (await api.get<Paginated<InventoryLog>>('/admin/inventory/logs', { params: cleanParams(filters) })).data,
    placeholderData: keepPreviousData,
  })
}

export function useAdjustInventory() {
  const invalidate = useInvalidateProducts()
  return useMutation({
    mutationFn: async (input: InventoryAdjustInput) =>
      (await api.post<{ productId: string; variantSku: string; stock: number }>('/admin/inventory/adjust', input))
        .data,
    onSuccess: invalidate,
  })
}

/* ---------------------------------------------------------------- Orders */

export function useAdminOrders(filters: AdminOrderFilters = {}) {
  return useQuery({
    queryKey: adminKeys.orders(filters),
    queryFn: async () =>
      (await api.get<Paginated<AdminOrder>>('/admin/orders', { params: cleanParams(filters) })).data,
    placeholderData: keepPreviousData,
  })
}

export function useAdminOrder(orderNumber: string | undefined) {
  return useQuery({
    queryKey: adminKeys.order(orderNumber ?? ''),
    queryFn: async () => (await api.get<{ order: AdminOrder }>(`/admin/orders/${orderNumber}`)).data.order,
    enabled: Boolean(orderNumber),
  })
}

function useOrderMutation<TInput>(orderNumber: string, request: (input: TInput) => Promise<AdminOrder>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: request,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.order(orderNumber) })
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders', 'list'] })
      queryClient.invalidateQueries({ queryKey: adminKeys.stats })
      queryClient.invalidateQueries({ queryKey: ['admin', 'inventory'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
    },
  })
}

export function useUpdateOrderStatus(orderNumber: string) {
  return useOrderMutation(orderNumber, async (input: { status: AdminSettableStatus; note?: string }) =>
    (await api.patch<{ order: AdminOrder }>(`/admin/orders/${orderNumber}/status`, input)).data.order,
  )
}

export function useVerifyPayment(orderNumber: string) {
  return useOrderMutation(orderNumber, async (input: { note?: string } = {}) =>
    (await api.post<{ order: AdminOrder }>(`/admin/orders/${orderNumber}/verify-payment`, input)).data.order,
  )
}

export function useRejectPayment(orderNumber: string) {
  return useOrderMutation(orderNumber, async (input: { reason: string }) =>
    (await api.post<{ order: AdminOrder }>(`/admin/orders/${orderNumber}/reject-payment`, input)).data.order,
  )
}

/* ---------------------------------------------------------------- Delivery zones */

export function useAdminZones() {
  return useQuery({
    queryKey: adminKeys.zones,
    queryFn: async () => (await api.get<{ items: AdminDeliveryZone[] }>('/admin/delivery-zones')).data.items,
  })
}

function useInvalidateZones() {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: adminKeys.zones })
    queryClient.invalidateQueries({ queryKey: storeKeys.deliveryZones })
  }
}

export function useCreateZone() {
  const invalidate = useInvalidateZones()
  return useMutation({
    mutationFn: async (input: Omit<AdminDeliveryZone, '_id'>) =>
      (await api.post<{ zone: AdminDeliveryZone }>('/admin/delivery-zones', input)).data.zone,
    onSuccess: invalidate,
  })
}

export function useUpdateZone() {
  const invalidate = useInvalidateZones()
  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<Omit<AdminDeliveryZone, '_id'>> & { id: string }) =>
      (await api.patch<{ zone: AdminDeliveryZone }>(`/admin/delivery-zones/${id}`, input)).data.zone,
    onSuccess: invalidate,
  })
}

export function useDeleteZone() {
  const invalidate = useInvalidateZones()
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/delivery-zones/${id}`)
    },
    onSuccess: invalidate,
  })
}

/* ---------------------------------------------------------------- Customers */

export function useAdminCustomers(filters: AdminCustomerFilters = {}) {
  return useQuery({
    queryKey: adminKeys.customers(filters),
    queryFn: async () =>
      (await api.get<Paginated<AdminCustomer>>('/admin/customers', { params: cleanParams(filters) })).data,
    placeholderData: keepPreviousData,
  })
}

/* ---------------------------------------------------------------- Categories */

export function useAdminCategories() {
  return useQuery({
    queryKey: adminKeys.categories,
    queryFn: async () => (await api.get<{ items: AdminCategory[] }>('/admin/categories')).data.items,
  })
}

function useInvalidateCategories() {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: adminKeys.categories })
    queryClient.invalidateQueries({ queryKey: storeKeys.categories })
    queryClient.invalidateQueries({ queryKey: productKeys.all })
  }
}

export function useCreateCategory() {
  const invalidate = useInvalidateCategories()
  return useMutation({
    mutationFn: async (input: {
      name: string
      slug?: string
      description?: string
      sortOrder?: number
      active?: boolean
      imageUrl?: string | null
    }) => (await api.post<{ category: AdminCategory }>('/admin/categories', input)).data.category,
    onSuccess: invalidate,
  })
}

export function useUpdateCategory() {
  const invalidate = useInvalidateCategories()
  return useMutation({
    mutationFn: async ({
      id,
      ...input
    }: {
      id: string
      name?: string
      slug?: string
      description?: string
      sortOrder?: number
      active?: boolean
      imageUrl?: string | null
    }) => (await api.patch<{ category: AdminCategory }>(`/admin/categories/${id}`, input)).data.category,
    onSuccess: invalidate,
  })
}

export function useDeleteCategory() {
  const invalidate = useInvalidateCategories()
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/categories/${id}`)
    },
    onSuccess: invalidate,
  })
}

/* ---------------------------------------------------------------- Settings */

export function useAdminSettings() {
  return useQuery({
    queryKey: adminKeys.settings,
    queryFn: async () => (await api.get<{ settings: AdminSettings }>('/admin/settings')).data.settings,
  })
}

export function useSaveSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: AdminSettings) =>
      (await api.put<{ settings: AdminSettings }>('/admin/settings', input)).data.settings,
    onSuccess: (settings) => {
      queryClient.setQueryData(adminKeys.settings, settings)
      queryClient.invalidateQueries({ queryKey: storeKeys.settings })
    },
  })
}
