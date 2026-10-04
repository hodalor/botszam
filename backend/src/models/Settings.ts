import { Schema, model, type HydratedDocument, type InferSchemaType } from 'mongoose';

export const MOBILE_MONEY_NETWORKS = ['MTN', 'Airtel', 'Zamtel'] as const;
export type MobileMoneyNetwork = (typeof MOBILE_MONEY_NETWORKS)[number];

export const SETTINGS_KEY = 'store';

const mobileMoneyAccountSchema = new Schema(
  {
    network: { type: String, enum: MOBILE_MONEY_NETWORKS, required: true },
    number: { type: String, required: true, trim: true },
    accountName: { type: String, required: true, trim: true },
  },
  { _id: false },
);

const settingsSchema = new Schema(
  {
    // Fixed key + unique index guarantees a single settings document.
    key: { type: String, required: true, unique: true, default: SETTINGS_KEY, immutable: true },
    storeName: { type: String, required: true, trim: true, default: 'botszam' },
    contactPhone: { type: String, trim: true, default: '' },
    whatsappNumber: { type: String, trim: true, default: '' },
    email: { type: String, trim: true, lowercase: true, default: '' },
    mobileMoneyAccounts: { type: [mobileMoneyAccountSchema], default: [] },
    paymentInstructions: { type: String, trim: true, default: '', maxlength: 2000 },
  },
  { timestamps: true },
);

export type Settings = InferSchemaType<typeof settingsSchema>;
export type SettingsDocument = HydratedDocument<Settings>;
export const SettingsModel = model('Settings', settingsSchema);
