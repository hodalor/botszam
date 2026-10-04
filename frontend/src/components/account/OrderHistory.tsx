import { ChevronRight, Package } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMyOrders } from '@/api/orders'
import { Badge, Button, ButtonLink, EmptyState, ErrorState, ProductImage, Skeleton } from '@/components/ui'
import { formatDate } from '@/lib/dates'
import { formatKwacha } from '@/lib/money'
import { rememberOrderPhone } from '@/lib/orderAccess'
import { ORDER_STATUS_META } from '@/lib/orderStatus'

export function OrderHistory() {
  const [page, setPage] = useState(1)
  const query = useMyOrders(page)

  if (query.isPending) {
    return (
      <div className="flex flex-col gap-3" aria-busy="true" aria-label="Loading your orders">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    )
  }
  if (query.isError) {
    return <ErrorState title="We couldn’t load your orders" error={query.error} onRetry={() => query.refetch()} retrying={query.isFetching} />
  }

  const { items, pagination } = query.data
  if (items.length === 0 && page === 1) {
    return (
      <EmptyState
        icon={Package}
        title="No orders yet"
        description="When you place an order while signed in, it will appear here."
        action={<ButtonLink to="/shop">Shop towels</ButtonLink>}
      />
    )
  }

  return (
    <div>
      <ul className="flex flex-col gap-3">
        {items.map((order) => {
          const meta = ORDER_STATUS_META[order.status]
          const count = order.items.reduce((n, i) => n + i.quantity, 0)
          return (
            <li key={order.orderNumber}>
              <Link
                to={`/order/${order.orderNumber}`}
                onClick={() => rememberOrderPhone(order.orderNumber, order.customer.phone)}
                className="group flex items-center gap-4 rounded-md border border-sand bg-cream p-4 transition-[border-color,box-shadow] duration-300 hover:border-sand-deep hover:shadow-soft md:p-5"
              >
                <div className="flex -space-x-3" aria-hidden="true">
                  {order.items.slice(0, 3).map((item) => (
                    <span key={item.variantSku} className="aspect-[4/5] w-11 overflow-hidden rounded-md bg-sand ring-2 ring-cream">
                      <ProductImage
                        src={item.image}
                        alt=""
                        width={44}
                        height={55}
                        className="size-full object-cover"
                        fallbackClassName="size-full"
                      />
                    </span>
                  ))}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="font-mono text-sm font-medium tracking-wide">{order.orderNumber}</span>
                    <Badge tone={meta.tone} size="sm">
                      {meta.label}
                    </Badge>
                  </div>
                  <p className="mt-1 truncate text-sm text-stone">
                    {formatDate(order.createdAt)} · {count} {count === 1 ? 'item' : 'items'} ·{' '}
                    {order.items.map((i) => i.name).join(', ')}
                  </p>
                </div>
                <span className="hidden font-display text-lg tabular-nums sm:block">{formatKwacha(order.totalNgwee)}</span>
                <ChevronRight className="size-4 shrink-0 text-stone transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </Link>
            </li>
          )
        })}
      </ul>
      {pagination.totalPages > 1 && (
        <nav className="mt-6 flex items-center justify-between gap-4" aria-label="Order history pages">
          <Button variant="secondary" size="sm" disabled={page <= 1 || query.isFetching} onClick={() => setPage((p) => p - 1)}>
            Newer
          </Button>
          <p className="text-sm text-stone tabular-nums">
            Page {pagination.page} of {pagination.totalPages}
          </p>
          <Button
            variant="secondary"
            size="sm"
            disabled={page >= pagination.totalPages || query.isFetching}
            onClick={() => setPage((p) => p + 1)}
          >
            Older
          </Button>
        </nav>
      )}
    </div>
  )
}
