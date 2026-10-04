import type { RequestHandler } from 'express';
import { authUserId } from '../middleware/auth';
import { validated } from '../middleware/validate';
import { OrderModel } from '../models/Order';
import { toCustomerOrder } from '../services/order.serializer';
import {
  cancelOrderByCustomer,
  createOrder,
  findOrderForCustomer,
  getInstructionsIfRelevant,
  submitPaymentProof,
} from '../services/order.service';
import { orderNumberParams, paginationMeta } from '../utils/validation';
import {
  cancelOrderSchema,
  createOrderSchema,
  myOrdersQuery,
  paymentProofSchema,
  trackOrderQuery,
} from '../validators/order.validators';

export const placeOrder: RequestHandler = async (req, res) => {
  const body = validated(createOrderSchema, req.body);
  const { order, instructions } = await createOrder({ ...body, userId: req.auth?.userId ?? null });
  res.status(201).json({ order: toCustomerOrder(order), paymentInstructions: instructions });
};

export const paymentProof: RequestHandler = async (req, res) => {
  const { orderNumber } = validated(orderNumberParams, req.params);
  const order = await submitPaymentProof(orderNumber, validated(paymentProofSchema, req.body));
  res.json({ order: toCustomerOrder(order) });
};

export const trackOrder: RequestHandler = async (req, res) => {
  const { orderNumber, phone } = validated(trackOrderQuery, req.query);
  const order = await findOrderForCustomer(orderNumber, { phone });
  res.json({ order: toCustomerOrder(order), paymentInstructions: await getInstructionsIfRelevant(order) });
};

export const myOrders: RequestHandler = async (req, res) => {
  const { page, limit } = validated(myOrdersQuery, req.query);
  const filter = { user: authUserId(req) };
  const [orders, total] = await Promise.all([
    OrderModel.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    OrderModel.countDocuments(filter),
  ]);
  res.json({ items: orders.map(toCustomerOrder), pagination: paginationMeta(page, limit, total) });
};

export const cancelOrder: RequestHandler = async (req, res) => {
  const { orderNumber } = validated(orderNumberParams, req.params);
  const { phone } = validated(cancelOrderSchema, req.body);
  const order = await cancelOrderByCustomer(orderNumber, { phone, userId: req.auth?.userId ?? null });
  res.json({ order: toCustomerOrder(order) });
};
