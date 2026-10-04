import { Helmet } from 'react-helmet-async'
import { BRAND_NAME } from '@/lib/constants'

const SITE_URL = (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/+$/, '') || 'https://botszam.com'
const DEFAULT_DESCRIPTION =
  'Premium towels from Botswana, delivered across Zambia. Pay with MTN MoMo, Airtel Money, Zamtel or on delivery.'
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-default.svg`

export interface PageMetaProps {
  /** Page title without the brand suffix. Omit for the homepage brand title. */
  title?: string | null
  description?: string
  /** Absolute or site-relative path for og:url. Defaults to current path when possible. */
  path?: string
  /** Absolute image URL for Open Graph / Twitter. */
  image?: string | null
  /** noindex for account, checkout, admin, etc. */
  noIndex?: boolean
  type?: 'website' | 'product'
}

/** Per-page title, description and Open Graph tags. Pass title={null} to leave the previous title. */
export function PageMeta({
  title,
  description = DEFAULT_DESCRIPTION,
  path,
  image,
  noIndex = false,
  type = 'website',
}: PageMetaProps) {
  if (title === null) return null

  const fullTitle = title ? `${title} · ${BRAND_NAME}` : `${BRAND_NAME} — Premium towels from Botswana`
  const url = path ? (path.startsWith('http') ? path : `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`) : SITE_URL
  const ogImage = image || DEFAULT_OG_IMAGE

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {noIndex && <meta name="robots" content="noindex,nofollow" />}
      <link rel="canonical" href={url} />

      <meta property="og:site_name" content={BRAND_NAME} />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:locale" content="en_ZM" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
    </Helmet>
  )
}
