import { useEffect } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useAdminOrder, useAdminSettings } from '@/api/admin'
import { Button, ButtonLink, EmptyState, Skeleton } from '@/components/ui'
import { formatDate } from '@/lib/dates'
import { formatKwacha } from '@/lib/money'
import { formatPhoneLocal } from '@/lib/phone'
import { PageMeta } from '@/components/seo/PageMeta'

export function AdminPackingSlipPage() {
  const { orderNumber = '' } = useParams()
  const [params] = useSearchParams()
  const { data: order, isPending, isError } = useAdminOrder(orderNumber)
  const { data: settings } = useAdminSettings()

  useEffect(() => {
    if (order && params.get('autoprint') === '1') {
      const t = window.setTimeout(() => window.print(), 300)
      return () => window.clearTimeout(t)
    }
  }, [order, params])

  if (isPending) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (isError || !order) {
    return (
      <div className="p-6">
        <EmptyState
          title="Order not found"
          action={
            <ButtonLink to="/admin/orders" variant="secondary">
              Back to orders
            </ButtonLink>
          }
        />
      </div>
    )
  }

  const storeName = settings?.storeName || 'botszam'

  return (
    <>
      <PageMeta title={orderNumber ? `Packing slip ${orderNumber}` : 'Packing slip'} noIndex />
    <div className="min-h-dvh bg-white text-charcoal">
      <div className="print:hidden mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-4">
        <Link to={`/admin/orders/${order.orderNumber}`} className="text-sm text-stone hover:text-charcoal">
          ← Back to order
        </Link>
        <Button type="button" size="sm" onClick={() => window.print()}>
          Print
        </Button>
      </div>

      <article className="mx-auto max-w-2xl px-6 py-4 print:max-w-none print:px-0 print:py-0">
        <header className="border-b border-charcoal/20 pb-4">
          <p className="font-display text-2xl">{storeName}</p>
          <h1 className="mt-2 text-xl font-medium">Packing slip</h1>
          <p className="mt-1 tabular-nums text-sm">
            {order.orderNumber} · {formatDate(order.createdAt)}
          </p>
        </header>

        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <div>
            <h2 className="text-xs font-medium uppercase tracking-wide text-stone">Ship to</h2>
            <p className="mt-1 font-medium">{order.customer.name}</p>
            <p className="text-sm">{formatPhoneLocal(order.customer.phone)}</p>
            <p className="mt-2 text-sm leading-relaxed">
              {order.deliveryAddress.street}
              <br />
              {order.deliveryAddress.area}
              {order.deliveryAddress.landmark ? (
                <>
                  <br />
                  Near: {order.deliveryAddress.landmark}
                </>
              ) : null}
              <br />
              {order.deliveryAddress.zoneName}
            </p>
            {order.deliveryAddress.notes && (
              <p className="mt-2 text-sm">
                <span className="font-medium">Notes:</span> {order.deliveryAddress.notes}
              </p>
            )}
          </div>
          <div>
            <h2 className="text-xs font-medium uppercase tracking-wide text-stone">Payment</h2>
            <p className="mt-1 text-sm">
              {order.paymentMethod === 'mobile_money' ? 'Mobile money' : 'Pay on delivery'}
            </p>
            <p className="mt-2 text-sm tabular-nums">Total: {formatKwacha(order.totalNgwee)}</p>
          </div>
        </div>

        <table className="mt-8 w-full text-left text-sm">
          <thead>
            <tr className="border-b border-charcoal/20 text-xs uppercase tracking-wide text-stone">
              <th className="py-2 pr-2 font-medium">Qty</th>
              <th className="py-2 pr-2 font-medium">Item</th>
              <th className="py-2 font-medium">SKU</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={`${item.variantSku}-${item.product}`} className="border-b border-charcoal/10 align-top">
                <td className="py-3 pr-2 tabular-nums font-medium">{item.quantity}</td>
                <td className="py-3 pr-2">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-stone">
                    {item.size} · {item.colour}
                  </p>
                </td>
                <td className="py-3 tabular-nums text-stone">{item.variantSku}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <p className="mt-10 text-center text-xs text-stone print:mt-16">
          Packed with care · {storeName}
        </p>
      </article>
    </div>
    </>
  )
}
