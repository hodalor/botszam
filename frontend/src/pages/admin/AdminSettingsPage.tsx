import { Plus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  useAdminCategories,
  useAdminSettings,
  useAdminZones,
  useCreateCategory,
  useCreateZone,
  useDeleteCategory,
  useDeleteZone,
  useSaveSettings,
  useUpdateCategory,
  useUpdateZone,
} from '@/api/admin'
import type { AdminCategory, AdminDeliveryZone, MobileMoneyNetwork } from '@/api/types'
import { errorMessage } from '@/api/client'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { Alert, Button, Input, Select, Skeleton, Textarea } from '@/components/ui'
import { kwachaToNgwee, ngweeToKwacha, formatKwacha } from '@/lib/money'
import { formatPhoneLocal, zambianPhoneSchema } from '@/lib/phone'
import { PageMeta } from '@/components/seo/PageMeta'

const NETWORKS: MobileMoneyNetwork[] = ['MTN', 'Airtel', 'Zamtel']

const optionalPhone = z.union([z.literal(''), zambianPhoneSchema])

const settingsSchema = z.object({
  storeName: z.string().trim().min(1, 'Store name required').max(120),
  contactPhone: optionalPhone,
  whatsappNumber: optionalPhone,
  email: z.union([z.literal(''), z.email('Enter a valid email')]),
  paymentInstructions: z.string().trim().max(2000),
  mobileMoneyAccounts: z.array(
    z.object({
      network: z.enum(NETWORKS),
      number: zambianPhoneSchema,
      accountName: z.string().trim().min(2).max(120),
    }),
  ),
})

type SettingsInput = z.input<typeof settingsSchema>
type SettingsValues = z.output<typeof settingsSchema>

export function AdminSettingsPage() {
  const { data: settings, isPending, isError } = useAdminSettings()
  const save = useSaveSettings()
  const zonesQuery = useAdminZones()
  const createZone = useCreateZone()
  const updateZone = useUpdateZone()
  const deleteZone = useDeleteZone()
  const categoriesQuery = useAdminCategories()
  const createCategory = useCreateCategory()
  const updateCategory = useUpdateCategory()
  const deleteCategory = useDeleteCategory()

  const [removeAccountIndex, setRemoveAccountIndex] = useState<number | null>(null)
  const [deleteZoneId, setDeleteZoneId] = useState<string | null>(null)
  const [deleteCategoryId, setDeleteCategoryId] = useState<string | null>(null)
  const [zoneDraft, setZoneDraft] = useState({ name: '', feeKwacha: '50', estimatedDays: '', active: true })
  const [editingZone, setEditingZone] = useState<AdminDeliveryZone | null>(null)
  const [categoryDraft, setCategoryDraft] = useState({
    name: '',
    slug: '',
    description: '',
    sortOrder: '0',
    active: true,
  })
  const [editingCategory, setEditingCategory] = useState<AdminCategory | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SettingsInput, unknown, SettingsValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      storeName: '',
      contactPhone: '',
      whatsappNumber: '',
      email: '',
      paymentInstructions: '',
      mobileMoneyAccounts: [],
    },
  })

  const accounts = watch('mobileMoneyAccounts')

  useEffect(() => {
    if (!settings) return
    reset({
      storeName: settings.storeName,
      contactPhone: settings.contactPhone ? formatPhoneLocal(settings.contactPhone) : '',
      whatsappNumber: settings.whatsappNumber ? formatPhoneLocal(settings.whatsappNumber) : '',
      email: settings.email ?? '',
      paymentInstructions: settings.paymentInstructions ?? '',
      mobileMoneyAccounts: settings.mobileMoneyAccounts.map((a) => ({
        network: a.network,
        number: formatPhoneLocal(a.number),
        accountName: a.accountName,
      })),
    })
  }, [settings, reset])

  const onSave = async (values: SettingsValues) => {
    try {
      await save.mutateAsync(values)
      toast.success('Settings saved')
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  const saveZone = async () => {
    const fee = Number(zoneDraft.feeKwacha)
    if (!zoneDraft.name.trim() || !zoneDraft.estimatedDays.trim() || !Number.isFinite(fee) || fee < 0) {
      toast.error('Fill in zone name, fee and estimated days')
      return
    }
    const payload = {
      name: zoneDraft.name.trim(),
      feeNgwee: kwachaToNgwee(fee),
      estimatedDays: zoneDraft.estimatedDays.trim(),
      active: zoneDraft.active,
    }
    try {
      if (editingZone) {
        await updateZone.mutateAsync({ id: editingZone._id, ...payload })
        toast.success('Zone updated')
      } else {
        await createZone.mutateAsync(payload)
        toast.success('Zone created')
      }
      setEditingZone(null)
      setZoneDraft({ name: '', feeKwacha: '50', estimatedDays: '', active: true })
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  const saveCategory = async () => {
    if (!categoryDraft.name.trim()) {
      toast.error('Category name is required')
      return
    }
    const sortOrder = Number(categoryDraft.sortOrder)
    const payload = {
      name: categoryDraft.name.trim(),
      slug: categoryDraft.slug.trim() || undefined,
      description: categoryDraft.description.trim(),
      sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
      active: categoryDraft.active,
    }
    try {
      if (editingCategory) {
        await updateCategory.mutateAsync({ id: editingCategory._id, ...payload })
        toast.success('Category updated')
      } else {
        await createCategory.mutateAsync(payload)
        toast.success('Category added')
      }
      setEditingCategory(null)
      setCategoryDraft({ name: '', slug: '', description: '', sortOrder: '0', active: true })
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  if (isPending) {
    return (
      <div className="space-y-4 px-4 py-8 md:px-10">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="px-4 py-8 md:px-10">
        <Alert tone="danger">Couldn’t load settings.</Alert>
      </div>
    )
  }

  return (
    <>
      <PageMeta title={'Settings · Admin'} noIndex />
      <AdminPageHeader title="Settings" description="Store contact, payments, categories and delivery zones." />

      <form
        noValidate
        onSubmit={(e) => void handleSubmit(onSave)(e)}
        className="space-y-8 px-4 pb-8 sm:px-6 md:px-10"
      >
        <section className="grid gap-4 rounded-md border border-sand bg-cream p-4 sm:grid-cols-2 sm:p-5">
          <h2 className="text-lg sm:col-span-2">Store info</h2>
          <Input label="Store name" required error={errors.storeName?.message} {...register('storeName')} />
          <Input label="Email" optional error={errors.email?.message} {...register('email')} />
          <Input label="Contact phone" optional error={errors.contactPhone?.message} {...register('contactPhone')} />
          <Input
            label="WhatsApp number"
            optional
            error={errors.whatsappNumber?.message}
            {...register('whatsappNumber')}
          />
          <Textarea
            label="Payment instructions"
            optional
            rows={4}
            className="sm:col-span-2"
            hint="Shown to customers paying by mobile money."
            {...register('paymentInstructions')}
          />
        </section>

        <section className="rounded-md border border-sand bg-cream p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg">Mobile money accounts</h2>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() =>
                setValue('mobileMoneyAccounts', [
                  ...accounts,
                  { network: 'MTN', number: '', accountName: '' },
                ])
              }
            >
              <Plus className="size-4" />
              Add
            </Button>
          </div>
          {accounts.length === 0 && <p className="mt-3 text-sm text-stone">No accounts configured.</p>}
          <ul className="mt-4 space-y-3">
            {accounts.map((_, index) => (
              <li key={index} className="grid gap-3 rounded-md border border-sand bg-linen/40 p-3 sm:grid-cols-[8rem_1fr_1fr_auto]">
                <Select
                  label="Network"
                  options={NETWORKS.map((n) => ({ value: n, label: n }))}
                  {...register(`mobileMoneyAccounts.${index}.network`)}
                />
                <Input
                  label="Number"
                  required
                  error={errors.mobileMoneyAccounts?.[index]?.number?.message}
                  {...register(`mobileMoneyAccounts.${index}.number`)}
                />
                <Input
                  label="Account name"
                  required
                  error={errors.mobileMoneyAccounts?.[index]?.accountName?.message}
                  {...register(`mobileMoneyAccounts.${index}.accountName`)}
                />
                <div className="flex items-end">
                  <Button type="button" variant="ghost" size="icon" aria-label="Remove account" onClick={() => setRemoveAccountIndex(index)}>
                    <Trash2 className="size-4 text-danger" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <div className="flex justify-end">
          <Button type="submit" size="lg" loading={isSubmitting || save.isPending} loadingText="Saving…">
            Save settings
          </Button>
        </div>
      </form>

      <section className="border-t border-sand px-4 py-8 sm:px-6 md:px-10" aria-labelledby="categories">
        <h2 id="categories" className="text-lg">
          Product categories
        </h2>
        <p className="mt-1 text-sm text-stone">
          These appear on the shop and home page. Add or remove collections anytime.
        </p>
        {categoriesQuery.isPending && <Skeleton className="mt-4 h-24 w-full" />}
        {categoriesQuery.data && (
          <ul className="mt-4 space-y-2">
            {categoriesQuery.data.map((category) => (
              <li
                key={category._id}
                className="flex flex-col gap-3 rounded-md border border-sand bg-cream p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium">
                    {category.name}
                    {!category.active && <span className="ml-2 text-xs text-stone">(inactive)</span>}
                  </p>
                  <p className="text-sm text-stone">
                    /{category.slug}
                    {category.description ? ` · ${category.description}` : ''}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setEditingCategory(category)
                      setCategoryDraft({
                        name: category.name,
                        slug: category.slug,
                        description: category.description ?? '',
                        sortOrder: String(category.sortOrder ?? 0),
                        active: category.active,
                      })
                    }}
                  >
                    Edit
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setDeleteCategoryId(category._id)}>
                    Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-6 grid gap-3 rounded-md border border-dashed border-sand-deep bg-cream/60 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <p className="text-sm font-medium sm:col-span-2 lg:col-span-4">
            {editingCategory ? `Editing “${editingCategory.name}”` : 'Add a category'}
          </p>
          <Input
            label="Name"
            value={categoryDraft.name}
            onChange={(e) => setCategoryDraft((d) => ({ ...d, name: e.target.value }))}
            placeholder="e.g. Home use"
          />
          <Input
            label="Slug"
            optional
            value={categoryDraft.slug}
            onChange={(e) => setCategoryDraft((d) => ({ ...d, slug: e.target.value }))}
            placeholder="home-use"
            hint="Leave blank to auto-generate"
          />
          <Input
            label="Sort order"
            type="number"
            value={categoryDraft.sortOrder}
            onChange={(e) => setCategoryDraft((d) => ({ ...d, sortOrder: e.target.value }))}
          />
          <label className="inline-flex items-center gap-2 self-end pb-2 text-sm">
            <input
              type="checkbox"
              checked={categoryDraft.active}
              onChange={(e) => setCategoryDraft((d) => ({ ...d, active: e.target.checked }))}
            />
            Active
          </label>
          <Textarea
            label="Description"
            optional
            rows={2}
            className="sm:col-span-2 lg:col-span-4"
            value={categoryDraft.description}
            onChange={(e) => setCategoryDraft((d) => ({ ...d, description: e.target.value }))}
          />
          <div className="flex gap-2 sm:col-span-2 lg:col-span-4">
            <Button
              type="button"
              onClick={() => void saveCategory()}
              loading={createCategory.isPending || updateCategory.isPending}
            >
              {editingCategory ? 'Update category' : 'Add category'}
            </Button>
            {editingCategory && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setEditingCategory(null)
                  setCategoryDraft({ name: '', slug: '', description: '', sortOrder: '0', active: true })
                }}
              >
                Cancel edit
              </Button>
            )}
          </div>
        </div>
      </section>

      <section className="border-t border-sand px-4 py-8 sm:px-6 md:px-10" aria-labelledby="zones">
        <h2 id="zones" className="text-lg">
          Delivery zones
        </h2>
        {zonesQuery.isPending && <Skeleton className="mt-4 h-24 w-full" />}
        {zonesQuery.data && (
          <ul className="mt-4 space-y-2">
            {zonesQuery.data.map((zone) => (
              <li
                key={zone._id}
                className="flex flex-col gap-3 rounded-md border border-sand bg-cream p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium">
                    {zone.name}
                    {!zone.active && <span className="ml-2 text-xs text-stone">(inactive)</span>}
                  </p>
                  <p className="text-sm text-stone">
                    {formatKwacha(zone.feeNgwee)} · {zone.estimatedDays}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setEditingZone(zone)
                      setZoneDraft({
                        name: zone.name,
                        feeKwacha: String(ngweeToKwacha(zone.feeNgwee)),
                        estimatedDays: zone.estimatedDays,
                        active: zone.active,
                      })
                    }}
                  >
                    Edit
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setDeleteZoneId(zone._id)}>
                    Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-6 grid gap-3 rounded-md border border-dashed border-sand-deep bg-cream/60 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <p className="text-sm font-medium sm:col-span-2 lg:col-span-4">
            {editingZone ? `Editing “${editingZone.name}”` : 'Add a zone'}
          </p>
          <Input label="Name" value={zoneDraft.name} onChange={(e) => setZoneDraft((d) => ({ ...d, name: e.target.value }))} />
          <Input
            label="Fee (K)"
            type="number"
            step="0.01"
            value={zoneDraft.feeKwacha}
            onChange={(e) => setZoneDraft((d) => ({ ...d, feeKwacha: e.target.value }))}
          />
          <Input
            label="Estimated days"
            value={zoneDraft.estimatedDays}
            onChange={(e) => setZoneDraft((d) => ({ ...d, estimatedDays: e.target.value }))}
            placeholder="e.g. 1-2 days"
          />
          <label className="inline-flex items-center gap-2 self-end pb-2 text-sm">
            <input
              type="checkbox"
              checked={zoneDraft.active}
              onChange={(e) => setZoneDraft((d) => ({ ...d, active: e.target.checked }))}
            />
            Active
          </label>
          <div className="flex gap-2 sm:col-span-2 lg:col-span-4">
            <Button type="button" onClick={() => void saveZone()} loading={createZone.isPending || updateZone.isPending}>
              {editingZone ? 'Update zone' : 'Add zone'}
            </Button>
            {editingZone && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setEditingZone(null)
                  setZoneDraft({ name: '', feeKwacha: '50', estimatedDays: '', active: true })
                }}
              >
                Cancel edit
              </Button>
            )}
          </div>
        </div>
      </section>

      <ConfirmDialog
        open={removeAccountIndex !== null}
        onClose={() => setRemoveAccountIndex(null)}
        title="Remove mobile money account?"
        description="Customers won’t see this number at checkout until you add it again."
        confirmLabel="Remove"
        tone="danger"
        onConfirm={() => {
          if (removeAccountIndex === null) return
          setValue(
            'mobileMoneyAccounts',
            accounts.filter((_, i) => i !== removeAccountIndex),
          )
          setRemoveAccountIndex(null)
        }}
      />

      <ConfirmDialog
        open={Boolean(deleteZoneId)}
        onClose={() => setDeleteZoneId(null)}
        title="Delete delivery zone?"
        description="Existing orders keep their zone name; new checkouts won’t offer it."
        confirmLabel="Delete"
        tone="danger"
        loading={deleteZone.isPending}
        onConfirm={async () => {
          if (!deleteZoneId) return
          try {
            await deleteZone.mutateAsync(deleteZoneId)
            toast.success('Zone deleted')
            setDeleteZoneId(null)
          } catch (error) {
            toast.error(errorMessage(error))
          }
        }}
      />

      <ConfirmDialog
        open={Boolean(deleteCategoryId)}
        onClose={() => setDeleteCategoryId(null)}
        title="Delete category?"
        description="Categories with products cannot be deleted. Move or remove those products first."
        confirmLabel="Delete"
        tone="danger"
        loading={deleteCategory.isPending}
        onConfirm={async () => {
          if (!deleteCategoryId) return
          try {
            await deleteCategory.mutateAsync(deleteCategoryId)
            toast.success('Category deleted')
            setDeleteCategoryId(null)
          } catch (error) {
            toast.error(errorMessage(error))
          }
        }}
      />
    </>
  )
}
