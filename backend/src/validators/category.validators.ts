import { z } from 'zod';

export const categorySlugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(2)
  .max(100)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use a lowercase slug like home-use');

export const createCategorySchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug: categorySlugSchema.optional(),
  description: z.string().trim().max(300).default(''),
  sortOrder: z.number().int().min(0).max(9999).default(0),
  active: z.boolean().default(true),
  imageUrl: z.union([z.url().max(1000), z.literal(''), z.null()]).optional(),
});

export const updateCategorySchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  slug: categorySlugSchema.optional(),
  description: z.string().trim().max(300).optional(),
  sortOrder: z.number().int().min(0).max(9999).optional(),
  active: z.boolean().optional(),
  imageUrl: z.union([z.url().max(1000), z.literal(''), z.null()]).optional(),
});
