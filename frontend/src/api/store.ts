import { useQuery } from '@tanstack/react-query'
import { api } from './client'
import type { DeliveryZone, PublicSettings, StoreCategory } from './types'

export const storeKeys = {
  deliveryZones: ['delivery-zones'] as const,
  settings: ['settings', 'public'] as const,
  categories: ['categories', 'public'] as const,
}

export function useDeliveryZones() {
  return useQuery({
    queryKey: storeKeys.deliveryZones,
    queryFn: async () => (await api.get<{ items: DeliveryZone[] }>('/delivery-zones')).data.items,
    staleTime: 10 * 60_000,
  })
}

export function usePublicSettings() {
  return useQuery({
    queryKey: storeKeys.settings,
    queryFn: async () => (await api.get<{ settings: PublicSettings }>('/settings/public')).data.settings,
    staleTime: 10 * 60_000,
  })
}

export function useCategories() {
  return useQuery({
    queryKey: storeKeys.categories,
    queryFn: async () => (await api.get<{ items: StoreCategory[] }>('/categories')).data.items,
    staleTime: 5 * 60_000,
  })
}
