import { z } from 'zod';

export const NORMALISED_PHONE_REGEX = /^\+260[79]\d{8}$/;

/**
 * Normalises a Zambian mobile number to +260XXXXXXXXX.
 * Accepts 09X/07X local numbers and +2609X/+2607X (with or without "+", or "00").
 * Returns null if the number is not a valid Zambian mobile number.
 */
export function normalisePhone(input: string): string | null {
  const compact = input.replace(/[\s\-().]/g, '');

  const local = /^0([79]\d{8})$/.exec(compact);
  if (local) return `+260${local[1]}`;

  const international = /^(?:\+|00)?260([79]\d{8})$/.exec(compact);
  if (international) return `+260${international[1]}`;

  return null;
}

export function isNormalisedPhone(value: string): boolean {
  return NORMALISED_PHONE_REGEX.test(value);
}

/** Zod schema that accepts any supported format and outputs +260XXXXXXXXX. */
export const zambianPhoneSchema = z.string().trim().transform((value, ctx) => {
  const normalised = normalisePhone(value);
  if (!normalised) {
    ctx.addIssue({
      code: 'custom',
      message: 'Enter a valid Zambian mobile number, e.g. 0971234567',
    });
    return z.NEVER;
  }
  return normalised;
});
