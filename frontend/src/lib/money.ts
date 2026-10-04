export const NGWEE_PER_KWACHA = 100

/** Formats an integer ngwee amount as "K 250.00" (thousands separated: "K 1,250.00"). */
export function formatKwacha(ngwee: number): string {
  const safe = Number.isFinite(ngwee) ? Math.trunc(ngwee) : 0
  const sign = safe < 0 ? '-' : ''
  const abs = Math.abs(safe)
  const kwacha = Math.floor(abs / NGWEE_PER_KWACHA).toLocaleString('en-US')
  const cents = String(abs % NGWEE_PER_KWACHA).padStart(2, '0')
  return `${sign}K ${kwacha}.${cents}`
}

/** Converts a kwacha amount (e.g. from a form field) to integer ngwee without float drift. */
export function kwachaToNgwee(kwacha: number): number {
  return Math.round(kwacha * NGWEE_PER_KWACHA)
}

/** Integer ngwee → kwacha number for form inputs (e.g. 12500 → 125). */
export function ngweeToKwacha(ngwee: number): number {
  return (Number.isFinite(ngwee) ? Math.trunc(ngwee) : 0) / NGWEE_PER_KWACHA
}
