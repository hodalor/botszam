/** Unsplash image with a server-side crop, so mobile never downloads the desktop file. */
export function unsplash(id: string, width: number, height?: number, crop = 'entropy') {
  const size = height ? `&h=${height}&fit=crop&crop=${crop}` : '&fit=crop'
  return `https://images.unsplash.com/photo-${id}?w=${width}${size}&q=78&auto=format`
}

/** Editorial photography for the storefront. Product photos come from the API. */
export const PHOTOS = {
  hero: '1620626011761-996317b8d101',
  hangingTowels: '1616663717839-2fea42e1a1f6',
  stackOnRack: '1724847885015-be191f1a47ef',
  foldedStack: '1642503109568-dd7cb3d86c94',
  rolledHandTowels: '1648042497232-25de1ed8aaf2',
  beachTowel: '1686125429003-f552c9f16504',
} as const

/**
 * High-res category tiles (served from /public/categories).
 * Prefer these over API catalog snaps, which are too small for large cards.
 */
export const CATEGORY_IMAGES: Record<string, string> = {
  swimming: '/categories/swimming.jpg',
  'home-use': '/categories/home-use.jpg',
  'hotel-use': '/categories/hotel-use.jpg',
  'hotel-home': '/categories/hotel-home.jpg',
  'saloon-use': '/categories/saloon-use.jpg',
}

export function categoryImage(slug: string, fallbackUrl?: string | null, index = 0) {
  if (CATEGORY_IMAGES[slug]) return CATEGORY_IMAGES[slug]!
  if (fallbackUrl) return fallbackUrl
  const keys = Object.values(PHOTOS)
  return unsplash(keys[index % keys.length]!, 800, 1066)
}
