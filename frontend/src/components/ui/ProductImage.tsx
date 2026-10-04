import { ImageOff } from 'lucide-react'
import type { ImgHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'
import { cloudinaryUrl } from '@/lib/cloudinary'

type ProductImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'width' | 'height'> & {
  src: string | null | undefined
  alt: string
  /** Display width used for Cloudinary `w_` and the HTML width attribute. */
  width: number
  /** Display height used for Cloudinary `h_` and the HTML height attribute. */
  height: number
  /** Crop mode for Cloudinary. Default fill. */
  crop?: 'fill' | 'fit' | 'limit'
  /** Request 2× assets for retina; HTML width/height stay at the layout size. */
  dpr?: 1 | 2
  fallbackClassName?: string
}

/**
 * Lazy product image with fixed width/height (reduces CLS) and Cloudinary
 * f_auto,q_auto,w_… transforms when the URL is from Cloudinary.
 */
export function ProductImage({
  src,
  alt,
  width,
  height,
  crop = 'fill',
  dpr = 2,
  className,
  loading = 'lazy',
  decoding = 'async',
  fallbackClassName,
  ...rest
}: ProductImageProps) {
  if (!src) {
    return (
      <span
        className={cn('flex items-center justify-center bg-sand/60 text-stone', fallbackClassName, className)}
        style={{ aspectRatio: `${width} / ${height}` }}
        role="img"
        aria-label={alt || 'No photo'}
      >
        <ImageOff className="size-8" strokeWidth={1.25} aria-hidden="true" />
      </span>
    )
  }

  const transformed = cloudinaryUrl(src, {
    width: width * dpr,
    height: height * dpr,
    crop,
  })

  return (
    <img
      src={transformed}
      alt={alt}
      width={width}
      height={height}
      loading={loading}
      decoding={decoding}
      className={className}
      {...rest}
    />
  )
}
