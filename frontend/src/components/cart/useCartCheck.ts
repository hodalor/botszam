import { useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import { isApiError } from '@/api/client'
import { useProductsBySlug } from '@/api/products'
import { MAX_QUANTITY_PER_ITEM } from '@/lib/constants'
import { formatKwacha } from '@/lib/money'
import { useCart, type CartItem } from '@/stores/cart'
import type { CartLineNotice } from './CartLine'

export interface CheckedLine {
  item: CartItem
  status: 'checking' | 'ok' | 'limited' | 'out_of_stock' | 'unavailable' | 'unchecked'
  maxQuantity: number
  livePriceNgwee: number | null
  liveImage: string | null
  liveName: string | null
  notice?: CartLineNotice
  blocked: boolean
}

/**
 * Re-checks the persisted cart against live product data: current prices, removed
 * variants and stock. Display only; the server still validates everything at checkout.
 */
export function useCartCheck() {
  const items = useCart((s) => s.items)
  const syncItem = useCart((s) => s.syncItem)
  const slugs = useMemo(() => [...new Set(items.map((i) => i.slug))], [items])
  const results = useProductsBySlug(slugs)

  const lines = items.map((item): CheckedLine => {
    const result = results[slugs.indexOf(item.slug)]
    const base = { item, livePriceNgwee: null, liveImage: null, liveName: null, maxQuantity: MAX_QUANTITY_PER_ITEM, blocked: false }

    if (!result || result.isPending) return { ...base, status: 'checking' }
    if (result.isError) {
      if (isApiError(result.error) && result.error.status === 404) {
        return { ...base, status: 'unavailable', blocked: true, notice: { tone: 'danger', text: 'This towel is no longer available. Please remove it.' } }
      }
      return { ...base, status: 'unchecked' }
    }

    const product = result.data
    // A different id under the same slug means the product was re-created; the old id would fail at checkout.
    const variant = product.id === item.productId ? product.variants.find((v) => v.sku === item.variantSku) : undefined
    const live = {
      livePriceNgwee: variant?.priceNgwee ?? null,
      liveImage: product.images[0]?.url ?? null,
      liveName: product.name,
    }
    if (!variant) {
      return {
        ...base,
        ...live,
        status: 'unavailable',
        blocked: true,
        notice: { tone: 'danger', text: `${item.size} · ${item.colour} is no longer available. Please remove it.` },
      }
    }
    if (!variant.inStock) {
      return {
        ...base,
        ...live,
        status: 'out_of_stock',
        blocked: true,
        notice: { tone: 'danger', text: 'Sold out in this size and colour. Please remove it to continue.' },
      }
    }
    if (variant.stockLeft !== null) {
      const maxQuantity = Math.min(MAX_QUANTITY_PER_ITEM, variant.stockLeft)
      return {
        ...base,
        ...live,
        status: 'limited',
        maxQuantity,
        notice: { tone: 'warning', text: `Only ${variant.stockLeft} left in stock.` },
      }
    }
    return { ...base, ...live, status: 'ok' }
  })

  // Bring stale cart data (price, name, image, quantity over stock) in line with the catalogue.
  const syncKey = lines
    .map((l) => `${l.item.key}|${l.livePriceNgwee}|${l.liveName}|${l.liveImage}|${l.maxQuantity}|${l.item.quantity}|${l.item.unitPriceNgwee}`)
    .join(',')
  useEffect(() => {
    const repriced: string[] = []
    for (const line of lines) {
      if (line.blocked || line.status === 'checking' || line.status === 'unchecked') continue
      const { item } = line
      const patch: Parameters<typeof syncItem>[1] = {}
      if (line.livePriceNgwee !== null && line.livePriceNgwee !== item.unitPriceNgwee) {
        patch.unitPriceNgwee = line.livePriceNgwee
        repriced.push(`${item.name} is now ${formatKwacha(line.livePriceNgwee)}`)
      }
      if (line.liveName && line.liveName !== item.name) patch.name = line.liveName
      if (line.liveImage !== item.image && line.liveImage) patch.image = line.liveImage
      if (item.quantity > line.maxQuantity) patch.quantity = line.maxQuantity
      if (Object.keys(patch).length > 0) syncItem(item.key, patch)
    }
    if (repriced.length > 0) {
      toast.info('Some prices have changed', { description: repriced.join(' · ') })
    }
    // `syncKey` captures every value the effect reads from `lines`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncKey, syncItem])

  const checking = lines.some((l) => l.status === 'checking')
  const blocked = lines.some((l) => l.blocked)
  const subtotalNgwee = lines.reduce((sum, l) => sum + (l.blocked ? 0 : l.item.unitPriceNgwee * l.item.quantity), 0)
  const count = lines.reduce((n, l) => n + l.item.quantity, 0)

  return { lines, checking, blocked, subtotalNgwee, count }
}
