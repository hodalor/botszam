import { AnimatePresence, motion, useInView } from 'framer-motion'
import { HandCoins, MessageCircle, ShoppingBag, Truck } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { isApiError } from '@/api/client'
import { useFeaturedProducts, useProduct, useProducts } from '@/api/products'
import { useDeliveryZones } from '@/api/store'
import type { PublicProduct, PublicVariant } from '@/api/types'
import { ProductRow } from '@/components/product/ProductCard'
import { ProductGallery } from '@/components/product/ProductGallery'
import { StockStatus, VariantPicker } from '@/components/product/VariantPicker'
import { defaultVariant, findVariant } from '@/components/product/variants'
import { Accordion, Badge, Button, ErrorState, QuantityStepper, Skeleton, SkeletonText } from '@/components/ui'
import { useCategories } from '@/api/store'
import { BRAND_NAME, categoryLabel, DEFAULT_CARE, MAX_QUANTITY_PER_ITEM } from '@/lib/constants'
import { formatKwacha } from '@/lib/money'
import { PageMeta } from '@/components/seo/PageMeta'
import { cloudinaryUrl } from '@/lib/cloudinary'
import { useWhatsAppLink } from '@/lib/useWhatsAppLink'
import { useCart } from '@/stores/cart'
import { NotFoundPage } from './NotFoundPage'

export function ProductPage() {
  const { slug } = useParams()
  const query = useProduct(slug)
  const notFound = isApiError(query.error) && query.error.status === 404

  if (notFound) return <NotFoundPage />
  if (query.isError) {
    return (
      <div className="container-page py-16">
        <ErrorState
          title="We couldn’t load this towel"
          error={query.error}
          onRetry={() => query.refetch()}
          retrying={query.isFetching}
        />
      </div>
    )
  }
  if (query.isPending) return <ProductSkeleton />
  // Remount on slug change so the selection resets when moving between related products.
  return <ProductView key={query.data.id} product={query.data} />
}

function ProductView({ product }: { product: PublicProduct }) {
  const { data: categories } = useCategories()
  const initial = defaultVariant(product)
  const [colour, setColour] = useState(initial?.colour)
  const [size, setSize] = useState(initial?.size)
  const [quantity, setQuantity] = useState(1)
  const addItem = useCart((s) => s.addItem)
  const catName = categoryLabel(product.category, categories)
  const variant = findVariant(product, colour, size)
  const galleryImages = (() => {
    if (!colour) return product.images
    const forColour =
      product.colourImages?.find((c) => c.colour.toLowerCase() === colour.toLowerCase())?.images ??
      product.variants.find((v) => v.colour.toLowerCase() === colour.toLowerCase() && v.images?.length)?.images
    return forColour && forColour.length > 0 ? forColour : product.images
  })()
  const primaryImage = galleryImages[0]?.url ?? product.images[0]?.url ?? null
  const inCart = useCart(
    (s) => s.items.find((i) => i.productId === product.id && i.variantSku === variant?.sku)?.quantity ?? 0,
  )
  const stockCap = variant?.stockLeft ?? MAX_QUANTITY_PER_ITEM
  const maxAddable = Math.max(0, Math.min(MAX_QUANTITY_PER_ITEM, stockCap) - inCart)
  const canAdd = Boolean(variant?.inStock) && maxAddable > 0
  const qty = Math.min(quantity, Math.max(1, maxAddable))

  const ctaRef = useRef<HTMLDivElement>(null)
  const endRef = useRef<HTMLDivElement>(null)
  const ctaInView = useInView(ctaRef)
  const reachedEnd = useReached(endRef)

  const add = () => {
    if (!variant || !canAdd) return
    addItem(
      {
        productId: product.id,
        variantSku: variant.sku,
        slug: product.slug,
        name: product.name,
        size: variant.size,
        colour: variant.colour,
        image: primaryImage,
        unitPriceNgwee: variant.priceNgwee,
      },
      qty,
    )
    toast.success(`${product.name} added to your cart`, { description: `${variant.size} · ${variant.colour}` })
    setQuantity(1)
  }

  const buttonLabel = !variant
    ? 'Unavailable'
    : !variant.inStock
      ? 'Out of stock'
      : maxAddable === 0
        ? 'All available stock is in your cart'
        : 'Add to cart'

  return (
    <>
      <PageMeta
        title={product.name}
        description={
          product.description?.trim().slice(0, 160) ||
          `${product.name} — premium cotton towel from Botswana, delivered across Zambia.`
        }
        path={`/product/${product.slug}`}
        image={cloudinaryUrl(primaryImage, { width: 1200, height: 1200, crop: 'fill' }) || undefined}
        type="product"
      />
      <div className="container-page pb-6 pt-4 md:pt-8">
        <nav aria-label="Breadcrumb" className="mb-5 text-sm text-stone md:mb-8">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link to="/shop" className="hover:text-charcoal">Shop</Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link to={`/shop/${product.category}`} className="hover:text-charcoal">
                {catName}
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="truncate text-charcoal-soft">{product.name}</li>
          </ol>
        </nav>

        <div className="grid gap-8 md:grid-cols-[1.15fr_1fr] md:gap-12 lg:gap-20">
          <ProductGallery
            key={colour ?? 'default'}
            images={galleryImages}
            name={colour ? `${product.name} — ${colour}` : product.name}
          />

          <div className="md:sticky md:top-28 md:self-start">
            <p className="eyebrow">{catName}</p>
            <h1 className="mt-3 text-[2.25rem] leading-[1.05] md:text-5xl">{product.name}</h1>
            <Price variant={variant} product={product} />

            <div className="mt-8">
              <VariantPicker
                product={product}
                colour={colour}
                size={size}
                onChange={(next) => {
                  setColour(next.colour)
                  setSize(next.size)
                  setQuantity(1)
                }}
              />
            </div>

            <div ref={ctaRef} className="mt-8 flex flex-col gap-4">
              <StockStatus variant={variant} />
              <div className="flex gap-3">
                <QuantityStepper
                  value={qty}
                  onChange={setQuantity}
                  max={Math.max(1, maxAddable)}
                  disabled={!canAdd}
                  itemLabel={product.name}
                />
                <Button
                  size="lg"
                  className="flex-1"
                  onClick={add}
                  disabled={!canAdd}
                  leftIcon={canAdd ? <ShoppingBag className="size-4" aria-hidden="true" /> : undefined}
                >
                  {buttonLabel}
                </Button>
              </div>
              {inCart > 0 && (
                <p className="text-sm text-stone">
                  {inCart} already in your cart.
                </p>
              )}
            </div>

            <Assurances productName={product.name} />

            <ProductDetails product={product} />
          </div>
        </div>
      </div>

      <RelatedProducts product={product} />
      <div ref={endRef} aria-hidden="true" />

      <MobileBuyBar
        visible={!ctaInView && !reachedEnd}
        product={product}
        variant={variant}
        canAdd={canAdd}
        label={buttonLabel}
        onAdd={add}
      />
    </>
  )
}

/** True once the element's top has scrolled into (or past) the viewport. */
function useReached(ref: RefObject<HTMLElement | null>) {
  const [reached, setReached] = useState(false)
  useEffect(() => {
    const check = () => {
      const el = ref.current
      if (el) setReached(el.getBoundingClientRect().top < window.innerHeight)
    }
    check()
    window.addEventListener('scroll', check, { passive: true })
    window.addEventListener('resize', check)
    return () => {
      window.removeEventListener('scroll', check)
      window.removeEventListener('resize', check)
    }
  }, [ref])
  return reached
}

function Price({ variant, product }: { variant?: PublicVariant; product: PublicProduct }) {
  const price = variant?.priceNgwee ?? product.minPriceNgwee
  const compareAt = variant?.compareAtPriceNgwee
  const saving = variant && compareAt ? Math.round((1 - variant.priceNgwee / compareAt) * 100) : 0

  return (
    <div className="mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-2">
      {price !== null && (
        <p className="font-display text-2xl tabular-nums md:text-[1.75rem]">
          <span className="sr-only">Price: </span>
          {formatKwacha(price)}
        </p>
      )}
      {compareAt && (
        <>
          <p className="text-base text-stone tabular-nums">
            <span className="sr-only">Was </span>
            <s>{formatKwacha(compareAt)}</s>
          </p>
          {saving > 0 && <Badge tone="accent">Save {saving}%</Badge>}
        </>
      )}
    </div>
  )
}

function Assurances({ productName }: { productName: string }) {
  const zones = useDeliveryZones()
  const whatsapp = useWhatsAppLink(`Hello ${BRAND_NAME}, I have a question about the ${productName}.`)
  const cheapest = zones.data?.length ? Math.min(...zones.data.map((z) => z.feeNgwee)) : null

  return (
    <ul className="mt-8 flex flex-col gap-3 border-t border-sand pt-6 text-sm text-charcoal-soft">
      <li className="flex items-start gap-3">
        <Truck className="mt-0.5 size-4 shrink-0 text-charcoal" strokeWidth={1.5} aria-hidden="true" />
        <span>
          Delivery across Zambia
          {cheapest !== null && <> from {formatKwacha(cheapest)}</>}. Same or next day in Lusaka.
        </span>
      </li>
      <li className="flex items-start gap-3">
        <HandCoins className="mt-0.5 size-4 shrink-0 text-charcoal" strokeWidth={1.5} aria-hidden="true" />
        <span>Pay on delivery, or pay ahead with MTN MoMo or Airtel Money.</span>
      </li>
      {whatsapp && (
        <li className="flex items-start gap-3">
          <MessageCircle className="mt-0.5 size-4 shrink-0 text-charcoal" strokeWidth={1.5} aria-hidden="true" />
          <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="underline decoration-charcoal/30 underline-offset-4 hover:decoration-charcoal">
            Questions? Ask us on WhatsApp
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </li>
      )}
    </ul>
  )
}

function ProductDetails({ product }: { product: PublicProduct }) {
  const zones = useDeliveryZones()
  const care = product.careInstructions
    ? product.careInstructions.split(/\n+/).filter(Boolean)
    : DEFAULT_CARE

  return (
    <Accordion
      className="mt-8"
      defaultOpen={['description']}
      items={[
        {
          id: 'description',
          title: 'Description',
          content: (
            <>
              <p>{product.description || 'Heavyweight cotton, imported from Botswana.'}</p>
              <dl className="mt-5 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
                <dt className="text-stone">Sizes</dt>
                <dd>{product.sizes.join(', ')}</dd>
                <dt className="text-stone">Colours</dt>
                <dd>{product.colours.map((c) => c.name).join(', ')}</dd>
              </dl>
            </>
          ),
        },
        {
          id: 'care',
          title: 'Care instructions',
          content: (
            <ul className="flex list-disc flex-col gap-2 pl-5 marker:text-sand-deep">
              {care.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          ),
        },
        {
          id: 'delivery',
          title: 'Delivery & payment',
          content: (
            <div className="flex flex-col gap-5">
              <div>
                <h4 className="mb-2 font-sans text-sm font-medium text-charcoal">Delivery</h4>
                {zones.isPending ? (
                  <SkeletonText lines={3} />
                ) : zones.isError ? (
                  <p>
                    Delivery fees couldn’t be loaded.{' '}
                    <button type="button" onClick={() => zones.refetch()} className="underline underline-offset-4">
                      Try again
                    </button>
                  </p>
                ) : zones.data.length === 0 ? (
                  <p>Delivery fees are confirmed at checkout.</p>
                ) : (
                  <ul className="divide-y divide-sand text-sm">
                    {zones.data.map((z) => (
                      <li key={z.id} className="flex items-baseline justify-between gap-4 py-2">
                        <span>
                          {z.name}
                          <span className="block text-xs text-stone">{z.estimatedDays}</span>
                        </span>
                        <span className="shrink-0 tabular-nums text-charcoal">{formatKwacha(z.feeNgwee)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <h4 className="mb-2 font-sans text-sm font-medium text-charcoal">Payment</h4>
                <p>
                  <strong className="font-medium text-charcoal">Mobile Money:</strong> after you order we show our
                  MTN, Airtel and Zamtel numbers. Send the exact total, then enter your transaction reference and
                  we confirm your payment.
                </p>
                <p className="mt-2">
                  <strong className="font-medium text-charcoal">Pay on delivery:</strong> pay in cash or by mobile
                  money when your order arrives.
                </p>
              </div>
            </div>
          ),
        },
      ]}
    />
  )
}

function RelatedProducts({ product }: { product: PublicProduct }) {
  const sameCategory = useProducts({ category: product.category, sort: 'featured', limit: 5 })
  const featured = useFeaturedProducts()

  const related = useMemo(() => {
    const pick = (list?: PublicProduct[]) => (list ?? []).filter((p) => p.id !== product.id)
    const fromCategory = pick(sameCategory.data?.items)
    const extra = pick(featured.data).filter((p) => !fromCategory.some((c) => c.id === p.id))
    return [...fromCategory, ...extra].slice(0, 4)
  }, [sameCategory.data, featured.data, product.id])

  const loading = sameCategory.isPending && featured.isPending
  if (!loading && related.length === 0) return null

  return (
    <section aria-labelledby="related" className="container-page pt-20 md:pt-28">
      <div className="mb-8 md:mb-10">
        <p className="eyebrow mb-3">Complete the set</p>
        <h2 id="related" className="text-[2rem] leading-tight md:text-4xl">
          You may also like
        </h2>
      </div>
      {sameCategory.isError && featured.isError ? (
        <ErrorState compact error={sameCategory.error} onRetry={() => sameCategory.refetch()} retrying={sameCategory.isFetching} />
      ) : (
        <ProductRow products={related} loading={loading} label="Related products" />
      )}
    </section>
  )
}

function MobileBuyBar({
  visible,
  product,
  variant,
  canAdd,
  label,
  onAdd,
}: {
  visible: boolean
  product: PublicProduct
  variant?: PublicVariant
  canAdd: boolean
  label: string
  onAdd: () => void
}) {
  const cartOpen = useCart((s) => s.isOpen)
  return (
    <AnimatePresence>
      {visible && !cartOpen && (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-x-0 bottom-0 z-30 border-t border-sand bg-linen/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
        >
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-base leading-tight">{product.name}</p>
              <p className="truncate text-xs text-stone">
                {variant ? (
                  <>
                    <span className="tabular-nums text-charcoal">{formatKwacha(variant.priceNgwee)}</span> · {variant.size} ·{' '}
                    {variant.colour}
                  </>
                ) : (
                  'Choose a size and colour'
                )}
              </p>
            </div>
            <Button onClick={onAdd} disabled={!canAdd} className="shrink-0">
              {canAdd ? 'Add to cart' : label === 'Out of stock' ? 'Sold out' : 'Unavailable'}
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function ProductSkeleton() {
  return (
    <div className="container-page pt-4 md:pt-8" aria-busy="true" aria-label="Loading product">
      <Skeleton className="mb-5 h-4 w-48 md:mb-8" />
      <div className="grid gap-8 md:grid-cols-[1.15fr_1fr] md:gap-12 lg:gap-20">
        <div className="flex gap-5 md:flex-row-reverse">
          <Skeleton className="aspect-[4/5] flex-1" />
          <div className="hidden w-20 flex-col gap-3 md:flex">
            <Skeleton className="aspect-[4/5] w-full" />
            <Skeleton className="aspect-[4/5] w-full" />
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-12 w-4/5" />
          <Skeleton className="h-7 w-28" />
          <div className="mt-6 flex gap-3">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="size-10 rounded-full" />
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <Skeleton className="h-11 w-28" />
            <Skeleton className="h-11 w-28" />
          </div>
          <Skeleton className="mt-6 h-13 w-full" />
          <SkeletonText lines={4} className="mt-8" />
        </div>
      </div>
    </div>
  )
}
