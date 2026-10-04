import type { ClientSession, Types } from 'mongoose';
import { InventoryLogModel, type InventoryReason } from '../models/InventoryLog';
import { ProductModel } from '../models/Product';
import { AppError } from '../utils/AppError';

export interface StockChange {
  productId: Types.ObjectId | string;
  variantSku: string;
  /** Positive adds stock, negative removes it. */
  change: number;
  reason: InventoryReason;
  orderId?: Types.ObjectId | null;
  userId?: Types.ObjectId | string | null;
  note?: string;
}

interface ApplyOptions {
  session: ClientSession;
  /** Only allow decrementing variants of active products (used for customer orders). */
  requireActive?: boolean;
  /** Skip silently instead of throwing when the product/variant no longer exists. */
  ignoreMissing?: boolean;
}

/**
 * Applies a stock change with a conditional update so stock can never go negative,
 * and records it in the InventoryLog. Must run inside a transaction.
 * Returns false only when ignoreMissing is set and the variant was not found.
 */
export async function applyStockChange(change: StockChange, options: ApplyOptions): Promise<boolean> {
  if (!Number.isInteger(change.change) || change.change === 0) {
    throw AppError.badRequest('Stock change must be a non-zero integer', 'INVALID_STOCK_CHANGE');
  }

  const variantMatch: Record<string, unknown> = { sku: change.variantSku };
  if (change.change < 0) variantMatch.stock = { $gte: -change.change };
  if (options.requireActive) variantMatch.active = { $ne: false };

  const filter: Record<string, unknown> = { _id: change.productId, variants: { $elemMatch: variantMatch } };
  if (options.requireActive) filter.active = true;

  const result = await ProductModel.updateOne(
    filter,
    { $inc: { 'variants.$.stock': change.change } },
    { session: options.session },
  );

  if (result.modifiedCount === 0) {
    const exists = await ProductModel.exists({
      _id: change.productId,
      'variants.sku': change.variantSku,
    }).session(options.session);

    if (!exists) {
      if (options.ignoreMissing) return false;
      throw AppError.notFound(`Variant ${change.variantSku} not found`, 'VARIANT_NOT_FOUND');
    }
    throw new AppError(
      `Not enough stock for ${change.variantSku}`,
      409,
      'INSUFFICIENT_STOCK',
      { productId: String(change.productId), variantSku: change.variantSku },
    );
  }

  await InventoryLogModel.create(
    [
      {
        product: change.productId,
        variantSku: change.variantSku,
        change: change.change,
        reason: change.reason,
        order: change.orderId ?? null,
        user: change.userId ?? null,
        note: change.note ?? '',
      },
    ],
    { session: options.session },
  );
  return true;
}

/** Writes InventoryLog entries for changes that were applied directly to a product document. */
export async function logStockChanges(changes: StockChange[], session: ClientSession) {
  const entries = changes
    .filter((c) => c.change !== 0)
    .map((c) => ({
      product: c.productId,
      variantSku: c.variantSku,
      change: c.change,
      reason: c.reason,
      order: c.orderId ?? null,
      user: c.userId ?? null,
      note: c.note ?? '',
    }));
  if (entries.length) await InventoryLogModel.insertMany(entries, { session });
}
