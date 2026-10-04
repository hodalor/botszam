import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './client'
import { productKeys } from './products'
import type {
  CreateOrderInput,
  CustomerOrder,
  OrderWithInstructions,
  Paginated,
  PaymentInstructions,
  PaymentProofInput,
} from './types'

export const orderKeys = {
  mine: (page: number) => ['orders', 'mine', page] as const,
  track: (orderNumber: string, phone: string) => ['orders', 'track', orderNumber, phone] as const,
}

export function useCreateOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateOrderInput) =>
      (await api.post<{ order: CustomerOrder; paymentInstructions: PaymentInstructions }>('/orders', input)).data,
    onSuccess: ({ order, paymentInstructions }) => {
      // Stock changed, and the new order should be visible on the order page without a refetch.
      queryClient.invalidateQueries({ queryKey: productKeys.all })
      queryClient.invalidateQueries({ queryKey: ['orders', 'mine'] })
      queryClient.setQueryData<OrderWithInstructions>(
        orderKeys.track(order.orderNumber, order.customer.phone),
        { order, paymentInstructions },
      )
    },
  })
}

export async function fetchTrackedOrder(orderNumber: string, phone: string) {
  return (await api.get<OrderWithInstructions>('/orders/track', { params: { orderNumber, phone } })).data
}

/** Guest-friendly lookup by order number + phone (phone in +260 format). */
export function useTrackOrder(orderNumber: string | undefined, phone: string | undefined) {
  return useQuery({
    queryKey: orderKeys.track(orderNumber ?? '', phone ?? ''),
    queryFn: () => fetchTrackedOrder(orderNumber!, phone!),
    enabled: Boolean(orderNumber && phone),
    // Customers often wait on this page for payment verification, so keep it fresh.
    refetchOnWindowFocus: true,
    refetchInterval: (query) => (query.state.data?.order.status === 'payment_submitted' ? 30_000 : false),
  })
}

export function useMyOrders(page = 1, enabled = true) {
  return useQuery({
    queryKey: orderKeys.mine(page),
    queryFn: async () => (await api.get<Paginated<CustomerOrder>>('/orders/mine', { params: { page } })).data,
    enabled,
    placeholderData: keepPreviousData,
  })
}

export function useSubmitPaymentProof(orderNumber: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: PaymentProofInput) =>
      (await api.post<{ order: CustomerOrder }>(`/orders/${orderNumber}/payment-proof`, input)).data.order,
    onSuccess: (order) => {
      queryClient.setQueryData<OrderWithInstructions>(
        orderKeys.track(order.orderNumber, order.customer.phone),
        { order, paymentInstructions: null },
      )
      queryClient.invalidateQueries({ queryKey: ['orders', 'mine'] })
    },
  })
}

/** Owners are identified by their session; guests must pass the phone used on the order. */
export function useCancelOrder(orderNumber: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: { phone?: string } = {}) =>
      (await api.post<{ order: CustomerOrder }>(`/orders/${orderNumber}/cancel`, input)).data.order,
    onSuccess: (order) => {
      queryClient.setQueryData<OrderWithInstructions>(
        orderKeys.track(order.orderNumber, order.customer.phone),
        { order, paymentInstructions: null },
      )
      queryClient.invalidateQueries({ queryKey: ['orders', 'mine'] })
      queryClient.invalidateQueries({ queryKey: productKeys.all })
    },
  })
}
