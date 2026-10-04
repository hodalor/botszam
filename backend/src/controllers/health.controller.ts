import type { RequestHandler } from 'express';
import { isDatabaseConnected } from '../config/db';

export const getHealth: RequestHandler = (_req, res) => {
  const database = isDatabaseConnected() ? 'connected' : 'disconnected';
  res.status(database === 'connected' ? 200 : 503).json({
    status: database === 'connected' ? 'ok' : 'degraded',
    database,
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
};
