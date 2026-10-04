import mongoose, { type PipelineStage, type Types } from 'mongoose';
import { OrderModel } from '../models/Order';
import { ProductModel, type Product } from '../models/Product';
import { AppError } from '../utils/AppError';
import { slugify } from '../utils/slug';
import { escapeRegex, paginationMeta } from '../utils/validation';
import { assertCategoryExists } from './category.service';
import { deleteImage } from './image.service';
import { logStockChanges, type StockChange } from './inventory.service';

/* ------------------------------------------------------------------ */
/* Public catalogue                                                    */
/* ------------------------------------------------------------------ */

export type ProductSort = 'newest' | 'price_asc' | 'price_desc' | 'featured';

export interface ProductListQuery {
  category?: string;
  colour?: string;
  size?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  sort: ProductSort;
  page: number;
  limit: number;
}

type ProductLike = Product & { _id: Types.ObjectId; createdAt?: Date; updatedAt?: Date };

const SORTS: Record<ProductSort, Record<string, 1 | -1>> = {
  newest: { createdAt: -1, _id: -1 },
  price_asc: { minPriceNgwee: 1, _id: 1 },
  price_desc: { minPriceNgwee: -1, _id: -1 },
  featured: { featured: -1, createdAt: -1, _id: -1 },
};

const activeVariants = { $filter: { input: '$variants', cond: { $ne: ['$$this.active', false] } } };

export async function listPublicProducts(query: ProductListQuery) {
  const variantMatch: Record<string, unknown> = { active: { $ne: false } };
  if (query.colour) variantMatch.colour = { $regex: `^${escapeRegex(query.colour)}$`, $options: 'i' };
  if (query.size) variantMatch.size = { $regex: `^${escapeRegex(query.size)}$`, $options: 'i' };
  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    variantMatch.priceNgwee = {
      ...(query.minPrice !== undefined && { $gte: query.minPrice }),
      ...(query.maxPrice !== undefined && { $lte: query.maxPrice }),
    };
  }

  const match: Record<string, unknown> = { active: true, variants: { $elemMatch: variantMatch } };
  if (query.category) match.category = query.category;
  if (query.search) {
    const pattern = { $regex: escapeRegex(query.search), $options: 'i' };
    match.$or = [{ name: pattern }, { description: pattern }];
  }

  const pipeline: PipelineStage[] = [
    { $match: match },
    { $addFields: { minPriceNgwee: { $min: { $map: { input: activeVariants, in: '$$this.priceNgwee' } } } } },
    { $sort: SORTS[query.sort] },
    {
      $facet: {
        items: [{ $skip: (query.page - 1) * query.limit }, { $limit: query.limit }],
        total: [{ $count: 'count' }],
      },
    },
  ];

  const [result] = await ProductModel.aggregate<{ items: ProductLike[]; total: { count: number }[] }>(pipeline);
  const total = result?.total[0]?.count ?? 0;
  return {
    items: (result?.items ?? []).map(toPublicProduct),
    pagination: paginationMeta(query.page, query.limit, total),
  };
}

export async function listFeaturedProducts(limit = 8) {
  const products = await ProductModel.find({ active: true, featured: true })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean<ProductLike[]>();
  return products.map(toPublicProduct).filter((p) => p.variants.length > 0);
}

export async function getPublicProductBySlug(slug: string) {
  const product = await ProductModel.findOne({ slug, active: true }).lean<ProductLike>();
  if (!product) throw AppError.notFound('Product not found', 'PRODUCT_NOT_FOUND');
  return toPublicProduct(product);
}

export async function getProductFacets(category?: string) {
  const match: Record<string, unknown> = { active: true };
  if (category) match.category = category;

  const [facets] = await ProductModel.aggregate<{
    colours: { name: string; hex: string | null }[];
    sizes: string[];
    minPriceNgwee: number | null;
    maxPriceNgwee: number | null;
  }>([
    { $match: match },
    { $unwind: '$variants' },
    { $match: { 'variants.active': { $ne: false } } },
    {
      $group: {
        _id: null,
        colours: { $addToSet: { name: '$variants.colour', hex: { $ifNull: ['$variants.colourHex', null] } } },
        sizes: { $addToSet: '$variants.size' },
        minPriceNgwee: { $min: '$variants.priceNgwee' },
        maxPriceNgwee: { $max: '$variants.priceNgwee' },
      },
    },
    { $project: { _id: 0 } },
  ]);

  const colours = [...new Map((facets?.colours ?? []).map((c) => [c.name, c])).values()].sort((a, b) =>
    a.name.localeCompare(b.name),
  );
  const sizes = (facets?.sizes ?? []).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  return {
    colours,
    sizes,
    minPriceNgwee: facets?.minPriceNgwee ?? null,
    maxPriceNgwee: facets?.maxPriceNgwee ?? null,
  };
}

/**
 * Hides inactive variants and exact stock from the storefront. The count is only
 * revealed once a variant is at or below its low-stock threshold ("Only 3 left").
 */
export function toPublicProduct(product: ProductLike) {
  const variants = product.variants
    .filter((v) => v.active !== false)
    .map((v) => {
      const lowStock = v.stock > 0 && v.stock <= v.lowStockThreshold;
      return {
        sku: v.sku,
        size: v.size,
        colour: v.colour,
        colourHex: v.colourHex ?? null,
        images: (v.images ?? []).map((i) => ({ url: i.url })),
        priceNgwee: v.priceNgwee,
        compareAtPriceNgwee: v.compareAtPriceNgwee ?? null,
        inStock: v.stock > 0,
        lowStock,
        stockLeft: lowStock ? v.stock : null,
      };
    });
  const prices = variants.map((v) => v.priceNgwee);

  /** One gallery per colour (first non-empty set wins for duplicates). */
  const colourImages = [
    ...new Map(
      variants
        .filter((v) => v.images.length > 0)
        .map((v) => [v.colour.toLowerCase(), { colour: v.colour, images: v.images }] as const),
    ).values(),
  ];

  return {
    id: String(product._id),
    name: product.name,
    slug: product.slug,
    description: product.description,
    careInstructions: product.careInstructions ?? '',
    category: product.category,
    images: product.images.map((i) => ({ url: i.url })),
    colourImages,
    featured: product.featured,
    minPriceNgwee: prices.length ? Math.min(...prices) : null,
    maxPriceNgwee: prices.length ? Math.max(...prices) : null,
    inStock: variants.some((v) => v.inStock),
    colours: [...new Map(variants.map((v) => [v.colour, { name: v.colour, hex: v.colourHex }])).values()],
    sizes: [...new Set(variants.map((v) => v.size))],
    variants,
    createdAt: product.createdAt,
  };
}

/* ------------------------------------------------------------------ */
/* Admin                                                               */
/* ------------------------------------------------------------------ */

export interface VariantInput {
  sku: string;
  size: string;
  colour: string;
  colourHex?: string;
  images?: { url: string; publicId?: string | null }[];
  priceNgwee: number;
  compareAtPriceNgwee?: number | null;
  lowStockThreshold: number;
  active: boolean;
  /** Only used for variants that do not exist yet. Existing stock changes go through inventory adjust. */
  stock?: number;
}

export interface ProductInput {
  name: string;
  slug?: string;
  description: string;
  careInstructions: string;
  category: string;
  featured: boolean;
  active: boolean;
  images: { url: string; publicId?: string | null }[];
  variants: VariantInput[];
}

export interface AdminProductListQuery {
  search?: string;
  category?: string;
  active?: boolean;
  featured?: boolean;
  page: number;
  limit: number;
}

export async function listAdminProducts(query: AdminProductListQuery) {
  const filter: Record<string, unknown> = {};
  if (query.category) filter.category = query.category;
  if (query.active !== undefined) filter.active = query.active;
  if (query.featured !== undefined) filter.featured = query.featured;
  if (query.search) {
    const pattern = { $regex: escapeRegex(query.search), $options: 'i' };
    filter.$or = [{ name: pattern }, { slug: pattern }, { 'variants.sku': pattern }];
  }
  const [items, total] = await Promise.all([
    ProductModel.find(filter)
      .sort({ createdAt: -1 })
      .skip((query.page - 1) * query.limit)
      .limit(query.limit)
      .lean(),
    ProductModel.countDocuments(filter),
  ]);
  return { items, pagination: paginationMeta(query.page, query.limit, total) };
}

export async function getAdminProduct(id: string) {
  const product = await ProductModel.findById(id).lean();
  if (!product) throw AppError.notFound('Product not found', 'PRODUCT_NOT_FOUND');
  return product;
}

async function uniqueSlug(base: string, excludeId?: Types.ObjectId | string): Promise<string> {
  const root = slugify(base) || 'product';
  for (let n = 1; n < 100; n++) {
    const candidate = n === 1 ? root : `${root}-${n}`;
    const taken = await ProductModel.exists({ slug: candidate, ...(excludeId && { _id: { $ne: excludeId } }) });
    if (!taken) return candidate;
  }
  throw AppError.conflict('Could not generate a unique slug', 'SLUG_TAKEN');
}

export async function createProduct(input: ProductInput, adminId: string) {
  await assertCategoryExists(input.category);
  const slug = input.slug ? slugify(input.slug) : await uniqueSlug(input.name);
  if (input.slug && (await ProductModel.exists({ slug }))) {
    throw AppError.conflict('A product with this slug already exists', 'SLUG_TAKEN');
  }

  return mongoose.connection.transaction(async (session) => {
    const [product] = await ProductModel.create(
      [
        {
          ...input,
          slug,
          variants: input.variants.map((v) => ({ ...v, stock: v.stock ?? 0 })),
        },
      ],
      { session },
    );
    await logStockChanges(
      product.variants.map((v) => ({
        productId: product._id,
        variantSku: v.sku,
        change: v.stock,
        reason: 'restock' as const,
        userId: adminId,
        note: 'Initial stock',
      })),
      session,
    );
    return product;
  });
}

export async function updateProduct(id: string, input: Partial<ProductInput>, adminId: string) {
  if (input.category !== undefined) await assertCategoryExists(input.category);
  const removedPublicIds: string[] = [];

  const product = await mongoose.connection.transaction(async (session) => {
    const product = await ProductModel.findById(id).session(session);
    if (!product) throw AppError.notFound('Product not found', 'PRODUCT_NOT_FOUND');

    if (input.slug !== undefined) {
      const slug = slugify(input.slug);
      if (await ProductModel.exists({ slug, _id: { $ne: product._id } }).session(session)) {
        throw AppError.conflict('A product with this slug already exists', 'SLUG_TAKEN');
      }
      product.slug = slug;
    }

    for (const key of ['name', 'description', 'careInstructions', 'category', 'featured', 'active'] as const) {
      if (input[key] !== undefined) product.set(key, input[key]);
    }

    if (input.images) {
      const kept = new Set(input.images.map((i) => i.publicId).filter(Boolean));
      for (const image of product.images) {
        if (image.publicId && !kept.has(image.publicId)) removedPublicIds.push(image.publicId);
      }
      product.set('images', input.images);
    }

    if (input.variants) {
      const existing = new Map(product.variants.map((v) => [v.sku, v]));
      const incoming = new Set(input.variants.map((v) => v.sku));
      const changes: StockChange[] = [];

      const variants = input.variants.map((v) => {
        const current = existing.get(v.sku);
        const images = v.images ?? current?.images ?? [];
        if (current) {
          // Keep the subdocument id and the live stock count.
          return { ...v, images, _id: current._id, stock: current.stock };
        }
        const stock = v.stock ?? 0;
        changes.push({
          productId: product._id,
          variantSku: v.sku,
          change: stock,
          reason: 'restock',
          userId: adminId,
          note: 'New variant',
        });
        return { ...v, images, stock };
      });

      // Collect colour-gallery publicIds that were dropped so we can delete them from Cloudinary.
      const keptPublicIds = new Set(
        variants.flatMap((v) => (v.images ?? []).map((i) => i.publicId).filter(Boolean) as string[]),
      );
      for (const old of product.variants) {
        for (const image of old.images ?? []) {
          if (image.publicId && !keptPublicIds.has(image.publicId)) {
            removedPublicIds.push(image.publicId);
          }
        }
      }

      for (const [sku, current] of existing) {
        if (!incoming.has(sku) && current.stock > 0) {
          changes.push({
            productId: product._id,
            variantSku: sku,
            change: -current.stock,
            reason: 'adjustment',
            userId: adminId,
            note: 'Variant removed',
          });
        }
      }

      product.set('variants', variants);
      await logStockChanges(changes, session);
    }

    await product.save({ session });
    return product;
  });

  await Promise.allSettled(removedPublicIds.map((publicId) => deleteImage(publicId)));
  return product;
}

export async function toggleProductFlag(id: string, flag: 'active' | 'featured') {
  const product = await ProductModel.findByIdAndUpdate(id, [{ $set: { [flag]: { $not: `$${flag}` } } }], {
    new: true,
  }).lean();
  if (!product) throw AppError.notFound('Product not found', 'PRODUCT_NOT_FOUND');
  return product;
}

export async function addProductImages(id: string, images: { url: string; publicId: string }[]) {
  const product = await ProductModel.findByIdAndUpdate(
    id,
    { $push: { images: { $each: images } } },
    { new: true, runValidators: true },
  ).lean();
  if (!product) {
    await Promise.allSettled(images.map((i) => deleteImage(i.publicId)));
    throw AppError.notFound('Product not found', 'PRODUCT_NOT_FOUND');
  }
  return product;
}

/** Append uploaded photos to every variant that shares this colour name. */
export async function addColourImages(
  id: string,
  colour: string,
  images: { url: string; publicId: string }[],
) {
  const product = await ProductModel.findById(id);
  if (!product) {
    await Promise.allSettled(images.map((i) => deleteImage(i.publicId)));
    throw AppError.notFound('Product not found', 'PRODUCT_NOT_FOUND');
  }

  const needle = colour.trim().toLowerCase();
  let matched = 0;
  for (const variant of product.variants) {
    if (variant.colour.trim().toLowerCase() !== needle) continue;
    matched += 1;
    const next = [...(variant.images ?? []), ...images].slice(0, 12);
    variant.set('images', next);
  }

  if (matched === 0) {
    await Promise.allSettled(images.map((i) => deleteImage(i.publicId)));
    throw AppError.badRequest(
      `No variant uses the colour “${colour}”. Add that colour on a variant first.`,
      'COLOUR_NOT_FOUND',
    );
  }

  await product.save();
  return product.toObject();
}

export async function deleteProduct(id: string) {
  const product = await ProductModel.findById(id);
  if (!product) throw AppError.notFound('Product not found', 'PRODUCT_NOT_FOUND');
  if (await OrderModel.exists({ 'items.product': product._id })) {
    throw AppError.conflict(
      'This product appears in orders and cannot be deleted. Deactivate it instead.',
      'PRODUCT_HAS_ORDERS',
    );
  }
  await product.deleteOne();
  const publicIds = [
    ...product.images.map((i) => i.publicId),
    ...product.variants.flatMap((v) => (v.images ?? []).map((i) => i.publicId)),
  ].filter((p): p is string => Boolean(p));
  await Promise.allSettled(publicIds.map((publicId) => deleteImage(publicId)));
}
