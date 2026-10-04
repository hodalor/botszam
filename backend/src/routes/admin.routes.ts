import { Router } from 'express';
import * as categories from '../controllers/admin/categories.controller';
import * as customers from '../controllers/admin/customers.controller';
import * as inventory from '../controllers/admin/inventory.controller';
import * as orders from '../controllers/admin/orders.controller';
import * as products from '../controllers/admin/products.controller';
import * as settings from '../controllers/admin/settings.controller';
import { stats } from '../controllers/admin/stats.controller';
import * as zones from '../controllers/admin/zones.controller';
import { requireAdmin } from '../middleware/auth';
import { imageUpload } from '../middleware/upload';
import { validate } from '../middleware/validate';
import { idParams } from '../utils/validation';
import {
  adminCustomerListQuery,
  deliveryZoneSchema,
  inventoryAdjustSchema,
  inventoryLogQuery,
  settingsSchema,
  updateDeliveryZoneSchema,
} from '../validators/admin.validators';
import { createCategorySchema, updateCategorySchema } from '../validators/category.validators';
import {
  adminOrderListQuery,
  adminOrderParams,
  adminStatusSchema,
  rejectPaymentSchema,
  verifyPaymentSchema,
} from '../validators/order.validators';
import {
  adminProductListQuery,
  createProductSchema,
  updateProductSchema,
} from '../validators/product.validators';

export const adminRouter = Router();

adminRouter.use(requireAdmin);

adminRouter.get('/stats', stats);

// Products
adminRouter.get('/products', validate({ query: adminProductListQuery }), products.list);
adminRouter.post('/products', validate({ body: createProductSchema }), products.create);
adminRouter.get('/products/:id', validate({ params: idParams }), products.getOne);
adminRouter.patch('/products/:id', validate({ params: idParams, body: updateProductSchema }), products.update);
adminRouter.delete('/products/:id', validate({ params: idParams }), products.remove);
adminRouter.post('/products/:id/toggle-active', validate({ params: idParams }), products.toggleActive);
adminRouter.post('/products/:id/toggle-featured', validate({ params: idParams }), products.toggleFeatured);
adminRouter.post(
  '/products/:id/images',
  validate({ params: idParams }),
  imageUpload.array('images', 8),
  products.uploadImages,
);
adminRouter.post(
  '/products/:id/colour-images',
  validate({ params: idParams }),
  imageUpload.array('images', 8),
  products.uploadColourImages,
);

// Inventory
adminRouter.get('/inventory/low-stock', inventory.lowStock);
adminRouter.post('/inventory/adjust', validate({ body: inventoryAdjustSchema }), inventory.adjust);
adminRouter.get('/inventory/logs', validate({ query: inventoryLogQuery }), inventory.logs);

// Orders
adminRouter.get('/orders', validate({ query: adminOrderListQuery }), orders.list);
adminRouter.get('/orders/:orderNumber', validate({ params: adminOrderParams }), orders.getOne);
adminRouter.patch(
  '/orders/:orderNumber/status',
  validate({ params: adminOrderParams, body: adminStatusSchema }),
  orders.updateStatus,
);
adminRouter.post(
  '/orders/:orderNumber/verify-payment',
  validate({ params: adminOrderParams, body: verifyPaymentSchema }),
  orders.verifyPayment,
);
adminRouter.post(
  '/orders/:orderNumber/reject-payment',
  validate({ params: adminOrderParams, body: rejectPaymentSchema }),
  orders.rejectPayment,
);

// Delivery zones
adminRouter.get('/delivery-zones', zones.list);
adminRouter.post('/delivery-zones', validate({ body: deliveryZoneSchema }), zones.create);
adminRouter.patch(
  '/delivery-zones/:id',
  validate({ params: idParams, body: updateDeliveryZoneSchema }),
  zones.update,
);
adminRouter.delete('/delivery-zones/:id', validate({ params: idParams }), zones.remove);

// Customers
adminRouter.get('/customers', validate({ query: adminCustomerListQuery }), customers.list);

// Categories
adminRouter.get('/categories', categories.list);
adminRouter.post('/categories', validate({ body: createCategorySchema }), categories.create);
adminRouter.patch(
  '/categories/:id',
  validate({ params: idParams, body: updateCategorySchema }),
  categories.update,
);
adminRouter.delete('/categories/:id', validate({ params: idParams }), categories.remove);

// Settings
adminRouter.get('/settings', settings.get);
adminRouter.put('/settings', validate({ body: settingsSchema }), settings.put);
