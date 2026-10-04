import type { RequestHandler } from 'express';
import { validated } from '../../middleware/validate';
import { DeliveryZoneModel } from '../../models/DeliveryZone';
import { OrderModel } from '../../models/Order';
import { AppError } from '../../utils/AppError';
import { idParams } from '../../utils/validation';
import { deliveryZoneSchema, updateDeliveryZoneSchema } from '../../validators/admin.validators';

export const list: RequestHandler = async (_req, res) => {
  res.json({ items: await DeliveryZoneModel.find().sort({ feeNgwee: 1, name: 1 }).lean() });
};

export const create: RequestHandler = async (req, res) => {
  const zone = await DeliveryZoneModel.create(validated(deliveryZoneSchema, req.body));
  res.status(201).json({ zone });
};

export const update: RequestHandler = async (req, res) => {
  const { id } = validated(idParams, req.params);
  const zone = await DeliveryZoneModel.findByIdAndUpdate(id, validated(updateDeliveryZoneSchema, req.body), {
    new: true,
    runValidators: true,
  }).lean();
  if (!zone) throw AppError.notFound('Delivery zone not found', 'ZONE_NOT_FOUND');
  res.json({ zone });
};

export const remove: RequestHandler = async (req, res) => {
  const { id } = validated(idParams, req.params);
  if (await OrderModel.exists({ 'deliveryAddress.zone': id })) {
    throw AppError.conflict('This zone has orders and cannot be deleted. Deactivate it instead.', 'ZONE_IN_USE');
  }
  const zone = await DeliveryZoneModel.findByIdAndDelete(id);
  if (!zone) throw AppError.notFound('Delivery zone not found', 'ZONE_NOT_FOUND');
  res.status(204).end();
};
