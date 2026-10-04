import { QueryClient } from '@tanstack/react-query'
import { isApiError } from './client'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      refetchOnWindowFocus: false,
      // Client errors (404, 401, validation) will not succeed on retry.
      retry: (failureCount, error) => {
        if (isApiError(error) && error.status >= 400 && error.status < 500) return false
        return failureCount < 2
      },
    },
    mutations: { retry: false },
  },
})
