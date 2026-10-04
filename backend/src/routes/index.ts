import { Router } from 'express';
import { listCategories } from '../controllers/catalog.controller';
import { adminRouter } from './admin.routes';
import { authRouter } from './auth.routes';
import { deliveryZonesRouter, productsRouter, settingsRouter } from './catalog.routes';
import { healthRouter } from './health.routes';
import { ordersRouter } from './order.routes';

export const apiRouter = Router();

apiRouter.use('/health', healthRouter);
apiRouter.use('/products', productsRouter);
/** Public category list (mounted as a direct route for Express 5 reliability). */
apiRouter.get('/categories', listCategories);
apiRouter.use('/delivery-zones', deliveryZonesRouter);
apiRouter.use('/settings', settingsRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/orders', ordersRouter);
apiRouter.use('/admin', adminRouter);
