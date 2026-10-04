import bcrypt from 'bcryptjs';
import type { CookieOptions, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { DeliveryZoneModel } from '../models/DeliveryZone';
import { UserModel, type UserDocument } from '../models/User';
import { AppError } from '../utils/AppError';
import { normalisePhone } from '../utils/phone';
import type { LoginInput, RegisterInput, UpdateMeInput } from '../validators/auth.validators';
import { AUTH_COOKIE_NAME, signAccessToken } from './token.service';

const BCRYPT_ROUNDS = 12;
// Compared against when no user matches, so login timing does not reveal which accounts exist.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', BCRYPT_ROUNDS);

function cookieOptions(): CookieOptions {
  // Cross-site Netlify ↔ Render needs SameSite=None; Secure is required with None and in production.
  if (env.isProduction) {
    return { httpOnly: true, secure: true, sameSite: 'none', path: '/' };
  }
  return {
    httpOnly: true,
    secure: env.COOKIE_SAMESITE === 'none',
    sameSite: env.COOKIE_SAMESITE,
    path: '/',
  };
}

/** Issues a JWT, sets it as an httpOnly cookie and returns it for clients that prefer headers. */
export function issueSession(res: Response, user: UserDocument): string {
  const token = signAccessToken({ userId: String(user._id), role: user.role });
  const { exp } = jwt.decode(token) as { exp: number };
  res.cookie(AUTH_COOKIE_NAME, token, { ...cookieOptions(), expires: new Date(exp * 1000) });
  return token;
}

export function clearSession(res: Response) {
  res.clearCookie(AUTH_COOKIE_NAME, cookieOptions());
}

export async function registerUser(input: RegisterInput): Promise<UserDocument> {
  const conflict = await UserModel.exists({
    $or: [{ phone: input.phone }, ...(input.email ? [{ email: input.email }] : [])],
  });
  if (conflict) {
    throw AppError.conflict('An account with this phone number or email already exists', 'ACCOUNT_EXISTS');
  }
  return UserModel.create({
    name: input.name,
    email: input.email,
    phone: input.phone,
    passwordHash: await bcrypt.hash(input.password, BCRYPT_ROUNDS),
    role: 'customer',
  });
}

export async function loginUser(input: LoginInput): Promise<UserDocument> {
  const isEmail = input.identifier.includes('@');
  const phone = isEmail ? null : normalisePhone(input.identifier);
  const filter = isEmail ? { email: input.identifier.toLowerCase() } : phone ? { phone } : null;

  const user = filter ? await UserModel.findOne(filter).select('+passwordHash') : null;
  const valid = await bcrypt.compare(input.password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !valid) {
    throw AppError.unauthorized('Incorrect email/phone or password', 'INVALID_CREDENTIALS');
  }
  return user;
}

export async function getUser(userId: string): Promise<UserDocument> {
  const user = await UserModel.findById(userId);
  if (!user) throw AppError.unauthorized('Account no longer exists', 'INVALID_TOKEN');
  return user;
}

export async function updateUser(userId: string, input: UpdateMeInput): Promise<UserDocument> {
  const user = await UserModel.findById(userId).select('+passwordHash');
  if (!user) throw AppError.unauthorized('Account no longer exists', 'INVALID_TOKEN');

  if (input.newPassword) {
    const valid = await bcrypt.compare(input.currentPassword ?? '', user.passwordHash);
    if (!valid) throw AppError.badRequest('Current password is incorrect', 'INVALID_PASSWORD');
    user.passwordHash = await bcrypt.hash(input.newPassword, BCRYPT_ROUNDS);
  }

  if (input.name !== undefined) user.name = input.name;
  if (input.phone !== undefined && input.phone !== user.phone) {
    if (await UserModel.exists({ phone: input.phone, _id: { $ne: user._id } })) {
      throw AppError.conflict('This phone number is used by another account', 'PHONE_TAKEN');
    }
    user.phone = input.phone;
  }
  if (input.email === null) {
    user.set('email', undefined);
  } else if (input.email !== undefined && input.email !== user.email) {
    if (await UserModel.exists({ email: input.email, _id: { $ne: user._id } })) {
      throw AppError.conflict('This email is used by another account', 'EMAIL_TAKEN');
    }
    user.email = input.email;
  }

  if (input.addresses) {
    const zoneIds = [...new Set(input.addresses.map((a) => a.zone))];
    const found = await DeliveryZoneModel.countDocuments({ _id: { $in: zoneIds } });
    if (found !== zoneIds.length) {
      throw AppError.badRequest('One of the addresses has an unknown delivery zone', 'INVALID_DELIVERY_ZONE');
    }
    const defaultIndex = Math.max(0, input.addresses.findIndex((a) => a.isDefault));
    user.set(
      'addresses',
      input.addresses.map((a, i) => ({ ...a, isDefault: i === defaultIndex })),
    );
  }

  await user.save();
  return user;
}
