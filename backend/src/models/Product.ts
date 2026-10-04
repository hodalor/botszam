import { Schema, model, type HydratedDocument, type InferSchemaType } from 'mongoose';
import { ngweeValidator } from '../utils/money';

const imageSchema = new Schema(
  {
    url: { type: String, required: true, trim: true },
    publicId: { type: String, trim: true, default: null },
  },
  { _id: false },
);

const variantSchema = new Schema({
  sku: { type: String, required: true, trim: true, uppercase: true },
  size: { type: String, required: true, trim: true },
  colour: { type: String, required: true, trim: true },
  colourHex: {
    type: String,
    trim: true,
    match: [/^#[0-9A-Fa-f]{6}$/, 'colourHex must be a hex colour like #F7F3EE'],
  },
  /** Photos for this colourway — shared across sizes of the same colour in the admin UI. */
  images: { type: [imageSchema], default: [] },
  priceNgwee: { type: Number, required: true, validate: ngweeValidator },
  compareAtPriceNgwee: { type: Number, validate: ngweeValidator },
  stock: {
    type: Number,
    required: true,
    default: 0,
    min: [0, 'Stock cannot be negative'],
    validate: { validator: Number.isInteger, message: 'Stock must be an integer' },
  },
  lowStockThreshold: {
    type: Number,
    required: true,
    default: 5,
    min: 0,
    validate: { validator: Number.isInteger, message: 'lowStockThreshold must be an integer' },
  },
  active: { type: Boolean, default: true },
});

const productSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 160 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, default: '', maxlength: 5000 },
    /** Empty means the storefront shows its default care copy. */
    careInstructions: { type: String, default: '', maxlength: 2000 },
    /** Category slug — must match an entry in the Category collection. */
    category: { type: String, required: true, lowercase: true, trim: true, maxlength: 100 },
    images: { type: [imageSchema], default: [] },
    featured: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
    variants: {
      type: [variantSchema],
      validate: [
        {
          validator: (variants: unknown[]) => variants.length > 0,
          message: 'A product needs at least one variant',
        },
        {
          validator: (variants: { sku: string }[]) =>
            new Set(variants.map((v) => v.sku)).size === variants.length,
          message: 'Variant SKUs must be unique within a product',
        },
      ],
    },
  },
  { timestamps: true },
);

productSchema.index({ 'variants.sku': 1 }, { unique: true });
productSchema.index({ active: 1, category: 1 });
productSchema.index({ active: 1, featured: 1 });

export type Product = InferSchemaType<typeof productSchema>;
export type ProductDocument = HydratedDocument<Product>;
export const ProductModel = model('Product', productSchema);
