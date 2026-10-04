import { Router } from 'express';
import * as catalog from '../controllers/catalog.controller';
import { validate } from '../middleware/validate';
import { productFacetsQuery, productListQuery, slugParams } from '../validators/product.validators';

export const productsRouter = Router();

productsRouter.get('/', validate({ query: productListQuery }), catalog.listProducts);
productsRouter.get('/featured', catalog.featuredProducts);
productsRouter.get('/facets', validate({ query: productFacetsQuery }), catalog.productFacets);
productsRouter.get('/:slug', validate({ params: slugParams }), catalog.productBySlug);

export const categoriesRouter = Router();

categoriesRouter.get('/', catalog.listCategories);

export const deliveryZonesRouter = Router();

deliveryZonesRouter.get('/', catalog.listDeliveryZones);

export const settingsRouter = Router();

settingsRouter.get('/public', catalog.publicSettings);
