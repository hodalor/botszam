/**
 * Builds a Cloudinary delivery URL with automatic format/quality and a width.
 * Non-Cloudinary URLs (or already-transformed ones) are returned unchanged aside from
 * appending nothing — callers can still use them as-is.
 */
export function cloudinaryUrl(
  url: string | null | undefined,
  opts: { width?: number; height?: number; crop?: 'fill' | 'fit' | 'limit' } = {},
): string {
  if (!url) return ''
  const { width, height, crop = 'fill' } = opts

  // https://res.cloudinary.com/<cloud>/image/upload/v123/folder/file.jpg
  // → insert transforms after /upload/
  const marker = '/image/upload/'
  const idx = url.indexOf(marker)
  if (idx === -1) return url

  const before = url.slice(0, idx + marker.length)
  const after = url.slice(idx + marker.length)

  // Skip if transforms already present (first segment has an underscore or comma).
  const firstSegment = after.split('/')[0] ?? ''
  if (/[_,]/.test(firstSegment) && !/^v\d+$/.test(firstSegment)) return url

  const parts = ['f_auto', 'q_auto']
  if (width) parts.push(`w_${Math.round(width)}`)
  if (height) parts.push(`h_${Math.round(height)}`)
  if (width || height) parts.push(`c_${crop}`)

  return `${before}${parts.join(',')}/${after}`
}
