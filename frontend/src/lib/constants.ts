export const BRAND_NAME = 'botszam'

export function categoryLabel(slug: string, categories?: { slug: string; name?: string; label?: string }[]): string {
  const fromList = categories?.find((c) => c.slug === slug)
  if (fromList) return fromList.name ?? fromList.label ?? slug
  return slug
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

const TERRY_CARE = [
  'Wash before first use to open up the cotton loops.',
  'Machine wash at 40°C with similar colours. Skip fabric softener: it coats the fibres and reduces absorbency.',
  'Tumble dry on low or line dry in the shade to keep colours rich.',
  'Snag a loop? Trim it with scissors rather than pulling it.',
]

/** Used when a product has no care instructions of its own. */
export const DEFAULT_CARE = TERRY_CARE

/** Shown when settings have not loaded yet. Real values come from GET /settings/public. */
export const FALLBACK_CONTACT = {
  phone: '+260970000000',
  whatsapp: '+260970000000',
  email: 'hello@botszam.com',
}

/** Server-side limit per variant per order. */
export const MAX_QUANTITY_PER_ITEM = 20
