import { useState } from 'react'
import { toast } from 'sonner'
import { errorMessage, isApiError } from '@/api/client'
import { useCancelOrder } from '@/api/orders'
import { Button, Modal } from '@/components/ui'

interface CancelOrderButtonProps {
  orderNumber: string
  phone: string
  onStale: () => void
}

export function CancelOrderButton({ orderNumber, phone, onStale }: CancelOrderButtonProps) {
  const [open, setOpen] = useState(false)
  const cancel = useCancelOrder(orderNumber)

  const onConfirm = () => {
    if (cancel.isPending) return
    cancel.mutate(
      { phone },
      {
        onSuccess: () => {
          setOpen(false)
          toast.success('Your order has been cancelled')
        },
        onError: (error) => {
          setOpen(false)
          if (isApiError(error) && error.code === 'ORDER_NOT_CANCELLABLE') {
            toast.error('This order can no longer be cancelled online', {
              description: 'It’s already being prepared. Chat with us on WhatsApp and we’ll help.',
            })
            onStale()
          } else {
            toast.error(errorMessage(error))
          }
        },
      },
    )
  }

  return (
    <>
      <Button variant="ghost" fullWidth className="text-danger hover:bg-danger-soft/60" onClick={() => setOpen(true)}>
        Cancel order
      </Button>
      <Modal
        open={open}
        onClose={() => !cancel.isPending && setOpen(false)}
        size="sm"
        title="Cancel this order?"
        description={`Order ${orderNumber} will be cancelled and the towels released back to stock. This can’t be undone.`}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={cancel.isPending} data-autofocus>
              Keep my order
            </Button>
            <Button onClick={onConfirm} loading={cancel.isPending} loadingText="Cancelling…" className="bg-danger hover:bg-danger/90">
              Yes, cancel order
            </Button>
          </div>
        }
      >
        <p className="px-5 py-4 text-sm leading-relaxed text-charcoal-soft md:px-6">
          If you’ve already sent a mobile money payment, don’t cancel — chat with us on WhatsApp instead so we can sort it out.
        </p>
      </Modal>
    </>
  )
}
