export const NGWEE_PER_KWACHA = 100;

/** Formats an integer ngwee amount as "K 250.00". */
export function formatKwacha(ngwee: number): string {
  const sign = ngwee < 0 ? '-' : '';
  const abs = Math.abs(Math.trunc(ngwee));
  const kwacha = Math.floor(abs / NGWEE_PER_KWACHA).toLocaleString('en-US');
  const cents = String(abs % NGWEE_PER_KWACHA).padStart(2, '0');
  return `${sign}K ${kwacha}.${cents}`;
}

export function kwachaToNgwee(kwacha: number): number {
  return Math.round(kwacha * NGWEE_PER_KWACHA);
}

export const ngweeValidator = {
  validator: (value: number | null | undefined) =>
    value === null || value === undefined || (Number.isInteger(value) && value >= 0),
  message: 'Money amounts must be non-negative integers in ngwee',
};
