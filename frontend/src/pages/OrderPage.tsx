import { MessageCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMe } from '@/api/auth'
import { isApiError } from '@/api/client'
import { useMyOrders, useTrackOrder } from '@/api/orders'
import { CancelOrderButton } from '@/components/order/CancelOrderButton'
import { OrderDetails } from '@/components/order/OrderDetails'
import { OrderTimeline } from '@/components/order/OrderTimeline'
import { PaymentPanel } from '@/components/order/PaymentPanel'
import { VerifyPhoneForm } from '@/components/order/VerifyPhoneForm'
import { Badge, buttonClasses, ErrorState, Skeleton, SkeletonText } from '@/components/ui'
import { formatDate } from '@/lib/dates'
import { forgetOrderPhone, getOrderPhone, normaliseOrderNumber, rememberOrderPhone } from '@/lib/orderAccess'
import { canCustomerCancel, ORDER_STATUS_META } from '@/lib/orderStatus'
import { PageMeta } from '@/components/seo/PageMeta'
import { useWhatsAppLink } from '@/lib/useWhatsAppLink'

export function OrderPage() {
  const { orderNumber: rawOrderNumber = '' } = useParams()
  const orderNumber = normaliseOrderNumber(rawOrderNumber)

  // Phone from checkout/track (sessionStorage), or entered on this page.
  const [phone, setPhone] = useState<string | null>(() => getOrderPhone(orderNumber))
  const [prevOrderNumber, setPrevOrderNumber] = useState(orderNumber)
  if (prevOrderNumber !== orderNumber) {
    setPrevOrderNumber(orderNumber)
    setPhone(getOrderPhone(orderNumber))
  }

  // Signed-in owners can open their recent orders without re-entering the phone.
  const { data: user, isPending: userPending } = useMe()
  const myOrders = useMyOrders(1, Boolean(user) && !phone)
  const ownerPhone = myOrders.data?.items.find((o) => o.orderNumber === orderNumber)?.customer.phone ?? null
  const accessPhone = phone ?? ownerPhone

  const query = useTrackOrder(orderNumber, accessPhone ?? undefined)
  const notFound = isApiError(query.error) && query.error.status === 404

  useEffect(() => {
    if (query.data && accessPhone) rememberOrderPhone(orderNumber, accessPhone)
  }, [query.data, accessPhone, orderNumber])
  useEffect(() => {
    if (notFound) forgetOrderPhone(orderNumber)
  }, [notFound, orderNumber])

  const resolvingOwner = !phone && (userPending || (Boolean(user) && myOrders.isPending))

  if (!accessPhone || notFound) {
    if (resolvingOwner) return <OrderSkeleton />
    return (
      <div className="container-page py-12 md:py-20">
        <VerifyPhoneForm
          orderNumber={orderNumber}
          verifying={query.isFetching}
          error={
            notFound
              ? 'We couldn’t find an order with that number and phone. Check both and try again.'
              : isApiError(query.error) && query.error.status === 429
                ? 'Too many attempts. Please wait a minute and try again.'
                : null
          }
          onVerify={setPhone}
        />
        <p className="mt-6 text-center text-sm text-stone">
          Wrong order number?{' '}
          <Link to="/track" className="font-medium text-charcoal underline underline-offset-4">
            Track a different order
          </Link>
        </p>
      </div>
    )
  }

  if (query.isPending) return <OrderSkeleton />
  if (query.isError) {
    return (
      <div className="container-page py-16">
        <ErrorState title="We couldn’t load your order" error={query.error} onRetry={() => query.refetch()} retrying={query.isFetching} />
      </div>
    )
  }

  const { order, paymentInstructions } = query.data
  const meta = ORDER_STATUS_META[order.status]
  const itemCount = order.items.reduce((n, i) => n + i.quantity, 0)
  const refresh = () => query.refetch()

  return (
    <>
      <PageMeta title={`Order ${orderNumber}`} />
    <div className="container-page">
      <header className="pb-8 pt-10 md:pb-12 md:pt-16">
        <p className="eyebrow mb-3">Order</p>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <h1 className="font-display text-[2.25rem] leading-[1.05] tracking-tight md:text-6xl">{order.orderNumber}</h1>
          <Badge tone={meta.tone} dot>
            {meta.label}
          </Badge>
        </div>
        <p className="mt-3 text-sm text-stone">
          Placed {formatDate(order.createdAt)} · {itemCount} {itemCount === 1 ? 'item' : 'items'}
        </p>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-charcoal-soft md:text-lg">{meta.description}</p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:grid-rows-[auto_1fr] lg:gap-x-14">
        <div className="lg:col-start-1 empty:hidden">
          <PaymentPanel order={order} instructions={paymentInstructions} accessPhone={accessPhone} onStale={refresh} />
        </div>

        <aside className="flex flex-col gap-6 lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <section aria-labelledby="progress" className="rounded-md border border-sand bg-cream p-5 md:p-6">
            <h2 id="progress" className="mb-5 text-xl">
              Progress
            </h2>
            <OrderTimeline order={order} />
          </section>
          <HelpCard orderNumber={order.orderNumber} />
          {canCustomerCancel(order.status) && <CancelOrderButton orderNumber={order.orderNumber} phone={accessPhone} onStale={refresh} />}
        </aside>

        <div className="lg:col-start-1">
          <OrderDetails order={order} />
        </div>
      </div>
    </div>
    </>
  )
}

function HelpCard({ orderNumber }: { orderNumber: string }) {
  const whatsapp = useWhatsAppLink(`Hi botszam, I have a question about my order ${orderNumber}.`)
  return (
    <section aria-labelledby="help" className="rounded-md border border-sand bg-cream p-5 md:p-6">
      <h2 id="help" className="text-xl">
        Questions?
      </h2>
      <p className="mt-1 text-sm leading-relaxed text-stone">We usually reply within minutes during business hours.</p>
      {whatsapp && (
        <a
          href={whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClasses({ variant: 'secondary', fullWidth: true, className: 'mt-4' })}
        >
          <MessageCircle className="size-4" strokeWidth={1.75} aria-hidden="true" />
          Chat with us on WhatsApp
        </a>
      )}
    </section>
  )
}

function OrderSkeleton() {
  return (
    <div className="container-page pb-16 pt-10 md:pt-16" aria-busy="true" aria-label="Loading order">
      <Skeleton className="h-4 w-16" />
      <Skeleton className="mt-4 h-12 w-72 max-w-full" />
      <SkeletonText className="mt-6 max-w-xl" lines={2} />
      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_22rem]">
        <Skeleton className="h-96" />
        <Skeleton className="h-72" />
      </div>
    </div>
  )
}
