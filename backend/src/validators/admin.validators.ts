import { z } from 'zod';
import { INVENTORY_REASONS } from '../models/InventoryLog';
import { MOBILE_MONEY_NETWORKS } from '../models/Settings';
import { zambianPhoneSchema } from '../utils/phone';
import { lusakaDaySchema, ngweeSchema, objectIdSchema, paginationQuery } from '../utils/validation';

export const inventoryAdjustSchema = z
  .object({
    productId: objectIdSchema,
    variantSku: z.string().trim().toUpperCase().min(1).max(64),
    change: z.number().int().refine((n) => n !== 0, 'Change cannot be zero'),
    reason: z.enum(['restock', 'adjustment']),
    note: z.string().trim().max(500).default(''),
  })
  .refine((v) => v.reason !== 'restock' || v.change > 0, {
    message: 'A restock must add stock',
    path: ['change'],
  });

export const inventoryLogQuery = z.object({
  productId: objectIdSchema.optional(),
  variantSku: z.string().trim().toUpperCase().max(64).optional(),
  reason: z.enum(INVENTORY_REASONS).optional(),
  orderNumber: z.string().trim().toUpperCase().max(30).optional(),
  from: lusakaDaySchema.optional(),
  to: lusakaDaySchema.optional(),
  ...paginationQuery,
});

export const deliveryZoneSchema = z.object({
  name: z.string().trim().min(2).max(120),
  feeNgwee: ngweeSchema,
  estimatedDays: z.string().trim().min(1).max(60),
  active: z.boolean().default(true),
});

export const updateDeliveryZoneSchema = deliveryZoneSchema.partial();

const optionalPhone = z.union([z.literal(''), zambianPhoneSchema]);

export const adminCustomerListQuery = z.object({
  search: z.string().trim().min(1).max(100).optional(),
  ...paginationQuery,
});

export const settingsSchema = z.object({
  storeName: z.string().trim().min(1).max(120),
  contactPhone: optionalPhone.default(''),
  whatsappNumber: optionalPhone.default(''),
  email: z.union([z.literal(''), z.email().trim().toLowerCase()]).default(''),
  mobileMoneyAccounts: z
    .array(
      z.object({
        network: z.enum(MOBILE_MONEY_NETWORKS),
        number: zambianPhoneSchema,
        accountName: z.string().trim().min(2).max(120),
      }),
    )
    .max(10),
  paymentInstructions: z.string().trim().max(2000).default(''),
});
