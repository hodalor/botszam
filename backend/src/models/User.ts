import { Schema, model, type HydratedDocument, type InferSchemaType } from 'mongoose';
import { NORMALISED_PHONE_REGEX } from '../utils/phone';

export const USER_ROLES = ['customer', 'admin'] as const;
export type UserRole = (typeof USER_ROLES)[number];

const addressSchema = new Schema({
  label: { type: String, trim: true, default: 'Home', maxlength: 40 },
  zone: { type: Schema.Types.ObjectId, ref: 'DeliveryZone', required: true },
  area: { type: String, required: true, trim: true, maxlength: 120 },
  street: { type: String, required: true, trim: true, maxlength: 200 },
  landmark: { type: String, trim: true, default: '', maxlength: 200 },
  notes: { type: String, trim: true, default: '', maxlength: 500 },
  isDefault: { type: Boolean, default: false },
});

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, trim: true, lowercase: true },
    phone: {
      type: String,
      required: true,
      unique: true,
      match: [NORMALISED_PHONE_REGEX, 'Phone must be normalised to +260XXXXXXXXX'],
    },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: USER_ROLES, default: 'customer', required: true },
    addresses: { type: [addressSchema], default: [] },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        delete ret.passwordHash;
        delete ret.__v;
        return ret;
      },
    },
  },
);

// Email is optional, so uniqueness applies only to documents that actually have one.
userSchema.index(
  { email: 1 },
  { unique: true, partialFilterExpression: { email: { $type: 'string' } } },
);

export type User = InferSchemaType<typeof userSchema>;
export type UserDocument = HydratedDocument<User>;
export const UserModel = model('User', userSchema);
