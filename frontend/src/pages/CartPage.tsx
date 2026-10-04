import { ArrowLeft, Lock, ShoppingBag } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useFeaturedProducts } from '@/api/products'
import { useDeliveryZones } from '@/api/store'
import { CartLine } from '@/components/cart/CartLine'
import { useCartCheck } from '@/components/cart/useCartCheck'
import { PaymentBadges } from '@/components/layout/PaymentBadges'
import { ProductRow } from '@/components/product/ProductCard'
import { ButtonLink, EmptyState, Spinner } from '@/components/ui'
import { formatKwacha } from '@/lib/money'
import { PageMeta } from '@/components/seo/PageMeta'

export function CartPage() {
  const { lines, checking, blocked, subtotalNgwee, count } = useCartCheck()

  if (lines.length === 0) {
    return (
      <>
        <PageMeta title="Cart" description="Your botszam cart." path="/cart" noIndex />
        <div className="container-page">
          <EmptyState
            icon={ShoppingBag}
            title="Your cart is empty"
            description="Soft, heavyweight towels from Botswana are waiting for you."
            action={<ButtonLink to="/shop">Shop towels</ButtonLink>}
            className="py-20 md:py-28"
          />
        </div>
        <Suggestions excludeIds={[]} title="Start with our favourites" />
      </>
    )
  }

  return (
    <>
      <PageMeta title="Cart" description="Your botszam cart." path="/cart" noIndex />
      <div className="container-page">
        <header className="flex flex-wrap items-end justify-between gap-4 pb-8 pt-10 md:pb-12 md:pt-16">
          <div>
            <p className="eyebrow mb-3">Your selection</p>
            <h1 className="text-[2.5rem] leading-[1.05] md:text-6xl">
              Your cart <span className="font-display text-2xl text-stone md:text-3xl">({count})</span>
            </h1>
          </div>
          <Link to="/shop" className="group inline-flex items-center gap-2 pb-1 text-sm text-charcoal-soft hover:text-charcoal">
            <ArrowLeft className="size-4 transition-transform duration-300 group-hover:-translate-x-0.5" aria-hidden="true" />
            Continue shopping
          </Link>
        </header>

        <div className="grid gap-10 lg:grid-cols-[1fr_24rem] lg:gap-16">
          <section aria-label="Items in your cart">
            <ul className="divide-y divide-sand border-y border-sand">
              {lines.map((line) => (
                <CartLine
                  key={line.item.key}
                  item={line.item}
                  size="lg"
                  maxQuantity={line.maxQuantity}
                  notice={line.notice}
                  blocked={line.blocked}
                />
              ))}
            </ul>
          </section>

          <OrderSummary subtotalNgwee={subtotalNgwee} checking={checking} blocked={blocked} />
        </div>
      </div>

      <Suggestions excludeIds={lines.map((l) => l.item.productId)} title="Pairs well with" />
    </>
  )
}

function OrderSummary({ subtotalNgwee, checking, blocked }: { subtotalNgwee: number; checking: boolean; blocked: boolean }) {
  const zones = useDeliveryZones()
  const cheapest = zones.data?.length ? Math.min(...zones.data.map((z) => z.feeNgwee)) : null

  return (
    <aside aria-labelledby="summary" className="h-fit rounded-md border border-sand bg-cream p-6 md:p-8 lg:sticky lg:top-28">
      <h2 id="summary" className="text-2xl">
        Order summary
      </h2>
      <dl className="mt-6 flex flex-col gap-4 text-[0.9375rem]">
        <div className="flex items-baseline justify-between gap-4">
          <dt>Subtotal</dt>
          <dd className="font-display text-xl tabular-nums" aria-live="polite">
            {formatKwacha(subtotalNgwee)}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-4 text-stone">
          <dt>Delivery</dt>
          <dd className="text-right">Calculated at checkout</dd>
        </div>
      </dl>
      <p className="mt-4 border-t border-sand pt-4 text-sm leading-relaxed text-stone">
        Delivery is calculated at checkout based on your area
        {cheapest !== null && <>, from {formatKwacha(cheapest)} in Lusaka</>}.
      </p>

      {checking && (
        <p className="mt-5 flex items-center gap-2 text-sm text-stone" aria-live="polite">
          <Spinner size="sm" label={null} /> Checking prices and stock…
        </p>
      )}
      {blocked && (
        <p className="mt-5 text-sm text-danger" role="alert">
          Remove unavailable items to continue to checkout.
        </p>
      )}

      {blocked ? (
        <span
          role="link"
          aria-disabled="true"
          className="mt-6 flex h-13 w-full cursor-not-allowed items-center justify-center gap-2 rounded-md bg-terracotta font-medium text-white opacity-50"
        >
          Checkout
        </span>
      ) : (
        <ButtonLink
          to="/checkout"
          size="lg"
          fullWidth
          className="mt-6"
          leftIcon={<Lock className="size-4" strokeWidth={1.75} aria-hidden="true" />}
        >
          Checkout
        </ButtonLink>
      )}

      <div className="mt-6 flex flex-col items-center gap-3">
        <p className="text-xs text-stone">Guest checkout. No account needed.</p>
        <PaymentBadges className="justify-center" />
      </div>
    </aside>
  )
}

function Suggestions({ excludeIds, title }: { excludeIds: string[]; title: string }) {
  const featured = useFeaturedProducts()
  const items = featured.data?.filter((p) => !excludeIds.includes(p.id)).slice(0, 4)

  if (featured.isError || (items && items.length === 0)) return null
  return (
    <section aria-labelledby="suggestions" className="container-page pt-20 md:pt-28">
      <h2 id="suggestions" className="mb-8 text-[2rem] leading-tight md:mb-10 md:text-4xl">
        {title}
      </h2>
      <ProductRow products={items} loading={featured.isPending} label={title} />
    </section>
  )
}
