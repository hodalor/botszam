import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { MAX_QUANTITY_PER_ITEM } from '@/lib/constants'

export interface CartItem {
  /** `${productId}:${variantSku}` */
  key: string
  productId: string
  variantSku: string
  slug: string
  name: string
  size: string
  colour: string
  image: string | null
  /** Display price only. The server recalculates every price at checkout. */
  unitPriceNgwee: number
  quantity: number
}

export type CartItemInput = Omit<CartItem, 'key' | 'quantity'>

interface CartState {
  items: CartItem[]
  isOpen: boolean
  addItem: (item: CartItemInput, quantity?: number, options?: { openCart?: boolean }) => void
  setQuantity: (key: string, quantity: number) => void
  removeItem: (key: string) => void
  /** Refresh display data (price, name, image) from the live catalogue. */
  syncItem: (key: string, patch: Partial<Pick<CartItem, 'unitPriceNgwee' | 'name' | 'image' | 'quantity'>>) => void
  clear: () => void
  openCart: () => void
  closeCart: () => void
}

export const cartKey = (productId: string, variantSku: string) => `${productId}:${variantSku}`

const clampQuantity = (quantity: number) =>
  Math.min(MAX_QUANTITY_PER_ITEM, Math.max(1, Math.floor(quantity)))

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      isOpen: false,

      addItem: (input, quantity = 1, options = {}) =>
        set((state) => {
          const key = cartKey(input.productId, input.variantSku)
          const existing = state.items.find((i) => i.key === key)
          const items = existing
            ? state.items.map((i) =>
                // Refresh name/price/image with the latest product data.
                i.key === key ? { ...i, ...input, quantity: clampQuantity(i.quantity + quantity) } : i,
              )
            : [...state.items, { ...input, key, quantity: clampQuantity(quantity) }]
          return { items, isOpen: options.openCart ?? true }
        }),

      setQuantity: (key, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((i) => i.key !== key)
              : state.items.map((i) => (i.key === key ? { ...i, quantity: clampQuantity(quantity) } : i)),
        })),

      removeItem: (key) => set((state) => ({ items: state.items.filter((i) => i.key !== key) })),
      syncItem: (key, patch) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.key === key
              ? { ...i, ...patch, quantity: patch.quantity !== undefined ? clampQuantity(patch.quantity) : i.quantity }
              : i,
          ),
        })),
      clear: () => set({ items: [] }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
    }),
    {
      name: 'botszam-cart',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
    },
  ),
)

export const selectCartCount = (state: CartState) => state.items.reduce((n, i) => n + i.quantity, 0)

export const selectCartSubtotal = (state: CartState) =>
  state.items.reduce((sum, i) => sum + i.unitPriceNgwee * i.quantity, 0)
