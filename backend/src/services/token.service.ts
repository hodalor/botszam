import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import { USER_ROLES, type UserRole } from '../models/User';

export const AUTH_COOKIE_NAME = 'botszam_token';

export interface AuthPayload {
  userId: string;
  role: UserRole;
}

export function signAccessToken(payload: AuthPayload): string {
  return jwt.sign({ role: payload.role }, env.JWT_SECRET, {
    subject: payload.userId,
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
    algorithm: 'HS256',
  });
}

/** Returns the payload for a valid token, or null if it is invalid/expired. */
export function verifyAccessToken(token: string): AuthPayload | null {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] });
    if (typeof decoded === 'string' || !decoded.sub) return null;
    const role = (decoded as { role?: unknown }).role;
    if (!USER_ROLES.includes(role as UserRole)) return null;
    return { userId: decoded.sub, role: role as UserRole };
  } catch {
    return null;
  }
}
