import { z } from 'zod';
import { categorySlugSchema } from './category.validators';
import { ngweeSchema, paginationQuery, queryBoolean } from '../utils/validation';

export const productListQuery = z
  .object({
    category: categorySlugSchema.optional(),
    colour: z.string().trim().min(1).max(60).optional(),
    size: z.string().trim().min(1).max(60).optional(),
    minPrice: z.coerce.number().int().min(0).optional(),
    maxPrice: z.coerce.number().int().min(0).optional(),
    search: z.string().trim().min(1).max(100).optional(),
    sort: z.enum(['newest', 'price_asc', 'price_desc', 'featured']).default('newest'),
    ...paginationQuery,
  })
  .refine((q) => q.minPrice === undefined || q.maxPrice === undefined || q.minPrice <= q.maxPrice, {
    message: 'minPrice cannot be greater than maxPrice',
    path: ['minPrice'],
  });

export const productFacetsQuery = z.object({
  category: categorySlugSchema.optional(),
});

export const slugParams = z.object({ slug: z.string().trim().toLowerCase().min(1).max(200) });

const imageSchema = z.object({
  url: z.url().max(1000),
  publicId: z.string().max(300).nullable().optional(),
});

const variantSchema = z
  .object({
    sku: z
      .string()
      .trim()
      .toUpperCase()
      .min(2)
      .max(64)
      .regex(/^[A-Z0-9-]+$/, 'SKU can only contain letters, numbers and dashes'),
    size: z.string().trim().min(1).max(60),
    colour: z.string().trim().min(1).max(60),
    colourHex: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/, 'Use a hex colour like #F7F3EE')
      .optional(),
    images: z.array(imageSchema).max(12).default([]),
    priceNgwee: ngweeSchema,
    compareAtPriceNgwee: ngweeSchema.nullable().optional(),
    lowStockThreshold: z.number().int().min(0).default(5),
    active: z.boolean().default(true),
    stock: z.number().int().min(0).optional(),
  })
  .refine((v) => v.compareAtPriceNgwee == null || v.compareAtPriceNgwee > v.priceNgwee, {
    message: 'Compare-at price must be higher than the price',
    path: ['compareAtPriceNgwee'],
  });

const variantsSchema = z
  .array(variantSchema)
  .min(1, 'Add at least one variant')
  .max(100)
  .refine((vs) => new Set(vs.map((v) => v.sku)).size === vs.length, 'Variant SKUs must be unique');

export const colourImagesBody = z.object({
  colour: z.string().trim().min(1).max(60),
});

export const createProductSchema = z.object({
  name: z.string().trim().min(2).max(160),
  slug: z.string().trim().min(2).max(200).optional(),
  description: z.string().trim().max(5000).default(''),
  careInstructions: z.string().trim().max(2000).default(''),
  category: categorySlugSchema,
  featured: z.boolean().default(false),
  active: z.boolean().default(true),
  images: z.array(imageSchema).max(12).default([]),
  variants: variantsSchema,
});

export const updateProductSchema = z.object({
  name: z.string().trim().min(2).max(160).optional(),
  slug: z.string().trim().min(2).max(200).optional(),
  description: z.string().trim().max(5000).optional(),
  careInstructions: z.string().trim().max(2000).optional(),
  category: categorySlugSchema.optional(),
  featured: z.boolean().optional(),
  active: z.boolean().optional(),
  images: z.array(imageSchema).max(12).optional(),
  variants: variantsSchema.optional(),
});

export const adminProductListQuery = z.object({
  search: z.string().trim().min(1).max(100).optional(),
  category: categorySlugSchema.optional(),
  active: queryBoolean.optional(),
  featured: queryBoolean.optional(),
  ...paginationQuery,
});
