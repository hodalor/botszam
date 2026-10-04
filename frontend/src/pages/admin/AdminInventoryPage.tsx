import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { useAdjustInventory, useInventoryLogs, useLowStock } from '@/api/admin'
import type { InventoryReason, LowStockItem } from '@/api/types'
import { errorMessage } from '@/api/client'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { Pagination } from '@/components/admin/Pagination'
import { Alert, Button, EmptyState, ErrorState, Input, Modal, Select, Skeleton, Textarea } from '@/components/ui'
import { formatDateTime } from '@/lib/dates'
import { PageMeta } from '@/components/seo/PageMeta'

const REASON_LABELS: Record<InventoryReason, string> = {
  order: 'Order',
  cancel: 'Cancel',
  restock: 'Restock',
  adjustment: 'Adjustment',
  payment_rejected: 'Payment rejected',
}

function StockAdjustModal({
  item,
  open,
  onClose,
}: {
  item: LowStockItem | null
  open: boolean
  onClose: () => void
}) {
  const adjust = useAdjustInventory()
  const [mode, setMode] = useState<'restock' | 'adjustment'>('restock')
  const [amount, setAmount] = useState('10')
  const [note, setNote] = useState('')

  if (!item) return null

  const submit = async () => {
    const n = Number(amount)
    if (!Number.isInteger(n) || n === 0) {
      toast.error('Enter a non-zero whole number')
      return
    }
    const change = mode === 'restock' ? Math.abs(n) : n
    try {
      await adjust.mutateAsync({
        productId: item.productId,
        variantSku: item.sku,
        change,
        reason: mode,
        note: note.trim() || undefined,
      })
      toast.success(`Stock updated for ${item.sku}`)
      onClose()
      setNote('')
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Adjust stock"
      description={`${item.productName} · ${item.size} · ${item.colour} (${item.sku}) — currently ${item.stock}`}
      footer={
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={adjust.isPending}>
            Cancel
          </Button>
          <Button type="button" loading={adjust.isPending} onClick={() => void submit()}>
            Save adjustment
          </Button>
        </div>
      }
    >
      <div className="space-y-4 px-5 py-4 md:px-6">
        <Select
          label="Type"
          value={mode}
          onChange={(e) => setMode(e.target.value as 'restock' | 'adjustment')}
          options={[
            { value: 'restock', label: 'Restock (add)' },
            { value: 'adjustment', label: 'Correction (+/−)' },
          ]}
        />
        <Input
          label={mode === 'restock' ? 'Quantity to add' : 'Change (+/−)'}
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          hint={mode === 'adjustment' ? 'Use a negative number to reduce stock.' : undefined}
        />
        <Textarea label="Note" optional rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
      </div>
    </Modal>
  )
}

export function AdminInventoryPage() {
  const lowStock = useLowStock()
  const [params, setParams] = useSearchParams()
  const logFilters = useMemo(
    () => ({
      reason: (params.get('reason') as InventoryReason | null) ?? undefined,
      orderNumber: params.get('orderNumber') ?? undefined,
      from: params.get('from') ?? undefined,
      to: params.get('to') ?? undefined,
      page: Number(params.get('page') || '1') || 1,
      limit: 20,
    }),
    [params],
  )
  const logs = useInventoryLogs(logFilters)
  const [adjustItem, setAdjustItem] = useState<LowStockItem | null>(null)

  const setFilter = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    if (key !== 'page') next.delete('page')
    setParams(next, { replace: true })
  }

  return (
    <>
      <PageMeta title={'Inventory · Admin'} noIndex />
      <AdminPageHeader title="Inventory" description="Low-stock alerts and stock movement history." />

      <section className="px-4 sm:px-6 md:px-10" aria-labelledby="low-stock">
        <h2 id="low-stock" className="text-lg">
          Low stock
        </h2>
        {lowStock.isError && <ErrorState title="Couldn’t load low-stock list" className="mt-3" />}
        {lowStock.isPending && (
          <div className="mt-3 space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-md" />
            ))}
          </div>
        )}
        {lowStock.data && lowStock.data.length === 0 && (
          <Alert tone="success" className="mt-3">
            All active variants are above their low-stock threshold.
          </Alert>
        )}
        {lowStock.data && lowStock.data.length > 0 && (
          <ul className="mt-3 space-y-2">
            {lowStock.data.map((item) => (
              <li
                key={`${item.productId}-${item.sku}`}
                className="flex flex-col gap-3 rounded-md border border-warning/30 bg-warning-soft/30 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium">{item.productName}</p>
                  <p className="text-sm text-stone">
                    {item.size} · {item.colour} · {item.sku}
                  </p>
                  <p className="mt-1 text-sm tabular-nums">
                    Stock <strong>{item.stock}</strong> (threshold {item.lowStockThreshold})
                  </p>
                </div>
                <Button type="button" size="sm" onClick={() => setAdjustItem(item)}>
                  Adjust stock
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="px-4 py-8 sm:px-6 md:px-10" aria-labelledby="inventory-log">
        <h2 id="inventory-log" className="text-lg">
          Inventory log
        </h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Select
            label="Reason"
            placeholder="All"
            value={logFilters.reason ?? ''}
            onChange={(e) => setFilter('reason', e.target.value)}
            options={(Object.keys(REASON_LABELS) as InventoryReason[]).map((value) => ({
              value,
              label: REASON_LABELS[value],
            }))}
          />
          <Input
            label="Order #"
            value={logFilters.orderNumber ?? ''}
            onChange={(e) => setFilter('orderNumber', e.target.value.toUpperCase())}
            placeholder="BTZ-…"
          />
          <Input label="From" type="date" value={logFilters.from ?? ''} onChange={(e) => setFilter('from', e.target.value)} />
          <Input label="To" type="date" value={logFilters.to ?? ''} onChange={(e) => setFilter('to', e.target.value)} />
        </div>

        <div className="mt-4">
          {logs.isError && <ErrorState title="Couldn’t load log" />}
          {logs.isPending && <Skeleton className="h-40 w-full rounded-md" />}
          {logs.data && logs.data.items.length === 0 && (
            <EmptyState title="No log entries" compact description="Adjustments and orders will appear here." />
          )}
          {logs.data && logs.data.items.length > 0 && (
            <>
              <ul className="space-y-2 md:hidden">
                {logs.data.items.map((log) => (
                  <li key={log._id} className="rounded-md border border-sand bg-cream p-3 text-sm">
                    <p className="font-medium">
                      {log.change > 0 ? '+' : ''}
                      {log.change} · {log.variantSku}
                    </p>
                    <p className="text-stone">{log.product?.name ?? 'Product removed'}</p>
                    <p className="mt-1 text-xs text-stone">
                      {REASON_LABELS[log.reason]} · {formatDateTime(log.createdAt)}
                      {log.order ? ` · ${log.order.orderNumber}` : ''}
                    </p>
                    {log.note && <p className="mt-1 text-stone">{log.note}</p>}
                  </li>
                ))}
              </ul>
              <div className="hidden overflow-x-auto rounded-md border border-sand bg-cream md:block">
                <table className="w-full min-w-[40rem] text-left text-sm">
                  <thead className="border-b border-sand text-xs uppercase tracking-wide text-stone">
                    <tr>
                      <th className="px-4 py-3 font-medium">When</th>
                      <th className="px-4 py-3 font-medium">Product</th>
                      <th className="px-4 py-3 font-medium">Change</th>
                      <th className="px-4 py-3 font-medium">Reason</th>
                      <th className="px-4 py-3 font-medium">Note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sand">
                    {logs.data.items.map((log) => (
                      <tr key={log._id}>
                        <td className="px-4 py-3 text-stone">{formatDateTime(log.createdAt)}</td>
                        <td className="px-4 py-3">
                          <p>{log.product?.name ?? '—'}</p>
                          <p className="text-xs text-stone">{log.variantSku}</p>
                        </td>
                        <td className="px-4 py-3 tabular-nums font-medium">
                          {log.change > 0 ? '+' : ''}
                          {log.change}
                        </td>
                        <td className="px-4 py-3">
                          {REASON_LABELS[log.reason]}
                          {log.order && (
                            <p className="text-xs text-stone">{log.order.orderNumber}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-stone">{log.note || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination
                page={logs.data.pagination.page}
                totalPages={logs.data.pagination.totalPages}
                total={logs.data.pagination.total}
                onChange={(page) => setFilter('page', page > 1 ? String(page) : '')}
              />
            </>
          )}
        </div>
      </section>

      <StockAdjustModal item={adjustItem} open={Boolean(adjustItem)} onClose={() => setAdjustItem(null)} />
    </>
  )
}
