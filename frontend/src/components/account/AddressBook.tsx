import { MapPin, Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { useUpdateMe } from '@/api/auth'
import { errorMessage } from '@/api/client'
import { useDeliveryZones } from '@/api/store'
import type { Address, User } from '@/api/types'
import { Badge, Button, EmptyState, Modal } from '@/components/ui'
import { toAddressInput } from '@/lib/addresses'
import { AddressForm, type AddressFormValues } from './AddressForm'

const MAX_ADDRESSES = 10

type Editing = { mode: 'add' } | { mode: 'edit'; index: number } | null

export function AddressBook({ user }: { user: User }) {
  const zones = useDeliveryZones()
  const updateMe = useUpdateMe()
  const [editing, setEditing] = useState<Editing>(null)
  const [deleting, setDeleting] = useState<number | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const addresses = user.addresses

  /** Keeps exactly one default whenever there are addresses. */
  const save = (next: Omit<Address, '_id'>[], success: string, onDone: () => void) => {
    const defaultIndex = Math.max(0, next.findLastIndex((a) => a.isDefault))
    const normalised = next.map((a, i) => ({ ...a, isDefault: i === defaultIndex }))
    setFormError(null)
    updateMe.mutate(
      { addresses: normalised },
      {
        onSuccess: () => {
          toast.success(success)
          onDone()
        },
        onError: (error) => setFormError(errorMessage(error)),
      },
    )
  }

  const onSubmitForm = (values: AddressFormValues) => {
    const current = addresses.map(toAddressInput)
    if (editing?.mode === 'edit') {
      const next = current.map((a, i) => (i === editing.index ? values : values.isDefault ? { ...a, isDefault: false } : a))
      save(next, 'Address updated', () => setEditing(null))
    } else {
      const next = [...current.map((a) => (values.isDefault ? { ...a, isDefault: false } : a)), values]
      save(next, 'Address added', () => setEditing(null))
    }
  }

  const onDelete = () => {
    if (deleting === null) return
    const next = addresses.filter((_, i) => i !== deleting).map(toAddressInput)
    save(next, 'Address removed', () => setDeleting(null))
  }

  const makeDefault = (index: number) => {
    const next = addresses.map((a, i) => ({ ...toAddressInput(a), isDefault: i === index }))
    save(next, 'Default address updated', () => {})
  }

  const editingAddress = editing?.mode === 'edit' ? addresses[editing.index] : undefined

  return (
    <div>
      {addresses.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="No saved addresses"
          description="Save an address and it will be ready for you at checkout."
          action={
            <Button leftIcon={<Plus className="size-4" aria-hidden="true" />} onClick={() => setEditing({ mode: 'add' })}>
              Add an address
            </Button>
          }
        />
      ) : (
        <>
          <ul className="grid gap-3 md:grid-cols-2">
            {addresses.map((address, index) => {
              const zone = zones.data?.find((z) => z.id === address.zone)
              return (
                <li key={address._id ?? index} className="flex flex-col rounded-md border border-sand bg-cream p-5">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-display text-lg">{address.label || 'Address'}</p>
                    {address.isDefault && (
                      <Badge tone="sand" size="sm">
                        Default
                      </Badge>
                    )}
                  </div>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-charcoal-soft">
                    {address.street}
                    <br />
                    {address.area}
                    {zone ? `, ${zone.name}` : zones.isSuccess ? ' · zone no longer available' : ''}
                    {address.landmark && (
                      <>
                        <br />
                        <span className="text-stone">Near {address.landmark}</span>
                      </>
                    )}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-1 border-t border-sand pt-3">
                    <Button
                      size="sm"
                      variant="ghost"
                      leftIcon={<Pencil className="size-3.5" aria-hidden="true" />}
                      onClick={() => {
                        setFormError(null)
                        setEditing({ mode: 'edit', index })
                      }}
                    >
                      Edit<span className="sr-only"> {address.label}</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      leftIcon={<Trash2 className="size-3.5" aria-hidden="true" />}
                      onClick={() => {
                        setFormError(null)
                        setDeleting(index)
                      }}
                    >
                      Delete<span className="sr-only"> {address.label}</span>
                    </Button>
                    {!address.isDefault && (
                      <Button size="sm" variant="ghost" className="ml-auto" disabled={updateMe.isPending} onClick={() => makeDefault(index)}>
                        Make default
                      </Button>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
          <div className="mt-5 flex flex-wrap items-center gap-4">
            <Button
              variant="secondary"
              leftIcon={<Plus className="size-4" aria-hidden="true" />}
              disabled={addresses.length >= MAX_ADDRESSES}
              onClick={() => {
                setFormError(null)
                setEditing({ mode: 'add' })
              }}
            >
              Add an address
            </Button>
            {addresses.length >= MAX_ADDRESSES && <p className="text-sm text-stone">You can save up to {MAX_ADDRESSES} addresses.</p>}
          </div>
        </>
      )}

      <Modal
        open={editing !== null}
        onClose={() => !updateMe.isPending && setEditing(null)}
        title={editing?.mode === 'edit' ? 'Edit address' : 'Add an address'}
      >
        {editing && (
          <AddressForm
            key={editing.mode === 'edit' ? editing.index : 'new'}
            initial={editingAddress}
            mustBeDefault={addresses.length === 0 || (editing.mode === 'edit' && addresses.length === 1)}
            saving={updateMe.isPending}
            error={formError}
            onSubmit={onSubmitForm}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>

      <Modal
        open={deleting !== null}
        onClose={() => !updateMe.isPending && setDeleting(null)}
        size="sm"
        title="Delete this address?"
        description={deleting !== null ? `${addresses[deleting]?.label}: ${addresses[deleting]?.street}, ${addresses[deleting]?.area}` : undefined}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => setDeleting(null)} disabled={updateMe.isPending} data-autofocus>
              Keep it
            </Button>
            <Button onClick={onDelete} loading={updateMe.isPending} loadingText="Deleting…" className="bg-danger hover:bg-danger/90">
              Delete address
            </Button>
          </div>
        }
      >
        {formError ? (
          <p className="px-5 py-4 text-sm text-danger md:px-6" role="alert">
            {formError}
          </p>
        ) : (
          <p className="px-5 py-4 text-sm text-charcoal-soft md:px-6">Past orders keep their delivery details.</p>
        )}
      </Modal>
    </div>
  )
}
