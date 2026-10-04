import { Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { useAdminCategories, useAdminProducts, useDeleteProduct, useToggleProduct } from '@/api/admin'
import { errorMessage } from '@/api/client'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { Pagination } from '@/components/admin/Pagination'
import { Badge, Button, ButtonLink, EmptyState, ErrorState, Input, Skeleton } from '@/components/ui'
import { categoryLabel } from '@/lib/constants'
import { formatKwacha } from '@/lib/money'
import { PageMeta } from '@/components/seo/PageMeta'

export function AdminProductsPage() {
  const [params, setParams] = useSearchParams()
  const filters = useMemo(
    () => ({
      search: params.get('search') ?? undefined,
      page: Number(params.get('page') || '1') || 1,
      limit: 20,
    }),
    [params],
  )
  const { data: categories = [] } = useAdminCategories()
  const { data, isPending, isError, isFetching } = useAdminProducts(filters)
  const toggle = useToggleProduct()
  const remove = useDeleteProduct()
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const setSearch = (value: string) => {
    const next = new URLSearchParams(params)
    if (value) next.set('search', value)
    else next.delete('search')
    next.delete('page')
    setParams(next, { replace: true })
  }

  return (
    <>
      <PageMeta title={'Products · Admin'} noIndex />
      <AdminPageHeader
        title="Products"
        description="Catalogue, variants and visibility."
        actions={
          <ButtonLink to="/admin/products/new" size="sm">
            <Plus className="size-4" aria-hidden="true" />
            New product
          </ButtonLink>
        }
      />

      <div className="px-4 sm:px-6 md:px-10">
        <Input
          label="Search"
          placeholder="Name or SKU"
          value={filters.search ?? ''}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
      </div>

      <div className={`px-4 py-6 sm:px-6 md:px-10 ${isFetching && !isPending ? 'opacity-70' : ''}`}>
        {isError && <ErrorState title="Couldn’t load products" />}
        {isPending && (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-md" />
            ))}
          </div>
        )}
        {data && data.items.length === 0 && (
          <EmptyState
            title="No products"
            description="Add your first towel to the catalogue."
            action={
              <ButtonLink to="/admin/products/new">New product</ButtonLink>
            }
          />
        )}

        {data && data.items.length > 0 && (
          <>
            <ul className="space-y-2">
              {data.items.map((product) => {
                const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0)
                const lowCount = product.variants.filter((v) => v.stock <= v.lowStockThreshold).length
                const minPrice = Math.min(...product.variants.map((v) => v.priceNgwee))
                return (
                  <li
                    key={product._id}
                    className="rounded-md border border-sand bg-cream p-4 sm:flex sm:items-center sm:justify-between sm:gap-4"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link to={`/admin/products/${product._id}`} className="font-medium hover:underline">
                          {product.name}
                        </Link>
                        {!product.active && <Badge tone="neutral" size="sm">Inactive</Badge>}
                        {product.featured && <Badge tone="accent" size="sm">Featured</Badge>}
                      </div>
                      <p className="mt-1 text-xs text-stone">
                        {categoryLabel(product.category, categories)} · from {formatKwacha(minPrice)} ·{' '}
                        {product.variants.length} variants · stock {totalStock}
                        {lowCount > 0 ? ` · ${lowCount} low` : ''}
                      </p>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2 sm:mt-0">
                      <label className="inline-flex items-center gap-2 text-xs text-stone">
                        <input
                          type="checkbox"
                          checked={product.active}
                          onChange={() =>
                            toggle.mutate(
                              { id: product._id, flag: 'active' },
                              {
                                onSuccess: () => toast.success(product.active ? 'Hidden from shop' : 'Published'),
                                onError: (e) => toast.error(errorMessage(e)),
                              },
                            )
                          }
                        />
                        Active
                      </label>
                      <label className="inline-flex items-center gap-2 text-xs text-stone">
                        <input
                          type="checkbox"
                          checked={product.featured}
                          onChange={() =>
                            toggle.mutate(
                              { id: product._id, flag: 'featured' },
                              {
                                onSuccess: () => toast.success(product.featured ? 'Unfeatured' : 'Featured'),
                                onError: (e) => toast.error(errorMessage(e)),
                              },
                            )
                          }
                        />
                        Featured
                      </label>
                      <ButtonLink to={`/admin/products/${product._id}`} variant="secondary" size="sm">
                        Edit
                      </ButtonLink>
                      <Button type="button" variant="ghost" size="sm" onClick={() => setDeleteId(product._id)}>
                        Delete
                      </Button>
                    </div>
                  </li>
                )
              })}
            </ul>
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

      <ConfirmDialog
        open={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        title="Delete product?"
        description="This cannot be undone. Prefer deactivating if it has order history."
        confirmLabel="Delete"
        tone="danger"
        loading={remove.isPending}
        onConfirm={async () => {
          if (!deleteId) return
          try {
            await remove.mutateAsync(deleteId)
            toast.success('Product deleted')
            setDeleteId(null)
          } catch (error) {
            toast.error(errorMessage(error))
          }
        }}
      />
    </>
  )
}
