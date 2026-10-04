import { Schema, model, type HydratedDocument, type InferSchemaType } from 'mongoose';
import { ngweeValidator } from '../utils/money';

const deliveryZoneSchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true, maxlength: 120 },
    feeNgwee: { type: Number, required: true, validate: ngweeValidator },
    estimatedDays: { type: String, required: true, trim: true, maxlength: 60 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export type DeliveryZone = InferSchemaType<typeof deliveryZoneSchema>;
export type DeliveryZoneDocument = HydratedDocument<DeliveryZone>;
export const DeliveryZoneModel = model('DeliveryZone', deliveryZoneSchema);
