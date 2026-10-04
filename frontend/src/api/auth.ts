import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, isApiError } from './client'
import type { AuthResponse, LoginInput, RegisterInput, UpdateMeInput, User } from './types'

export const authKeys = {
  me: ['auth', 'me'] as const,
}

/** The signed-in user, or null for guests. Never throws for "not signed in". */
export function useMe() {
  return useQuery({
    queryKey: authKeys.me,
    queryFn: async (): Promise<User | null> => {
      try {
        return (await api.get<{ user: User }>('/auth/me')).data.user
      } catch (error) {
        if (isApiError(error) && error.status === 401) return null
        throw error
      }
    },
    staleTime: 5 * 60_000,
  })
}

export function useLogin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: LoginInput) => (await api.post<AuthResponse>('/auth/login', input)).data,
    onSuccess: ({ user }) => {
      queryClient.setQueryData(authKeys.me, user)
      queryClient.invalidateQueries({ queryKey: ['orders', 'mine'] })
    },
  })
}

export function useRegister() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: RegisterInput) => (await api.post<AuthResponse>('/auth/register', input)).data,
    onSuccess: ({ user }) => queryClient.setQueryData(authKeys.me, user),
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      await api.post('/auth/logout')
    },
    onSuccess: () => {
      queryClient.setQueryData(authKeys.me, null)
      queryClient.removeQueries({ queryKey: ['orders', 'mine'] })
      queryClient.removeQueries({ queryKey: ['admin'] })
    },
  })
}

export function useUpdateMe() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: UpdateMeInput) => (await api.patch<{ user: User }>('/auth/me', input)).data.user,
    onSuccess: (user) => queryClient.setQueryData(authKeys.me, user),
  })
}
