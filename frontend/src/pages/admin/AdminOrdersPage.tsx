import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAdminOrders } from '@/api/admin'
import type { OrderStatus, PaymentMethod } from '@/api/types'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { Pagination } from '@/components/admin/Pagination'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { EmptyState, ErrorState, Input, Select, Skeleton } from '@/components/ui'
import { cn } from '@/lib/cn'
import { formatDateTime } from '@/lib/dates'
import { formatKwacha } from '@/lib/money'
import { ORDER_STATUS_META } from '@/lib/orderStatus'
import { formatPhoneLocal } from '@/lib/phone'
import { PageMeta } from '@/components/seo/PageMeta'

const STATUS_OPTIONS = (Object.keys(ORDER_STATUS_META) as OrderStatus[]).map((value) => ({
  value,
  label: ORDER_STATUS_META[value].label,
}))

function useOrderFilters() {
  const [params, setParams] = useSearchParams()
  const filters = useMemo(
    () => ({
      status: (params.get('status') as OrderStatus | null) ?? undefined,
      paymentMethod: (params.get('paymentMethod') as PaymentMethod | null) ?? undefined,
      from: params.get('from') ?? undefined,
      to: params.get('to') ?? undefined,
      search: params.get('search') ?? undefined,
      page: Number(params.get('page') || '1') || 1,
      limit: 20,
    }),
    [params],
  )

  const setFilter = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    if (key !== 'page') next.delete('page')
    setParams(next, { replace: true })
  }

  return { filters, setFilter, setPage: (page: number) => setFilter('page', page > 1 ? String(page) : '') }
}

export function AdminOrdersPage() {
  const { filters, setFilter, setPage } = useOrderFilters()
  const { data, isPending, isError, isFetching } = useAdminOrders(filters)

  return (
    <>
      <PageMeta title={'Orders · Admin'} noIndex />
      <AdminPageHeader title="Orders" description="Filter, verify payments and update fulfilment from your phone." />

      <div className="grid gap-3 px-4 sm:grid-cols-2 lg:grid-cols-5 sm:px-6 md:px-10">
        <Input
          label="Search"
          placeholder="Order #, name or phone"
          value={filters.search ?? ''}
          onChange={(e) => setFilter('search', e.target.value)}
        />
        <Select
          label="Status"
          placeholder="All statuses"
          value={filters.status ?? ''}
          onChange={(e) => setFilter('status', e.target.value)}
          options={STATUS_OPTIONS}
        />
        <Select
          label="Payment"
          placeholder="All methods"
          value={filters.paymentMethod ?? ''}
          onChange={(e) => setFilter('paymentMethod', e.target.value)}
          options={[
            { value: 'mobile_money', label: 'Mobile money' },
            { value: 'pay_on_delivery', label: 'Pay on delivery' },
          ]}
        />
        <Input
          label="From"
          type="date"
          value={filters.from ?? ''}
          onChange={(e) => setFilter('from', e.target.value)}
        />
        <Input label="To" type="date" value={filters.to ?? ''} onChange={(e) => setFilter('to', e.target.value)} />
      </div>

      <div className={cn('px-4 py-6 sm:px-6 md:px-10', isFetching && !isPending && 'opacity-70')}>
        {isError && <ErrorState title="Couldn’t load orders" />}
        {isPending && (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-md" />
            ))}
          </div>
        )}
        {data && data.items.length === 0 && (
          <EmptyState title="No orders match" description="Widen your filters or clear the search." />
        )}

        {data && data.items.length > 0 && (
          <>
            <ul className="space-y-2 lg:hidden">
              {data.items.map((order) => (
                <li key={order._id}>
                  <Link
                    to={`/admin/orders/${order.orderNumber}`}
                    className={cn(
                      'block rounded-md border border-sand bg-cream p-4 active:bg-linen',
                      order.status === 'payment_submitted' && 'border-terracotta/40 bg-terracotta-soft/25',
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium tabular-nums">{order.orderNumber}</p>
                        <p className="mt-1 truncate text-sm">{order.customer.name}</p>
                        <p className="text-xs text-stone">{formatPhoneLocal(order.customer.phone)}</p>
                      </div>
                      <StatusBadge status={order.status} size="sm" />
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-2 text-sm">
                      <span className="tabular-nums font-medium">{formatKwacha(order.totalNgwee)}</span>
                      <span className="text-xs text-stone">
                        {order.paymentMethod === 'mobile_money' ? 'MoMo' : 'COD'} · {formatDateTime(order.createdAt)}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>

            <div className="hidden overflow-x-auto rounded-md border border-sand bg-cream lg:block">
              <table className="w-full min-w-[48rem] text-left text-sm">
                <thead className="border-b border-sand text-xs uppercase tracking-wide text-stone">
                  <tr>
                    <th className="px-4 py-3 font-medium">Order</th>
                    <th className="px-4 py-3 font-medium">Customer</th>
                    <th className="px-4 py-3 font-medium">Payment</th>
                    <th className="px-4 py-3 font-medium">Total</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Placed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sand">
                  {data.items.map((order) => (
                    <tr key={order._id} className={cn(order.status === 'payment_submitted' && 'bg-terracotta-soft/20')}>
                      <td className="px-4 py-3">
                        <Link to={`/admin/orders/${order.orderNumber}`} className="font-medium tabular-nums hover:underline">
                          {order.orderNumber}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <p>{order.customer.name}</p>
                        <p className="text-xs text-stone">{formatPhoneLocal(order.customer.phone)}</p>
                      </td>
                      <td className="px-4 py-3 text-stone">
                        {order.paymentMethod === 'mobile_money' ? 'Mobile money' : 'Pay on delivery'}
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

            <Pagination
              page={data.pagination.page}
              totalPages={data.pagination.totalPages}
              total={data.pagination.total}
              onChange={setPage}
            />
          </>
        )}
      </div>
    </>
  )
}
