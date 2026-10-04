import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useDeliveryZones } from '@/api/store'
import type { Address } from '@/api/types'
import { Alert, Button, ErrorState, Input, Select, Textarea } from '@/components/ui'
import { formatKwacha } from '@/lib/money'

const addressSchema = z.object({
  label: z.string().trim().max(40, 'Keep the label under 40 characters'),
  zone: z.string().min(1, 'Choose the delivery zone'),
  area: z.string().trim().min(2, 'Enter the area or neighbourhood').max(120, 'That area name is too long'),
  street: z.string().trim().min(2, 'Enter the street and house or plot number').max(200, 'That address is too long'),
  landmark: z.string().trim().max(200, 'Keep the landmark under 200 characters'),
  notes: z.string().trim().max(500, 'Keep notes under 500 characters'),
  isDefault: z.boolean(),
})

export type AddressFormValues = z.output<typeof addressSchema>

interface AddressFormProps {
  initial?: Address
  /** Forces "default" on (e.g. for the first address). */
  mustBeDefault: boolean
  saving: boolean
  error: string | null
  onSubmit: (values: AddressFormValues) => void
  onCancel: () => void
}

export function AddressForm({ initial, mustBeDefault, saving, error, onSubmit, onCancel }: AddressFormProps) {
  const zones = useDeliveryZones()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.input<typeof addressSchema>, unknown, AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      label: initial?.label ?? 'Home',
      zone: initial?.zone ?? '',
      area: initial?.area ?? '',
      street: initial?.street ?? '',
      landmark: initial?.landmark ?? '',
      notes: initial?.notes ?? '',
      isDefault: mustBeDefault || (initial?.isDefault ?? false),
    },
  })

  return (
    <form
      noValidate
      onSubmit={handleSubmit((values) => onSubmit({ ...values, label: values.label || 'Home', isDefault: mustBeDefault || values.isDefault }))}
      className="flex flex-col gap-5 px-5 py-5 md:px-6"
    >
      <Input label="Label" placeholder="Home, Work…" error={errors.label?.message} {...register('label')} data-autofocus />
      {zones.isError ? (
        <ErrorState compact title="We couldn’t load delivery zones" error={zones.error} onRetry={() => zones.refetch()} retrying={zones.isFetching} />
      ) : (
        <Select
          label="Delivery zone"
          required
          placeholder={zones.isPending ? 'Loading delivery zones…' : 'Choose a zone'}
          disabled={zones.isPending}
          options={zones.data?.map((z) => ({ value: z.id, label: `${z.name} — ${z.feeNgwee === 0 ? 'Free' : formatKwacha(z.feeNgwee)}` })) ?? []}
          error={errors.zone?.message}
          {...register('zone')}
        />
      )}
      <div className="grid gap-5 sm:grid-cols-2">
        <Input label="Area / neighbourhood" required error={errors.area?.message} {...register('area')} />
        <Input label="Street & house number" required error={errors.street?.message} {...register('street')} />
      </div>
      <Input label="Nearest landmark" optional error={errors.landmark?.message} {...register('landmark')} />
      <Textarea label="Delivery notes" optional rows={2} error={errors.notes?.message} {...register('notes')} />
      <label className="flex items-center gap-2.5 text-sm text-charcoal-soft">
        <input type="checkbox" className="size-4 accent-charcoal" disabled={mustBeDefault} {...register('isDefault')} />
        Use as my default delivery address
      </label>
      {error && <Alert tone="danger">{error}</Alert>}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" loading={saving} loadingText="Saving…">
          Save address
        </Button>
      </div>
    </form>
  )
}
