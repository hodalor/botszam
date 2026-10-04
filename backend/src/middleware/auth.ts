import type { Request, RequestHandler } from 'express';
import { UserModel } from '../models/User';
import { AUTH_COOKIE_NAME, verifyAccessToken, type AuthPayload } from '../services/token.service';
import { AppError } from '../utils/AppError';

declare global {
  namespace Express {
    interface Request {
      auth?: AuthPayload;
    }
  }
}

function extractToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice(7).trim() || null;
  const cookie = (req.cookies as Record<string, string> | undefined)?.[AUTH_COOKIE_NAME];
  return cookie || null;
}

function authenticate(req: Request): AuthPayload {
  const token = extractToken(req);
  if (!token) throw AppError.unauthorized();
  const payload = verifyAccessToken(token);
  if (!payload) throw AppError.unauthorized('Session is invalid or has expired', 'INVALID_TOKEN');
  return payload;
}

/** Attaches req.auth if a valid token is present; never rejects. Used for guest-or-user routes. */
export const optionalAuth: RequestHandler = (req, _res, next) => {
  const token = extractToken(req);
  const payload = token ? verifyAccessToken(token) : null;
  if (payload) req.auth = payload;
  next();
};

export const requireAuth: RequestHandler = (req, _res, next) => {
  req.auth = authenticate(req);
  next();
};

/** Requires a JWT with role=admin, and re-checks the role in the database so demotions apply immediately. */
export const requireAdmin: RequestHandler = async (req, _res, next) => {
  const payload = authenticate(req);
  if (payload.role !== 'admin') throw AppError.forbidden('Admin access required');
  const user = await UserModel.findById(payload.userId).select('role').lean();
  if (!user || user.role !== 'admin') throw AppError.forbidden('Admin access required');
  req.auth = payload;
  next();
};

/** The authenticated user id. Only call after requireAuth/requireAdmin. */
export function authUserId(req: Request): string {
  if (!req.auth) throw AppError.unauthorized();
  return req.auth.userId;
}
