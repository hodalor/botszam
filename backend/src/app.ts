import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import { errorHandler, notFoundHandler } from './middleware/error';
import { apiLimiter } from './middleware/rateLimit';
import { apiRouter } from './routes';

export function createApp() {
  const app = express();

  // Behind one reverse proxy (Render/Railway/Nginx) so rate limiting sees real client IPs.
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(helmet());
  app.use(
    cors({
      origin: env.FRONTEND_URL,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    }),
  );
  app.use(morgan(env.isProduction ? 'combined' : 'dev'));
  // JSON only: cross-site HTML forms cannot send application/json, which limits CSRF via the auth cookie.
  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());

  app.use('/api', apiLimiter, apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
