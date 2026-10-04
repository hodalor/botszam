import type { RequestHandler } from 'express';
import { authUserId } from '../../middleware/auth';
import { validated } from '../../middleware/validate';
import { uploadImageBuffer } from '../../services/image.service';
import {
  addColourImages,
  addProductImages,
  createProduct,
  deleteProduct,
  getAdminProduct,
  listAdminProducts,
  toggleProductFlag,
  updateProduct,
} from '../../services/product.service';
import { AppError } from '../../utils/AppError';
import { idParams } from '../../utils/validation';
import {
  adminProductListQuery,
  colourImagesBody,
  createProductSchema,
  updateProductSchema,
} from '../../validators/product.validators';

export const list: RequestHandler = async (req, res) => {
  res.json(await listAdminProducts(validated(adminProductListQuery, req.query)));
};

export const getOne: RequestHandler = async (req, res) => {
  res.json({ product: await getAdminProduct(validated(idParams, req.params).id) });
};

export const create: RequestHandler = async (req, res) => {
  const product = await createProduct(validated(createProductSchema, req.body), authUserId(req));
  res.status(201).json({ product });
};

export const update: RequestHandler = async (req, res) => {
  const { id } = validated(idParams, req.params);
  const product = await updateProduct(id, validated(updateProductSchema, req.body), authUserId(req));
  res.json({ product });
};

export const remove: RequestHandler = async (req, res) => {
  await deleteProduct(validated(idParams, req.params).id);
  res.status(204).end();
};

export const toggleActive: RequestHandler = async (req, res) => {
  res.json({ product: await toggleProductFlag(validated(idParams, req.params).id, 'active') });
};

export const toggleFeatured: RequestHandler = async (req, res) => {
  res.json({ product: await toggleProductFlag(validated(idParams, req.params).id, 'featured') });
};

export const uploadImages: RequestHandler = async (req, res) => {
  const { id } = validated(idParams, req.params);
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  if (files.length === 0) {
    throw AppError.badRequest('Attach at least one image in the "images" field', 'NO_FILES');
  }
  const uploaded = await Promise.all(files.map((f) => uploadImageBuffer(f.buffer)));
  res.status(201).json({ product: await addProductImages(id, uploaded) });
};

export const uploadColourImages: RequestHandler = async (req, res) => {
  const { id } = validated(idParams, req.params);
  const { colour } = validated(colourImagesBody, req.body);
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  if (files.length === 0) {
    throw AppError.badRequest('Attach at least one image in the "images" field', 'NO_FILES');
  }
  const uploaded = await Promise.all(files.map((f) => uploadImageBuffer(f.buffer)));
  res.status(201).json({ product: await addColourImages(id, colour, uploaded) });
};
