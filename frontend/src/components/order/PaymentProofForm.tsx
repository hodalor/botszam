import { zodResolver } from '@hookform/resolvers/zod'
import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { errorMessage, isApiError } from '@/api/client'
import { useSubmitPaymentProof } from '@/api/orders'
import type { CustomerOrder, MobileMoneyNetwork } from '@/api/types'
import { Alert, Button, ButtonLink, Input } from '@/components/ui'
import { cn } from '@/lib/cn'
import { applyServerFieldErrors, transactionRefSchema } from '@/lib/forms'
import { formatPhoneLocal, zambianPhoneSchema } from '@/lib/phone'

const NETWORKS: MobileMoneyNetwork[] = ['MTN', 'Airtel', 'Zamtel']

const proofSchema = z.object({
  network: z.enum(NETWORKS, { error: 'Choose the network you paid with' }),
  payerPhone: zambianPhoneSchema,
  transactionRef: transactionRefSchema,
})

type ProofInput = z.input<typeof proofSchema>
type ProofValues = z.output<typeof proofSchema>

interface PaymentProofFormProps {
  order: CustomerOrder
  /** The phone used to unlock this order; the API authorises the submission with it. */
  accessPhone: string
  /** Networks we have accounts on, listed first. */
  networks: MobileMoneyNetwork[]
  onStale: () => void
}

export function PaymentProofForm({ order, accessPhone, networks, onStale }: PaymentProofFormProps) {
  const submitProof = useSubmitPaymentProof(order.orderNumber)
  const submittingRef = useRef(false)
  const [formError, setFormError] = useState<{ message: string; soldOut?: boolean } | null>(null)
  const resubmitting = order.status === 'payment_rejected'
  const options = networks.length > 0 ? networks : NETWORKS

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ProofInput, unknown, ProofValues>({
    resolver: zodResolver(proofSchema),
    defaultValues: {
      network: order.payment.network ?? (options.length === 1 ? options[0] : undefined),
      payerPhone: formatPhoneLocal(order.payment.payerPhone ?? order.customer.phone),
      transactionRef: '',
    },
  })

  const onSubmit = async (values: ProofValues) => {
    if (submittingRef.current) return
    submittingRef.current = true
    setFormError(null)
    try {
      await submitProof.mutateAsync({ phone: accessPhone, ...values })
      toast.success('Payment details sent', { description: 'We’ll let you know as soon as it’s verified.' })
    } catch (error) {
      if (isApiError(error) && error.code === 'TRANSACTION_REF_USED') {
        setError('transactionRef', { type: 'server', message: 'This transaction ID has already been used. Please check it.' }, { shouldFocus: true })
      } else if (isApiError(error) && error.code === 'OUT_OF_STOCK') {
        setFormError({ message: error.message, soldOut: true })
      } else if (isApiError(error) && (error.code === 'INVALID_PAYMENT_STATE' || error.code === 'INVALID_STATUS_TRANSITION')) {
        setFormError({ message: 'This order has changed since you opened it. We’ve refreshed it for you.' })
        onStale()
      } else if (!applyServerFieldErrors(error, setError, { network: 'network', payerPhone: 'payerPhone', transactionRef: 'transactionRef' })) {
        setFormError({
          message: isApiError(error) && error.status === 429 ? 'Too many attempts. Please wait a minute and try again.' : errorMessage(error),
        })
      }
    } finally {
      submittingRef.current = false
    }
  }

  return (
    <form noValidate onSubmit={(e) => handleSubmit(onSubmit)(e)} className="flex flex-col gap-5">
      <fieldset aria-describedby={errors.network ? 'network-error' : undefined}>
        <legend className="mb-2 text-sm font-medium">
          Network you paid with<span className="ml-0.5 text-terracotta-ink" aria-hidden="true">*</span>
        </legend>
        <div className="grid grid-cols-3 gap-2">
          {options.map((network) => (
            <label
              key={network}
              className={cn(
                'flex h-11 cursor-pointer items-center justify-center rounded-md border border-sand-deep bg-cream text-sm font-medium transition-colors',
                'hover:border-stone/60 has-[:checked]:border-charcoal has-[:checked]:bg-charcoal has-[:checked]:text-linen',
                'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-charcoal',
              )}
            >
              <input type="radio" value={network} className="sr-only" {...register('network')} />
              {network}
            </label>
          ))}
        </div>
        {errors.network && (
          <p id="network-error" className="mt-1.5 text-xs font-medium text-danger" role="alert">
            {errors.network.message}
          </p>
        )}
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-2">
        <Input
          label="Number you paid from"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="097 123 4567"
          required
          error={errors.payerPhone?.message}
          {...register('payerPhone')}
        />
        <Input
          label="Transaction ID"
          placeholder="e.g. MP240914.1532.A12345"
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
          required
          hint="It’s in the confirmation SMS from your network."
          error={errors.transactionRef?.message}
          inputClassName="uppercase placeholder:normal-case"
          {...register('transactionRef')}
        />
      </div>

      {formError && (
        <Alert
          tone="danger"
          action={formError.soldOut && <ButtonLink to="/shop" size="sm" variant="secondary">Shop towels</ButtonLink>}
        >
          {formError.message}
          {formError.soldOut && (
            <p className="mt-1">If you’ve already paid, chat with us on WhatsApp and we’ll arrange a refund or a replacement.</p>
          )}
        </Alert>
      )}

      <Button type="submit" size="lg" fullWidth loading={isSubmitting} loadingText="Sending…">
        {resubmitting ? 'Resubmit payment details' : 'I’ve paid — submit details'}
      </Button>
    </form>
  )
}
