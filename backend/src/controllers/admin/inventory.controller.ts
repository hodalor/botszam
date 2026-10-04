import type { RequestHandler } from 'express';
import mongoose from 'mongoose';
import { authUserId } from '../../middleware/auth';
import { validated } from '../../middleware/validate';
import { InventoryLogModel } from '../../models/InventoryLog';
import { OrderModel } from '../../models/Order';
import { ProductModel } from '../../models/Product';
import { applyStockChange } from '../../services/inventory.service';
import { addDays, parseLusakaDay } from '../../utils/time';
import { paginationMeta } from '../../utils/validation';
import { inventoryAdjustSchema, inventoryLogQuery } from '../../validators/admin.validators';

export const lowStock: RequestHandler = async (_req, res) => {
  const items = await ProductModel.aggregate([
    { $unwind: '$variants' },
    { $match: { $expr: { $lte: ['$variants.stock', '$variants.lowStockThreshold'] } } },
    {
      $project: {
        _id: 0,
        productId: '$_id',
        productName: '$name',
        slug: 1,
        productActive: '$active',
        variantActive: { $ne: ['$variants.active', false] },
        sku: '$variants.sku',
        size: '$variants.size',
        colour: '$variants.colour',
        stock: '$variants.stock',
        lowStockThreshold: '$variants.lowStockThreshold',
      },
    },
    { $sort: { stock: 1, productName: 1 } },
  ]);
  res.json({ items });
};

export const adjust: RequestHandler = async (req, res) => {
  const input = validated(inventoryAdjustSchema, req.body);
  const userId = authUserId(req);

  await mongoose.connection.transaction((session) =>
    applyStockChange(
      {
        productId: input.productId,
        variantSku: input.variantSku,
        change: input.change,
        reason: input.reason,
        userId,
        note: input.note,
      },
      { session },
    ),
  );

  const product = await ProductModel.findById(input.productId).lean();
  const variant = product?.variants.find((v) => v.sku === input.variantSku);
  res.json({ productId: input.productId, variantSku: input.variantSku, stock: variant?.stock ?? null });
};

export const logs: RequestHandler = async (req, res) => {
  const q = validated(inventoryLogQuery, req.query);
  const filter: Record<string, unknown> = {};
  if (q.productId) filter.product = q.productId;
  if (q.variantSku) filter.variantSku = q.variantSku;
  if (q.reason) filter.reason = q.reason;
  if (q.orderNumber) {
    const order = await OrderModel.findOne({ orderNumber: q.orderNumber }).select('_id').lean();
    filter.order = order?._id ?? null;
  }
  if (q.from || q.to) {
    filter.createdAt = {
      ...(q.from && { $gte: parseLusakaDay(q.from) }),
      ...(q.to && { $lt: addDays(parseLusakaDay(q.to), 1) }),
    };
  }

  const [items, total] = await Promise.all([
    InventoryLogModel.find(filter)
      .sort({ createdAt: -1 })
      .skip((q.page - 1) * q.limit)
      .limit(q.limit)
      .populate('product', 'name slug')
      .populate('user', 'name email')
      .populate('order', 'orderNumber')
      .lean(),
    InventoryLogModel.countDocuments(filter),
  ]);
  res.json({ items, pagination: paginationMeta(q.page, q.limit, total) });
};
