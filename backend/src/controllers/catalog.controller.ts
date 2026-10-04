import type { RequestHandler } from 'express';
import { validated } from '../middleware/validate';
import { DeliveryZoneModel } from '../models/DeliveryZone';
import { listPublicCategories } from '../services/category.service';
import {
  getProductFacets,
  getPublicProductBySlug,
  listFeaturedProducts,
  listPublicProducts,
} from '../services/product.service';
import { getSettings } from '../services/settings.service';
import { productFacetsQuery, productListQuery, slugParams } from '../validators/product.validators';

export const listCategories: RequestHandler = async (_req, res) => {
  const items = await listPublicCategories();
  res.json({
    items: items.map((c) => ({
      id: String(c._id),
      name: c.name,
      slug: c.slug,
      description: c.description,
      imageUrl: c.imageUrl ?? null,
      sortOrder: c.sortOrder,
    })),
  });
};

export const listProducts: RequestHandler = async (req, res) => {
  res.json(await listPublicProducts(validated(productListQuery, req.query)));
};

export const featuredProducts: RequestHandler = async (_req, res) => {
  res.json({ items: await listFeaturedProducts() });
};

export const productFacets: RequestHandler = async (req, res) => {
  const { category } = validated(productFacetsQuery, req.query);
  res.json({ facets: await getProductFacets(category) });
};

export const productBySlug: RequestHandler = async (req, res) => {
  const { slug } = validated(slugParams, req.params);
  res.json({ product: await getPublicProductBySlug(slug) });
};

export const listDeliveryZones: RequestHandler = async (_req, res) => {
  const zones = await DeliveryZoneModel.find({ active: true })
    .sort({ feeNgwee: 1, name: 1 })
    .select('name feeNgwee estimatedDays')
    .lean();
  res.json({ items: zones.map((z) => ({ id: String(z._id), name: z.name, feeNgwee: z.feeNgwee, estimatedDays: z.estimatedDays })) });
};

export const publicSettings: RequestHandler = async (_req, res) => {
  const s = await getSettings();
  res.json({
    settings: {
      storeName: s.storeName,
      contactPhone: s.contactPhone,
      whatsappNumber: s.whatsappNumber,
      email: s.email,
      mobileMoneyAccounts: s.mobileMoneyAccounts.map((a) => ({
        network: a.network,
        number: a.number,
        accountName: a.accountName,
      })),
      paymentInstructions: s.paymentInstructions,
    },
  });
};
