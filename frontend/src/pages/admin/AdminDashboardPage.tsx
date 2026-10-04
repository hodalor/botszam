import { AlertTriangle, Clock, TrendingUp, Wallet } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAdminOrders, useAdminStats } from '@/api/admin'
import type { OrderStatus } from '@/api/types'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { Card, ErrorState, Skeleton } from '@/components/ui'
import { formatDateTime } from '@/lib/dates'
import { formatKwacha } from '@/lib/money'
import { ORDER_STATUS_META } from '@/lib/orderStatus'
import { formatPhoneLocal } from '@/lib/phone'
import { PageMeta } from '@/components/seo/PageMeta'
import { cn } from '@/lib/cn'

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  to,
  highlight,
}: {
  icon: LucideIcon
  label: string
  value?: string
  hint?: string
  to?: string
  highlight?: boolean
}) {
  const body = (
    <Card interactive={Boolean(to)} className={cn('h-full', highlight && 'border-terracotta/40 bg-terracotta-soft/30')}>
      <div className="flex items-center justify-between">
        <p className="text-sm text-stone">{label}</p>
        <Icon className={cn('size-4', highlight ? 'text-terracotta-ink' : 'text-stone')} strokeWidth={1.5} aria-hidden="true" />
      </div>
      {value === undefined ? (
        <Skeleton className="mt-3 h-8 w-2/3" />
      ) : (
        <p className="mt-2 font-display text-3xl tabular-nums">{value}</p>
      )}
      {hint && <p className="mt-1 text-xs text-stone">{hint}</p>}
    </Card>
  )
  return to ? (
    <Link to={to} className="block rounded-md">
      {body}
    </Link>
  ) : (
    body
  )
}

const STATUS_ORDER: OrderStatus[] = [
  'payment_submitted',
  'awaiting_payment',
  'pending_confirmation',
  'paid',
  'confirmed',
  'processing',
  'out_for_delivery',
  'delivered',
  'payment_rejected',
  'cancelled',
]

export function AdminDashboardPage() {
  const { data: stats, isError: statsError, isPending: statsPending } = useAdminStats()
  const { data: recent, isError: recentError, isPending: recentPending } = useAdminOrders({ limit: 8, page: 1 })

  return (
    <>
      <PageMeta title="Admin" path="/admin" noIndex />
      <AdminPageHeader
        title="Dashboard"
        description="Revenue counts paid mobile money orders and delivered pay-on-delivery orders."
      />

      <div className="grid gap-3 px-4 sm:grid-cols-2 sm:px-6 md:px-10 xl:grid-cols-4">
        <StatCard
          icon={Wallet}
          label="Revenue today"
          value={stats && formatKwacha(stats.revenue.today.totalNgwee)}
          hint={stats && `${stats.revenue.today.orders} orders`}
        />
        <StatCard
          icon={TrendingUp}
          label="Revenue this month"
          value={stats && formatKwacha(stats.revenue.month.totalNgwee)}
          hint={stats && `${stats.revenue.month.orders} orders`}
        />
        <StatCard
          icon={Clock}
          label="Payments to verify"
          value={stats && String(stats.pendingPaymentVerifications)}
          to="/admin/orders?status=payment_submitted"
          highlight={Boolean(stats && stats.pendingPaymentVerifications > 0)}
        />
        <StatCard
          icon={AlertTriangle}
          label="Low-stock variants"
          value={stats && String(stats.lowStockVariants)}
          to="/admin/inventory"
          highlight={Boolean(stats && stats.lowStockVariants > 0)}
        />
      </div>

      {statsError && (
        <div className="px-4 pt-4 sm:px-6 md:px-10">
          <ErrorState title="Couldn’t load stats" />
        </div>
      )}

      <section className="px-4 pt-8 sm:px-6 md:px-10" aria-labelledby="orders-by-status">
        <h2 id="orders-by-status" className="text-lg">
          Orders by status
        </h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {statsPending &&
            Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-9 w-28 rounded-full" />)}
          {stats &&
            STATUS_ORDER.map((status) => {
              const count = stats.ordersByStatus[status] ?? 0
              if (count === 0 && status !== 'payment_submitted') return null
              return (
                <Link
                  key={status}
                  to={`/admin/orders?status=${status}`}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-full border border-sand bg-cream px-3 py-1.5 text-xs transition-colors hover:border-sand-deep',
                    status === 'payment_submitted' && count > 0 && 'border-terracotta/40 bg-terracotta-soft/40',
                  )}
                >
                  <span className="font-medium">{ORDER_STATUS_META[status].label}</span>
                  <span className="tabular-nums text-stone">{count}</span>
                </Link>
              )
            })}
        </div>
      </section>

      <section className="px-4 py-8 sm:px-6 md:px-10" aria-labelledby="recent-orders">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 id="recent-orders" className="text-lg">
            Recent orders
          </h2>
          <Link to="/admin/orders" className="text-sm text-stone underline-offset-4 hover:text-charcoal hover:underline">
            View all
          </Link>
        </div>

        {recentError && <ErrorState title="Couldn’t load orders" />}
        {recentPending && (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-md" />
            ))}
          </div>
        )}

        {recent && recent.items.length === 0 && (
          <p className="rounded-md border border-dashed border-sand bg-cream/50 px-4 py-8 text-center text-sm text-stone">
            No orders yet.
          </p>
        )}

        {recent && recent.items.length > 0 && (
          <>
            <ul className="space-y-2 md:hidden">
              {recent.items.map((order) => (
                <li key={order._id}>
                  <Link
                    to={`/admin/orders/${order.orderNumber}`}
                    className={cn(
                      'block rounded-md border border-sand bg-cream p-4 transition-colors hover:border-sand-deep',
                      order.status === 'payment_submitted' && 'border-terracotta/35 bg-terracotta-soft/20',
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium tabular-nums">{order.orderNumber}</p>
                        <p className="mt-0.5 text-sm text-stone">{order.customer.name}</p>
                      </div>
                      <StatusBadge status={order.status} size="sm" />
                    </div>
                    <div className="mt-3 flex items-center justify-between text-sm">
                      <span className="tabular-nums">{formatKwacha(order.totalNgwee)}</span>
                      <span className="text-xs text-stone">{formatDateTime(order.createdAt)}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>

            <div className="hidden overflow-x-auto rounded-md border border-sand bg-cream md:block">
              <table className="w-full min-w-[40rem] text-left text-sm">
                <thead className="border-b border-sand text-xs uppercase tracking-wide text-stone">
                  <tr>
                    <th className="px-4 py-3 font-medium">Order</th>
                    <th className="px-4 py-3 font-medium">Customer</th>
                    <th className="px-4 py-3 font-medium">Total</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Placed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sand">
                  {recent.items.map((order) => (
                    <tr key={order._id} className={cn(order.status === 'payment_submitted' && 'bg-terracotta-soft/20')}>
                      <td className="px-4 py-3">
                        <Link to={`/admin/orders/${order.orderNumber}`} className="font-medium tabular-nums hover:underline">
                          {order.orderNumber}
                        </Link>
                        <p className="text-xs text-stone">
                          {order.paymentMethod === 'mobile_money' ? 'Mobile money' : 'Pay on delivery'}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p>{order.customer.name}</p>
                        <p className="text-xs text-stone">{formatPhoneLocal(order.customer.phone)}</p>
                      </td>
                      <td className="px-4 py-3 tabular-nums">{formatKwacha(order.totalNgwee)}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={order.status} size="sm" />
                      </td>
                      <td className="px-4 py-3 text-stone">{formatDateTime(order.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </>
  )
}
