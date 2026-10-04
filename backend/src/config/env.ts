import dotenv from 'dotenv';
import { z } from 'zod';

// Prefer values from backend/.env over any leftover shell exports (PORT, MONGODB_URI, etc.).
dotenv.config({ quiet: true, override: true });

const emptyToUndefined = (value: unknown) => (value === '' ? undefined : value);

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  // Local: "lax". Production cookies are forced to sameSite=none + secure in auth.service
  // (cross-site Netlify ↔ Render); this var still matters for non-production.
  COOKIE_SAMESITE: z.enum(['lax', 'strict', 'none']).default('lax'),
  FRONTEND_URL: z.url('FRONTEND_URL must be a valid URL'),
  CLOUDINARY_CLOUD_NAME: z.preprocess(emptyToUndefined, z.string().optional()),
  CLOUDINARY_API_KEY: z.preprocess(emptyToUndefined, z.string().optional()),
  CLOUDINARY_API_SECRET: z.preprocess(emptyToUndefined, z.string().optional()),
  ORDER_PREFIX: z
    .string()
    .regex(/^[A-Z]{2,5}$/, 'ORDER_PREFIX must be 2-5 uppercase letters')
    .default('BTZ'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment configuration:');
  for (const issue of parsed.error.issues) {
    console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
  }
  process.exit(1);
}

export const env = {
  ...parsed.data,
  FRONTEND_URL: parsed.data.FRONTEND_URL.replace(/\/+$/, ''),
  isProduction: parsed.data.NODE_ENV === 'production',
};
