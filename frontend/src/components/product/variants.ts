import type { PublicProduct } from '@/api/types'

export function findVariant(product: PublicProduct, colour?: string, size?: string) {
  return product.variants.find((v) => v.colour === colour && v.size === size)
}

/** First in-stock variant, falling back to the first variant. */
export function defaultVariant(product: PublicProduct) {
  return product.variants.find((v) => v.inStock) ?? product.variants[0]
}

/** Best size to keep when the colour changes: same size if it exists in that colour, else the first in stock. */
export function sizeForColour(product: PublicProduct, colour: string, preferredSize?: string) {
  const options = product.variants.filter((v) => v.colour === colour)
  return (
    options.find((v) => v.size === preferredSize && v.inStock) ??
    options.find((v) => v.inStock) ??
    options.find((v) => v.size === preferredSize) ??
    options[0]
  )?.size
}
