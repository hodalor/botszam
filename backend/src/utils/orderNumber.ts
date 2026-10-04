import { randomInt } from 'node:crypto';
import { env } from '../config/env';
import { lusakaParts } from './time';

/** Builds an order number like BTZ-261004-4821 using the Lusaka calendar date. */
export function generateOrderNumber(date = new Date()): string {
  const { year, month, day } = lusakaParts(date);
  const yy = String(year % 100).padStart(2, '0');
  const mm = String(month + 1).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  const suffix = String(randomInt(0, 10_000)).padStart(4, '0');
  return `${env.ORDER_PREFIX}-${yy}${mm}${dd}-${suffix}`;
}
