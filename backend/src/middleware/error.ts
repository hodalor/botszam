import type { ErrorRequestHandler, RequestHandler } from 'express';
import mongoose from 'mongoose';
import { MulterError } from 'multer';
import { ZodError } from 'zod';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';

interface ErrorBody {
  error: { message: string; code: string; details?: unknown };
}

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(AppError.notFound(`Route ${req.method} ${req.originalUrl} not found`, 'ROUTE_NOT_FOUND'));
};

function toAppError(err: unknown): AppError {
  if (err instanceof AppError) return err;

  if (err instanceof ZodError) {
    return AppError.badRequest('Validation failed', 'VALIDATION_ERROR', formatZodIssues(err));
  }

  if (err instanceof mongoose.Error.ValidationError) {
    const details = Object.values(err.errors).map((e) => ({ path: e.path, message: e.message }));
    return AppError.badRequest('Validation failed', 'VALIDATION_ERROR', details);
  }

  if (err instanceof mongoose.Error.CastError) {
    return AppError.badRequest(`Invalid value for ${err.path}`, 'INVALID_ID');
  }

  if (isDuplicateKeyError(err)) {
    const sku = err.keyValue?.['variants.sku'];
    if (sku) return AppError.conflict(`SKU ${String(sku)} is already used by another product`, 'DUPLICATE_SKU');
    const fields = Object.keys(err.keyValue ?? {}).join(', ') || 'field';
    return AppError.conflict(`A record with this ${fields} already exists`, 'DUPLICATE_KEY');
  }

  if (err instanceof MulterError) {
    const message = err.code === 'LIMIT_FILE_SIZE' ? 'File is too large' : err.message;
    return AppError.badRequest(message, 'UPLOAD_ERROR');
  }

  // body-parser errors (malformed JSON, payload too large) carry a status and type.
  if (isHttpError(err)) {
    const code = err.type === 'entity.parse.failed' ? 'INVALID_JSON' : 'BAD_REQUEST';
    const message = err.expose ? err.message : 'Bad request';
    return new AppError(message, err.status, code);
  }

  return new AppError('Something went wrong', 500, 'INTERNAL_ERROR');
}

export function formatZodIssues(error: ZodError) {
  return error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message }));
}

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const appError = toAppError(err);

  if (appError.statusCode >= 500 && !(err instanceof AppError)) {
    console.error(`[${req.method} ${req.originalUrl}]`, err);
  }

  const body: ErrorBody = { error: { message: appError.message, code: appError.code } };
  if (appError.details !== undefined) body.error.details = appError.details;
  if (!env.isProduction && appError.statusCode >= 500 && !(err instanceof AppError) && err instanceof Error) {
    body.error.details = { stack: err.stack };
  }

  res.status(appError.statusCode).json(body);
};

function isDuplicateKeyError(err: unknown): err is { code: 11000; keyValue?: Record<string, unknown> } {
  return typeof err === 'object' && err !== null && (err as { code?: unknown }).code === 11000;
}

function isHttpError(
  err: unknown,
): err is { status: number; type?: string; expose?: boolean; message: string } {
  if (typeof err !== 'object' || err === null) return false;
  const status = (err as { status?: unknown }).status;
  return typeof status === 'number' && status >= 400 && status < 500;
}
