import rateLimit from 'express-rate-limit';

// In-memory store: limits are per server instance. Use a shared store (e.g. Redis) when scaling out.
function limiter(limit: number, windowMs: number, message: string) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: { message, code: 'RATE_LIMITED' } },
  });
}

const MINUTE = 60 * 1000;

export const apiLimiter = limiter(300, MINUTE, 'Too many requests. Please slow down.');

export const authLimiter = limiter(10, MINUTE, 'Too many attempts. Please wait a minute and try again.');

export const orderCreateLimiter = limiter(20, MINUTE, 'Too many orders. Please wait a minute and try again.');

export const paymentProofLimiter = limiter(
  20,
  MINUTE,
  'Too many payment submissions. Please wait a minute and try again.',
);

/** Guest lookups by order number + phone; limited to slow down guessing. */
export const orderLookupLimiter = limiter(30, MINUTE, 'Too many requests. Please wait a minute and try again.');
