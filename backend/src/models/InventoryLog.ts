import { Schema, model, type HydratedDocument, type InferSchemaType } from 'mongoose';

export const INVENTORY_REASONS = [
  'order',
  'cancel',
  'restock',
  'adjustment',
  'payment_rejected',
] as const;
export type InventoryReason = (typeof INVENTORY_REASONS)[number];

const inventoryLogSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    variantSku: { type: String, required: true, uppercase: true, trim: true },
    change: {
      type: Number,
      required: true,
      validate: {
        validator: (v: number) => Number.isInteger(v) && v !== 0,
        message: 'change must be a non-zero integer',
      },
    },
    reason: { type: String, enum: INVENTORY_REASONS, required: true },
    order: { type: Schema.Types.ObjectId, ref: 'Order', default: null },
    user: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    note: { type: String, trim: true, default: '', maxlength: 500 },
  },
  { timestamps: true },
);

inventoryLogSchema.index({ product: 1, variantSku: 1, createdAt: -1 });
inventoryLogSchema.index({ order: 1 });

export type InventoryLog = InferSchemaType<typeof inventoryLogSchema>;
export type InventoryLogDocument = HydratedDocument<InventoryLog>;
export const InventoryLogModel = model('InventoryLog', inventoryLogSchema);
