import axios, { AxiosError } from 'axios'

export const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api').replace(/\/+$/, '')

/** Single axios instance. Auth is an httpOnly cookie set by the API, so credentials must be sent. */
export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  timeout: 20_000,
  headers: { Accept: 'application/json' },
})

export interface ApiErrorDetail {
  path: string
  message: string
}

/** Normalised error thrown by every API call: { message, code, status, details }. */
export class ApiError extends Error {
  readonly code: string
  readonly status: number
  readonly details?: unknown

  constructor(message: string, code: string, status: number, details?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status
    this.details = details
  }

  /** Field-level validation errors, if the API returned them. */
  get fieldErrors(): ApiErrorDetail[] {
    return Array.isArray(this.details) ? (this.details as ApiErrorDetail[]) : []
  }
}

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ error?: { message?: string; code?: string; details?: unknown } }>) => {
    if (error.response) {
      const body = error.response.data?.error
      return Promise.reject(
        new ApiError(
          body?.message ?? 'Something went wrong. Please try again.',
          body?.code ?? 'UNKNOWN_ERROR',
          error.response.status,
          body?.details,
        ),
      )
    }
    const timedOut = error.code === 'ECONNABORTED'
    return Promise.reject(
      new ApiError(
        timedOut
          ? 'The request took too long. Please check your connection and try again.'
          : 'Could not reach the server. Please check your connection.',
        timedOut ? 'TIMEOUT' : 'NETWORK_ERROR',
        0,
      ),
    )
  },
)

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}

export function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return 'Something went wrong. Please try again.'
}

/** Drops undefined/empty values so they are not sent as query params. */
export function cleanParams<T extends object>(params: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ''),
  ) as Partial<T>
}
