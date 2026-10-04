import { ChevronLeft, ChevronRight, ImageOff } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { ProductImage } from '@/components/ui'
import { cn } from '@/lib/cn'

/** Swipeable (scroll-snap) image carousel with thumbnails on desktop and dots on mobile. */
export function ProductGallery({ images, name }: { images: { url: string }[]; name: string }) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(0)
  const count = images.length

  useEffect(() => {
    setIndex(0)
    trackRef.current?.scrollTo({ left: 0, behavior: 'auto' })
  }, [images])

  const goTo = (i: number) => {
    const track = trackRef.current
    if (!track) return
    const next = Math.max(0, Math.min(count - 1, i))
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    track.scrollTo({ left: next * track.clientWidth, behavior: reduce ? 'auto' : 'smooth' })
    setIndex(next)
  }

  const onScroll = () => {
    const track = trackRef.current
    if (!track) return
    const i = Math.round(track.scrollLeft / track.clientWidth)
    if (i !== index) setIndex(i)
  }

  if (count === 0) {
    return (
      <div className="flex aspect-[4/5] items-center justify-center rounded-md bg-sand/60 text-stone">
        <ImageOff className="size-10" strokeWidth={1.25} aria-hidden="true" />
        <span className="sr-only">No photo yet</span>
      </div>
    )
  }

  return (
    <div
      className="flex flex-col gap-4 md:flex-row-reverse md:gap-5"
      role="region"
      aria-roledescription="carousel"
      aria-label={`${name} photos`}
    >
      <div className="group relative min-w-0 flex-1">
        <div
          ref={trackRef}
          onScroll={onScroll}
          className="-mx-5 flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] sm:mx-0 sm:rounded-md [&::-webkit-scrollbar]:hidden"
        >
          {images.map((img, i) => (
            <div
              key={img.url}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${count}`}
              className="aspect-[4/5] w-full shrink-0 snap-center bg-sand/60"
            >
              <ProductImage
                src={img.url}
                alt={i === 0 ? name : `${name}, photo ${i + 1}`}
                width={900}
                height={1125}
                loading={i === 0 ? 'eager' : 'lazy'}
                fetchPriority={i === 0 ? 'high' : undefined}
                className="size-full object-cover"
                draggable={false}
              />
            </div>
          ))}
        </div>

        {count > 1 && (
          <>
            <div className="pointer-events-none absolute inset-x-3 top-1/2 hidden -translate-y-1/2 justify-between opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100 md:flex">
              <button
                type="button"
                onClick={() => goTo(index - 1)}
                disabled={index === 0}
                className="pointer-events-auto flex size-11 items-center justify-center rounded-full bg-linen/90 text-charcoal shadow-soft backdrop-blur transition-opacity disabled:opacity-0"
                aria-label="Previous photo"
              >
                <ChevronLeft className="size-5" strokeWidth={1.5} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => goTo(index + 1)}
                disabled={index === count - 1}
                className="pointer-events-auto flex size-11 items-center justify-center rounded-full bg-linen/90 text-charcoal shadow-soft backdrop-blur transition-opacity disabled:opacity-0"
                aria-label="Next photo"
              >
                <ChevronRight className="size-5" strokeWidth={1.5} aria-hidden="true" />
              </button>
            </div>

            {/* Mobile position indicator */}
            <div className="mt-4 flex items-center justify-center gap-2 md:hidden" aria-hidden="true">
              {images.map((img, i) => (
                <span
                  key={img.url}
                  className={cn(
                    'h-1 rounded-full transition-all duration-300',
                    i === index ? 'w-6 bg-charcoal' : 'w-1.5 bg-charcoal/25',
                  )}
                />
              ))}
            </div>
            <p className="sr-only" aria-live="polite">
              Photo {index + 1} of {count}
            </p>
          </>
        )}
      </div>

      {count > 1 && (
        <ul className="hidden w-20 shrink-0 flex-col gap-3 md:flex" aria-label="Choose a photo">
          {images.map((img, i) => (
            <li key={img.url}>
              <button
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Show photo ${i + 1} of ${count}`}
                aria-current={i === index ? 'true' : undefined}
                className={cn(
                  'block aspect-[4/5] w-full overflow-hidden rounded-md bg-sand/60 transition-opacity duration-300',
                  'ring-offset-2 ring-offset-linen',
                  i === index ? 'ring-1 ring-charcoal' : 'opacity-60 hover:opacity-100',
                )}
              >
                <img src={img.url} alt="" loading="lazy" className="size-full object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
