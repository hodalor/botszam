import type { RequestHandler } from 'express';
import type { z, ZodType } from 'zod';
import { AppError } from '../utils/AppError';
import { formatZodIssues } from './error';

interface ValidationSchemas {
  body?: ZodType;
  query?: ZodType;
  params?: ZodType;
}

/**
 * Validates and replaces req.body / req.query / req.params with the parsed output,
 * so handlers only ever see coerced, schema-conforming data.
 */
export function validate(schemas: ValidationSchemas): RequestHandler {
  return (req, _res, next) => {
    for (const key of ['params', 'query', 'body'] as const) {
      const schema = schemas[key];
      if (!schema) continue;

      const result = schema.safeParse(req[key] ?? {});
      if (!result.success) {
        return next(
          AppError.badRequest(`Invalid request ${key}`, 'VALIDATION_ERROR', formatZodIssues(result.error)),
        );
      }

      // Express 5 exposes req.query as a getter, so it must be redefined rather than assigned.
      Object.defineProperty(req, key, {
        value: result.data,
        writable: true,
        enumerable: true,
        configurable: true,
      });
    }
    next();
  };
}

/** Types a request part that has already been parsed by validate() with the same schema. */
export function validated<S extends ZodType>(_schema: S, value: unknown): z.output<S> {
  return value as z.output<S>;
}
