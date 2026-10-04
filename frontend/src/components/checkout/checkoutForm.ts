import { z } from 'zod'
import { isApiError } from '@/api/client'
import type { Address, CreateOrderInput } from '@/api/types'
import { nameSchema, optionalEmailSchema } from '@/lib/forms'
import { zambianPhoneSchema } from '@/lib/phone'
import type { CartItem } from '@/stores/cart'

export const NEW_ADDRESS = 'new'

export const checkoutSchema = z.object({
  name: nameSchema,
  phone: zambianPhoneSchema,
  email: optionalEmailSchema,
  /** A saved address id, or NEW_ADDRESS. */
  addressChoice: z.string(),
  zoneId: z.string().min(1, 'Choose your delivery zone'),
  area: z.string().trim().min(2, 'Enter your area or neighbourhood').max(120, 'That area name is too long'),
  street: z.string().trim().min(2, 'Enter your street and house or plot number').max(200, 'That address is too long'),
  landmark: z.string().trim().max(200, 'Keep the landmark under 200 characters'),
  notes: z.string().trim().max(500, 'Keep notes under 500 characters'),
  paymentMethod: z.enum(['mobile_money', 'pay_on_delivery'], { error: 'Choose how you’d like to pay' }),
  saveAddress: z.boolean(),
})

export type CheckoutFormInput = z.input<typeof checkoutSchema>
export type CheckoutFormValues = z.output<typeof checkoutSchema>

/** Server validation paths → form fields. */
export const CHECKOUT_FIELD_PATHS = {
  'customer.name': 'name',
  'customer.phone': 'phone',
  'customer.email': 'email',
  'deliveryAddress.zoneId': 'zoneId',
  'deliveryAddress.area': 'area',
  'deliveryAddress.street': 'street',
  'deliveryAddress.landmark': 'landmark',
  'deliveryAddress.notes': 'notes',
  paymentMethod: 'paymentMethod',
} as const

export function toOrderInput(values: CheckoutFormValues, items: CartItem[]): CreateOrderInput {
  return {
    items: items.map((i) => ({ productId: i.productId, variantSku: i.variantSku, quantity: i.quantity })),
    customer: { name: values.name, phone: values.phone, email: values.email || undefined },
    deliveryAddress: {
      zoneId: values.zoneId,
      area: values.area,
      street: values.street,
      landmark: values.landmark || undefined,
      notes: values.notes || undefined,
    },
    paymentMethod: values.paymentMethod,
  }
}

export function addressFields(address: Address) {
  return {
    zoneId: address.zone,
    area: address.area,
    street: address.street,
    landmark: address.landmark,
    notes: address.notes,
  }
}

export interface StockIssue {
  key: string
  message: string
  /** Units the server can still sell; 0 or null means the item must be removed. */
  available: number | null
  /** Quantity in the cart when the error happened, so the notice disappears once it is changed. */
  quantityAtError: number
}

/** Recognises the server's per-item stock errors (OUT_OF_STOCK / ITEM_UNAVAILABLE). */
export function stockIssueFromError(error: unknown, items: CartItem[]): StockIssue | null {
  if (!isApiError(error) || (error.code !== 'OUT_OF_STOCK' && error.code !== 'ITEM_UNAVAILABLE')) return null
  const details = (error.details ?? {}) as { productId?: string; variantSku?: string; available?: number }
  const item = items.find((i) => i.productId === details.productId && i.variantSku === details.variantSku)
  if (!item) return null
  const available = typeof details.available === 'number' ? details.available : null
  const label = `${item.name} (${item.size}, ${item.colour})`
  const message =
    error.code === 'ITEM_UNAVAILABLE'
      ? `${label} is no longer available.`
      : available
        ? `Only ${available} left of ${label} — you have ${item.quantity} in your cart.`
        : `${label} has just sold out.`
  return { key: item.key, message, available, quantityAtError: item.quantity }
}
