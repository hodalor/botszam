import { isValidObjectId } from 'mongoose';
import { z } from 'zod';

export const objectIdSchema = z
  .string()
  .trim()
  .refine((value) => /^[a-f\d]{24}$/i.test(value) && isValidObjectId(value), 'Invalid id');

export const ngweeSchema = z.number().int('Amounts must be whole ngwee').min(0);

/** Query-string boolean: accepts "true"/"false". */
export const queryBoolean = z.enum(['true', 'false']).transform((value) => value === 'true');

export const lusakaDaySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD');

export const paginationQuery = {
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
};

export function paginationMeta(page: number, limit: number, total: number) {
  return { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
}

export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export const idParams = z.object({ id: objectIdSchema });
export const orderNumberParams = z.object({
  orderNumber: z.string().trim().toUpperCase().regex(/^[A-Z]{2,5}-\d{6}-\d{4}$/, 'Invalid order number'),
});
