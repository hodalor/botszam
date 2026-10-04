import type { RequestHandler } from 'express';
import { validated } from '../../middleware/validate';
import {
  createCategory,
  deleteCategory,
  listAdminCategories,
  updateCategory,
} from '../../services/category.service';
import { idParams } from '../../utils/validation';
import { createCategorySchema, updateCategorySchema } from '../../validators/category.validators';

export const list: RequestHandler = async (_req, res) => {
  res.json({ items: await listAdminCategories() });
};

export const create: RequestHandler = async (req, res) => {
  const category = await createCategory(validated(createCategorySchema, req.body));
  res.status(201).json({ category });
};

export const update: RequestHandler = async (req, res) => {
  const { id } = validated(idParams, req.params);
  const category = await updateCategory(id, validated(updateCategorySchema, req.body));
  res.json({ category });
};

export const remove: RequestHandler = async (req, res) => {
  const { id } = validated(idParams, req.params);
  await deleteCategory(id);
  res.status(204).end();
};
