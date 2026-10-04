import { Schema, model, type HydratedDocument, type InferSchemaType } from 'mongoose';

const categorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 100 },
    description: { type: String, default: '', trim: true, maxlength: 300 },
    sortOrder: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
    /** Optional storefront tile image URL. */
    imageUrl: { type: String, trim: true, default: null },
  },
  { timestamps: true },
);

categorySchema.index({ active: 1, sortOrder: 1 });

export type Category = InferSchemaType<typeof categorySchema>;
export type CategoryDocument = HydratedDocument<Category>;
export const CategoryModel = model('Category', categorySchema);
