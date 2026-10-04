import { ShoppingBag } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import type { PublicProduct } from '@/api/types'
import { Badge, Button, ProductImage, Skeleton } from '@/components/ui'
import { cn } from '@/lib/cn'
import { formatKwacha } from '@/lib/money'
import { useCart } from '@/stores/cart'
import { defaultVariant } from './variants'

const MAX_SWATCHES = 5

function isOnSale(product: PublicProduct) {
  return product.variants.some((v) => v.compareAtPriceNgwee !== null && v.compareAtPriceNgwee > v.priceNgwee)
}

function colourImage(product: PublicProduct, colour: string) {
  return (
    product.colourImages?.find((c) => c.colour.toLowerCase() === colour.toLowerCase())?.images[0]?.url ??
    product.variants.find((v) => v.colour.toLowerCase() === colour.toLowerCase() && v.images?.length)?.images[0]
      ?.url
  )
}

export function ProductCard({ product, priority = false }: { product: PublicProduct; priority?: boolean }) {
  const [primary, secondary] = product.images
  const hasRange = product.minPriceNgwee !== product.maxPriceNgwee
  const onSale = isOnSale(product)
  const extraColours = product.colours.length - MAX_SWATCHES
  const variant = defaultVariant(product)
  const addItem = useCart((s) => s.addItem)
  const canAdd = Boolean(variant?.inStock)

  const addToCart = () => {
    if (!variant || !canAdd) return
    const image =
      colourImage(product, variant.colour) ?? variant.images?.[0]?.url ?? product.images[0]?.url ?? null
    addItem({
      productId: product.id,
      variantSku: variant.sku,
      slug: product.slug,
      name: product.name,
      size: variant.size,
      colour: variant.colour,
      image,
      unitPriceNgwee: variant.priceNgwee,
    })
    toast.success(`${product.name} added to cart`, {
      description: `${variant.size} · ${variant.colour}`,
    })
  }

  return (
    <article className="group flex h-full flex-col">
      <div className="relative aspect-[4/5] overflow-hidden rounded-md bg-coral-soft/40 ring-1 ring-coral/15">
        <Link to={`/product/${product.slug}`} className="absolute inset-0 block" tabIndex={-1} aria-hidden="true">
          {primary ? (
            <>
              <ProductImage
                src={primary.url}
                alt=""
                width={480}
                height={600}
                loading={priority ? 'eager' : 'lazy'}
                fetchPriority={priority ? 'high' : undefined}
                className="absolute inset-0 size-full object-cover transition-transform duration-[1200ms] ease-calm group-hover:scale-[1.04]"
              />
              {secondary && (
                <ProductImage
                  src={secondary.url}
                  alt=""
                  width={480}
                  height={600}
                  loading="lazy"
                  aria-hidden="true"
                  className="absolute inset-0 size-full object-cover opacity-0 transition-opacity duration-700 ease-calm [@media(hover:hover)]:group-hover:opacity-100"
                />
              )}
            </>
          ) : (
            <ProductImage src={null} alt="" width={480} height={600} className="absolute inset-0 size-full" />
          )}
        </Link>
        <div className="absolute left-2.5 top-2.5 flex gap-1.5 md:left-3 md:top-3">
          {!product.inStock && <Badge tone="dark">Sold out</Badge>}
          {product.inStock && onSale && <Badge tone="accent">Sale</Badge>}
        </div>
      </div>

      <div className="mt-3.5 flex flex-1 flex-col gap-1 md:mt-4">
        <h3 className="font-display text-base leading-snug md:text-lg">
          <Link
            to={`/product/${product.slug}`}
            className="text-charcoal transition-colors hover:text-magenta focus-visible:outline-none"
          >
            {product.name}
          </Link>
        </h3>
        {product.minPriceNgwee !== null && (
          <p className="text-sm font-medium text-magenta tabular-nums md:text-[0.9375rem]">
            {hasRange && <span className="font-normal text-stone">From </span>}
            {formatKwacha(product.minPriceNgwee)}
          </p>
        )}
        {product.colours.length > 0 && (
          <div className="mt-1.5 flex items-center gap-1.5">
            <ul className="flex gap-1.5" aria-label={`Available in ${product.colours.map((c) => c.name).join(', ')}`}>
              {product.colours.slice(0, MAX_SWATCHES).map((c) => (
                <li
                  key={c.name}
                  className="size-3 rounded-full ring-1 ring-coral/30 ring-offset-1 ring-offset-linen"
                  style={{ backgroundColor: c.hex ?? undefined }}
                  title={c.name}
                />
              ))}
            </ul>
            {extraColours > 0 && (
              <span className="text-xs text-stone" aria-hidden="true">
                +{extraColours}
              </span>
            )}
          </div>
        )}

        <div className="mt-auto pt-3">
          <Button
            type="button"
            size="sm"
            fullWidth
            disabled={!canAdd}
            onClick={addToCart}
            leftIcon={<ShoppingBag className="size-4" aria-hidden="true" />}
            aria-label={canAdd ? `Add ${product.name} to cart` : `${product.name} is sold out`}
          >
            {canAdd ? 'Add to cart' : 'Sold out'}
          </Button>
        </div>
      </div>
    </article>
  )
}

export function ProductCardSkeleton() {
  return (
    <div>
      <Skeleton className="aspect-[4/5] w-full" />
      <Skeleton className="mt-4 h-5 w-3/4" />
      <Skeleton className="mt-2 h-4 w-1/3" />
      <div className="mt-3 flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="size-3 rounded-full" />
        ))}
      </div>
      <Skeleton className="mt-3 h-11 w-full" />
    </div>
  )
}

const gridClasses = {
  3: 'grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-5 md:grid-cols-3 lg:gap-x-6 lg:gap-y-14',
  4: 'grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-5 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-6 lg:gap-y-14',
}

export function ProductGrid({
  products,
  loading,
  count = 8,
  columns = 4,
  className,
}: {
  products?: PublicProduct[]
  loading?: boolean
  count?: number
  columns?: 3 | 4
  className?: string
}) {
  if (loading) {
    return (
      <div aria-busy="true" aria-label="Loading products" className={cn(gridClasses[columns], className)}>
        {Array.from({ length: count }, (_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    )
  }
  return (
    <ul className={cn(gridClasses[columns], className)}>
      {products?.map((p, i) => (
        <li key={p.id}>
          <ProductCard product={p} priority={i < 4} />
        </li>
      ))}
    </ul>
  )
}

/** Horizontally swipeable on mobile, a 4-column grid from md up. */
export function ProductRow({ products, loading, label }: { products?: PublicProduct[]; loading?: boolean; label: string }) {
  const row =
    '-mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 py-2 [scrollbar-width:none] sm:gap-5 md:mx-0 md:grid md:grid-cols-4 md:gap-6 md:overflow-visible md:px-0 [&::-webkit-scrollbar]:hidden'
  const cell = 'w-[68%] shrink-0 snap-start sm:w-[42%] md:w-auto'

  if (loading) {
    return (
      <div aria-busy="true" aria-label={`Loading ${label}`} className={row}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={cell}>
            <ProductCardSkeleton />
          </div>
        ))}
      </div>
    )
  }
  return (
    <ul aria-label={label} className={row}>
      {products?.map((p) => (
        <li key={p.id} className={cell}>
          <ProductCard product={p} />
        </li>
      ))}
    </ul>
  )
}
