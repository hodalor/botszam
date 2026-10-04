import { CategoryModel } from '../models/Category';
import { ProductModel } from '../models/Product';
import { AppError } from '../utils/AppError';
import { slugify } from '../utils/slug';

export async function listPublicCategories() {
  return CategoryModel.find({ active: true }).sort({ sortOrder: 1, name: 1 }).lean();
}

export async function listAdminCategories() {
  return CategoryModel.find().sort({ sortOrder: 1, name: 1 }).lean();
}

export async function assertCategoryExists(slug: string) {
  const category = await CategoryModel.findOne({ slug, active: true }).lean();
  if (!category) {
    throw AppError.badRequest(`Unknown category “${slug}”. Add it under Settings first.`, 'CATEGORY_UNKNOWN');
  }
  return category;
}

function normalizeImageUrl(imageUrl: string | null | undefined) {
  if (imageUrl == null || imageUrl === '') return null;
  return imageUrl;
}

export async function createCategory(input: {
  name: string;
  slug?: string;
  description?: string;
  sortOrder?: number;
  active?: boolean;
  imageUrl?: string | null;
}) {
  const slug = input.slug || slugify(input.name);
  if (!slug) throw AppError.badRequest('Could not build a slug from that name', 'CATEGORY_SLUG');

  try {
    return await CategoryModel.create({
      name: input.name,
      slug,
      description: input.description ?? '',
      sortOrder: input.sortOrder ?? 0,
      active: input.active ?? true,
      imageUrl: normalizeImageUrl(input.imageUrl),
    });
  } catch (error) {
    if ((error as { code?: number }).code === 11000) {
      throw AppError.conflict('A category with that slug already exists', 'CATEGORY_EXISTS');
    }
    throw error;
  }
}

export async function updateCategory(
  id: string,
  input: {
    name?: string;
    slug?: string;
    description?: string;
    sortOrder?: number;
    active?: boolean;
    imageUrl?: string | null;
  },
) {
  const existing = await CategoryModel.findById(id);
  if (!existing) throw AppError.notFound('Category not found', 'CATEGORY_NOT_FOUND');

  const previousSlug = existing.slug;
  if (input.name !== undefined) existing.name = input.name;
  if (input.slug !== undefined) existing.slug = input.slug;
  if (input.description !== undefined) existing.description = input.description;
  if (input.sortOrder !== undefined) existing.sortOrder = input.sortOrder;
  if (input.active !== undefined) existing.active = input.active;
  if (input.imageUrl !== undefined) {
    existing.set('imageUrl', normalizeImageUrl(input.imageUrl));
  }

  try {
    await existing.save();
  } catch (error) {
    if ((error as { code?: number }).code === 11000) {
      throw AppError.conflict('A category with that slug already exists', 'CATEGORY_EXISTS');
    }
    throw error;
  }

  if (input.slug && input.slug !== previousSlug) {
    await ProductModel.updateMany({ category: previousSlug }, { $set: { category: input.slug } });
  }

  return existing.toObject();
}

export async function deleteCategory(id: string) {
  const category = await CategoryModel.findById(id);
  if (!category) throw AppError.notFound('Category not found', 'CATEGORY_NOT_FOUND');

  const inUse = await ProductModel.countDocuments({ category: category.slug });
  if (inUse > 0) {
    throw AppError.conflict(
      `“${category.name}” still has ${inUse} product${inUse === 1 ? '' : 's'}. Reassign or remove them first.`,
      'CATEGORY_IN_USE',
    );
  }

  await category.deleteOne();
}
