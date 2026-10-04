import { Router } from 'express';
import * as orders from '../controllers/order.controller';
import { optionalAuth, requireAuth } from '../middleware/auth';
import { orderCreateLimiter, orderLookupLimiter, paymentProofLimiter } from '../middleware/rateLimit';
import { validate } from '../middleware/validate';
import { orderNumberParams } from '../utils/validation';
import {
  cancelOrderSchema,
  createOrderSchema,
  myOrdersQuery,
  paymentProofSchema,
  trackOrderQuery,
} from '../validators/order.validators';

export const ordersRouter = Router();

ordersRouter.post('/', orderCreateLimiter, optionalAuth, validate({ body: createOrderSchema }), orders.placeOrder);
ordersRouter.get('/track', orderLookupLimiter, validate({ query: trackOrderQuery }), orders.trackOrder);
ordersRouter.get('/mine', requireAuth, validate({ query: myOrdersQuery }), orders.myOrders);
ordersRouter.post(
  '/:orderNumber/payment-proof',
  paymentProofLimiter,
  validate({ params: orderNumberParams, body: paymentProofSchema }),
  orders.paymentProof,
);
ordersRouter.post(
  '/:orderNumber/cancel',
  orderLookupLimiter,
  optionalAuth,
  validate({ params: orderNumberParams, body: cancelOrderSchema }),
  orders.cancelOrder,
);
