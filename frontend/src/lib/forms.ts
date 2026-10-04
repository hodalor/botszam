import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'
import { z } from 'zod'
import { isApiError } from '@/api/client'

/**
 * Copies server validation errors (paths like "customer.phone") onto form fields.
 * Returns true if at least one field error was applied.
 */
export function applyServerFieldErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  paths: Record<string, Path<T>>,
): boolean {
  if (!isApiError(error)) return false
  let applied = false
  for (const detail of error.fieldErrors) {
    const field = paths[detail.path]
    if (!field) continue
    setError(field, { type: 'server', message: detail.message }, { shouldFocus: !applied })
    applied = true
  }
  return applied
}

/** Empty string or a valid email; trimmed and lower-cased. */
export const optionalEmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(200, 'That email is too long')
  .refine((v) => v === '' || z.email().safeParse(v).success, 'Enter a valid email address')

export const nameSchema = z
  .string()
  .trim()
  .min(2, 'Enter your name')
  .max(120, 'That name is too long')

export const passwordSchema = z
  .string()
  .min(8, 'Use at least 8 characters')
  .max(72, 'Use at most 72 characters')

/** Matches the server: letters, digits and . - _ / (spaces are removed, letters upper-cased). */
export const transactionRefSchema = z
  .string()
  .transform((v) => v.replace(/\s+/g, '').toUpperCase())
  .pipe(
    z
      .string()
      .min(4, 'Enter the transaction ID from your confirmation SMS')
      .max(100, 'That transaction ID is too long')
      .regex(/^[A-Z0-9.\-_/]+$/, 'Use only letters, numbers and . - _ /'),
  )
