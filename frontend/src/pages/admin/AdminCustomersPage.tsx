import { MessageCircle, Phone } from 'lucide-react'
import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAdminCustomers } from '@/api/admin'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { Pagination } from '@/components/admin/Pagination'
import { EmptyState, ErrorState, Input, Skeleton } from '@/components/ui'
import { formatDate, formatDateTime } from '@/lib/dates'
import { formatPhoneLocal, toWhatsAppNumber } from '@/lib/phone'
import { PageMeta } from '@/components/seo/PageMeta'

export function AdminCustomersPage() {
  const [params, setParams] = useSearchParams()
  const filters = useMemo(
    () => ({
      search: params.get('search') ?? undefined,
      page: Number(params.get('page') || '1') || 1,
      limit: 20,
    }),
    [params],
  )
  const { data, isPending, isError, isFetching } = useAdminCustomers(filters)

  return (
    <>
      <PageMeta title={'Customers · Admin'} noIndex />
      <AdminPageHeader
        title="Customers"
        description="Registered accounts. Guest checkouts are not listed here."
      />

      <div className="px-4 sm:px-6 md:px-10">
        <Input
          label="Search"
          placeholder="Name, phone or email"
          className="max-w-md"
          value={filters.search ?? ''}
          onChange={(e) => {
            const next = new URLSearchParams(params)
            if (e.target.value) next.set('search', e.target.value)
            else next.delete('search')
            next.delete('page')
            setParams(next, { replace: true })
          }}
        />
      </div>

      <div className={`px-4 py-6 sm:px-6 md:px-10 ${isFetching && !isPending ? 'opacity-70' : ''}`}>
        {isError && <ErrorState title="Couldn’t load customers" />}
        {isPending && (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-md" />
            ))}
          </div>
        )}
        {data && data.items.length === 0 && (
          <EmptyState title="No registered customers" description="Accounts created at checkout or register will show up here." />
        )}

        {data && data.items.length > 0 && (
          <>
            <ul className="space-y-2 md:hidden">
              {data.items.map((customer) => {
                const wa = toWhatsAppNumber(customer.phone)
                return (
                  <li key={customer._id} className="rounded-md border border-sand bg-cream p-4">
                    <p className="font-medium">{customer.name}</p>
                    <p className="text-sm tabular-nums text-stone">{formatPhoneLocal(customer.phone)}</p>
                    {customer.email && <p className="text-sm text-stone">{customer.email}</p>}
                    <p className="mt-2 text-xs text-stone">
                      {customer.orderCount} orders · {customer.addressCount} addresses · joined{' '}
                      {formatDate(customer.createdAt)}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <a
                        href={`tel:${customer.phone}`}
                        className="inline-flex h-10 items-center gap-1.5 rounded-md border border-sand px-3 text-sm"
                      >
                        <Phone className="size-3.5" /> Call
                      </a>
                      {wa && (
                        <a
                          href={`https://wa.me/${wa}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex h-10 items-center gap-1.5 rounded-md border border-sand px-3 text-sm"
                        >
                          <MessageCircle className="size-3.5" /> WhatsApp
                        </a>
                      )}
                      {customer.orderCount > 0 && (
                        <Link
                          to={`/admin/orders?search=${encodeURIComponent(customer.phone)}`}
                          className="inline-flex h-10 items-center rounded-md bg-sand/70 px-3 text-sm"
                        >
                          View orders
                        </Link>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>

            <div className="hidden overflow-x-auto rounded-md border border-sand bg-cream md:block">
              <table className="w-full min-w-[48rem] text-left text-sm">
                <thead className="border-b border-sand text-xs uppercase tracking-wide text-stone">
                  <tr>
                    <th className="px-4 py-3 font-medium">Customer</th>
                    <th className="px-4 py-3 font-medium">Contact</th>
                    <th className="px-4 py-3 font-medium">Orders</th>
                    <th className="px-4 py-3 font-medium">Addresses</th>
                    <th className="px-4 py-3 font-medium">Joined</th>
                    <th className="px-4 py-3 font-medium">Last order</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sand">
                  {data.items.map((customer) => (
                    <tr key={customer._id}>
                      <td className="px-4 py-3 font-medium">{customer.name}</td>
                      <td className="px-4 py-3">
                        <p className="tabular-nums">{formatPhoneLocal(customer.phone)}</p>
                        {customer.email && <p className="text-xs text-stone">{customer.email}</p>}
                      </td>
                      <td className="px-4 py-3">
                        {customer.orderCount > 0 ? (
                          <Link
                            to={`/admin/orders?search=${encodeURIComponent(customer.phone)}`}
                            className="tabular-nums underline-offset-4 hover:underline"
                          >
                            {customer.orderCount}
                          </Link>
                        ) : (
                          <span className="tabular-nums text-stone">0</span>
                        )}
                      </td>
                      <td className="px-4 py-3 tabular-nums">{customer.addressCount}</td>
                      <td className="px-4 py-3 text-stone">{formatDate(customer.createdAt)}</td>
                      <td className="px-4 py-3 text-stone">
                        {customer.lastOrderAt ? formatDateTime(customer.lastOrderAt) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              page={data.pagination.page}
              totalPages={data.pagination.totalPages}
              total={data.pagination.total}
              onChange={(page) => {
                const next = new URLSearchParams(params)
                if (page > 1) next.set('page', String(page))
                else next.delete('page')
                setParams(next, { replace: true })
              }}
            />
          </>
        )}
      </div>
    </>
  )
}
