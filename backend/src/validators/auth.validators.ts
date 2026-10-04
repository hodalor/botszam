import { z } from 'zod';
import { zambianPhoneSchema } from '../utils/phone';
import { objectIdSchema } from '../utils/validation';

// bcrypt only uses the first 72 bytes of a password.
const passwordSchema = z.string().min(8, 'Password must be at least 8 characters').max(72);
const nameSchema = z.string().trim().min(2).max(120);
const emailSchema = z.email('Enter a valid email address').trim().toLowerCase().max(200);

export const registerSchema = z.object({
  name: nameSchema,
  email: emailSchema.optional(),
  phone: zambianPhoneSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  identifier: z.string().trim().min(3, 'Enter your email or phone number').max(200),
  password: z.string().min(1).max(200),
});

export const addressSchema = z.object({
  label: z.string().trim().max(40).default('Home'),
  zone: objectIdSchema,
  area: z.string().trim().min(2).max(120),
  street: z.string().trim().min(2).max(200),
  landmark: z.string().trim().max(200).default(''),
  notes: z.string().trim().max(500).default(''),
  isDefault: z.boolean().default(false),
});

export const updateMeSchema = z
  .object({
    name: nameSchema.optional(),
    email: emailSchema.nullable().optional(),
    phone: zambianPhoneSchema.optional(),
    addresses: z.array(addressSchema).max(10).optional(),
    currentPassword: z.string().max(200).optional(),
    newPassword: passwordSchema.optional(),
  })
  .refine((v) => !v.newPassword || v.currentPassword, {
    message: 'Enter your current password to set a new one',
    path: ['currentPassword'],
  });

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateMeInput = z.infer<typeof updateMeSchema>;
