import { z } from 'zod'

export const NORMALISED_PHONE_REGEX = /^\+260[79]\d{8}$/

/**
 * Normalises a Zambian mobile number to +260XXXXXXXXX.
 * Accepts 09X/07X local numbers and +2609X/+2607X (with or without "+", or "00"),
 * ignoring spaces, dashes, dots and brackets. Returns null if invalid.
 */
export function normalisePhone(input: string): string | null {
  const compact = input.replace(/[\s\-().]/g, '')

  const local = /^0([79]\d{8})$/.exec(compact)
  if (local) return `+260${local[1]}`

  const international = /^(?:\+|00)?260([79]\d{8})$/.exec(compact)
  if (international) return `+260${international[1]}`

  return null
}

export function isValidZambianPhone(input: string): boolean {
  return normalisePhone(input) !== null
}

/** "+260971234567" → "097 123 4567" (how Zambians usually write numbers). */
export function formatPhoneLocal(phone: string): string {
  const normalised = normalisePhone(phone)
  if (!normalised) return phone
  const digits = `0${normalised.slice(4)}`
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`
}

/** "+260971234567" → "260971234567" for wa.me links. */
export function toWhatsAppNumber(phone: string): string | null {
  return normalisePhone(phone)?.slice(1) ?? null
}

export const PHONE_ERROR = 'Enter a valid Zambian mobile number, e.g. 097 123 4567'

/** Zod schema for form fields: accepts any supported format, outputs +260XXXXXXXXX. */
export const zambianPhoneSchema = z
  .string()
  .trim()
  .min(1, 'Enter your phone number')
  .transform((value, ctx) => {
    const normalised = normalisePhone(value)
    if (!normalised) {
      ctx.addIssue({ code: 'custom', message: PHONE_ERROR })
      return z.NEVER
    }
    return normalised
  })
