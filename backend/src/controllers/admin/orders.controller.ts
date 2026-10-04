import type { RequestHandler } from 'express';
import { isValidObjectId } from 'mongoose';
import { authUserId } from '../../middleware/auth';
import { validated } from '../../middleware/validate';
import { OrderModel } from '../../models/Order';
import {
  adminRejectPayment,
  adminUpdateStatus,
  adminVerifyPayment,
} from '../../services/order.service';
import { AppError } from '../../utils/AppError';
import { normalisePhone } from '../../utils/phone';
import { addDays, parseLusakaDay } from '../../utils/time';
import { escapeRegex, paginationMeta } from '../../utils/validation';
import {
  adminOrderListQuery,
  adminOrderParams,
  adminStatusSchema,
  rejectPaymentSchema,
  verifyPaymentSchema,
} from '../../validators/order.validators';

function searchFilter(search: string) {
  const or: Record<string, unknown>[] = [
    { orderNumber: { $regex: `^${escapeRegex(search.toUpperCase())}` } },
    { 'customer.name': { $regex: escapeRegex(search), $options: 'i' } },
  ];
  const phone = normalisePhone(search);
  if (phone) or.push({ 'customer.phone': phone });
  const digits = search.replace(/\D/g, '');
  if (digits.length >= 4) or.push({ 'customer.phone': { $regex: escapeRegex(digits.replace(/^0/, '')) } });
  return { $or: or };
}

export const list: RequestHandler = async (req, res) => {
  const q = validated(adminOrderListQuery, req.query);
  const filter: Record<string, unknown> = {};
  if (q.status) filter.status = q.status;
  if (q.paymentMethod) filter.paymentMethod = q.paymentMethod;
  if (q.from || q.to) {
    filter.createdAt = {
      ...(q.from && { $gte: parseLusakaDay(q.from) }),
      ...(q.to && { $lt: addDays(parseLusakaDay(q.to), 1) }),
    };
  }
  if (q.search) Object.assign(filter, searchFilter(q.search));

  const [items, total] = await Promise.all([
    OrderModel.find(filter)
      .sort({ createdAt: -1 })
      .skip((q.page - 1) * q.limit)
      .limit(q.limit)
      .select('-statusHistory')
      .lean(),
    OrderModel.countDocuments(filter),
  ]);
  res.json({ items, pagination: paginationMeta(q.page, q.limit, total) });
};

export const getOne: RequestHandler = async (req, res) => {
  const { orderNumber } = validated(adminOrderParams, req.params);
  const filter = isValidObjectId(orderNumber) ? { _id: orderNumber } : { orderNumber: orderNumber.toUpperCase() };
  const order = await OrderModel.findOne(filter)
    .populate('user', 'name email phone')
    .populate('payment.verifiedBy', 'name email')
    .populate('statusHistory.by', 'name email role')
    .lean();
  if (!order) throw AppError.notFound('Order not found', 'ORDER_NOT_FOUND');
  res.json({ order });
};

export const updateStatus: RequestHandler = async (req, res) => {
  const { orderNumber } = validated(adminOrderParams, req.params);
  const { status, note } = validated(adminStatusSchema, req.body);
  res.json({ order: await adminUpdateStatus(orderNumber.toUpperCase(), status, authUserId(req), note) });
};

export const verifyPayment: RequestHandler = async (req, res) => {
  const { orderNumber } = validated(adminOrderParams, req.params);
  const { note } = validated(verifyPaymentSchema, req.body);
  res.json({ order: await adminVerifyPayment(orderNumber.toUpperCase(), authUserId(req), note) });
};

export const rejectPayment: RequestHandler = async (req, res) => {
  const { orderNumber } = validated(adminOrderParams, req.params);
  const { reason } = validated(rejectPaymentSchema, req.body);
  res.json({ order: await adminRejectPayment(orderNumber.toUpperCase(), authUserId(req), reason) });
};
