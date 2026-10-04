/**
 * Guests open an order with its number + the phone it was placed with. The phone is kept in
 * sessionStorage (cleared when the tab closes) so the customer is not asked again after checkout.
 */
const STORAGE_KEY = 'botszam-order-access'

type AccessMap = Record<string, string>

function read(): AccessMap {
  try {
    const parsed: unknown = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? '{}')
    return parsed && typeof parsed === 'object' ? (parsed as AccessMap) : {}
  } catch {
    return {}
  }
}

function write(map: AccessMap) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(map))
  } catch {
    // Storage can be unavailable (private mode, quota); the customer can still verify by phone.
  }
}

export function normaliseOrderNumber(orderNumber: string): string {
  return orderNumber.trim().toUpperCase()
}

export function getOrderPhone(orderNumber: string): string | null {
  return read()[normaliseOrderNumber(orderNumber)] ?? null
}

export function rememberOrderPhone(orderNumber: string, phone: string) {
  write({ ...read(), [normaliseOrderNumber(orderNumber)]: phone })
}

export function forgetOrderPhone(orderNumber: string) {
  const map = read()
  delete map[normaliseOrderNumber(orderNumber)]
  write(map)
}
