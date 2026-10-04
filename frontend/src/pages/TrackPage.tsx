import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { PackageSearch } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { errorMessage, isApiError } from '@/api/client'
import { fetchTrackedOrder, orderKeys } from '@/api/orders'
import { Alert, Button, Input } from '@/components/ui'
import { normaliseOrderNumber, rememberOrderPhone } from '@/lib/orderAccess'
import { zambianPhoneSchema } from '@/lib/phone'
import { PageMeta } from '@/components/seo/PageMeta'

const trackSchema = z.object({
  orderNumber: z
    .string()
    .trim()
    .min(1, 'Enter your order number')
    .max(30, 'That doesn’t look like an order number')
    .transform(normaliseOrderNumber),
  phone: zambianPhoneSchema,
})

export function TrackPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.input<typeof trackSchema>, unknown, z.output<typeof trackSchema>>({
    resolver: zodResolver(trackSchema),
    defaultValues: { orderNumber: '', phone: '' },
  })

  const onSubmit = async ({ orderNumber, phone }: z.output<typeof trackSchema>) => {
    setFormError(null)
    try {
      await queryClient.fetchQuery({
        queryKey: orderKeys.track(orderNumber, phone),
        queryFn: () => fetchTrackedOrder(orderNumber, phone),
      })
      rememberOrderPhone(orderNumber, phone)
      navigate(`/order/${orderNumber}`)
    } catch (error) {
      if (isApiError(error) && (error.status === 404 || error.code === 'VALIDATION_ERROR')) {
        setFormError('We couldn’t find an order with that number and phone. Check both and try again.')
      } else if (isApiError(error) && error.status === 429) {
        setFormError('Too many attempts. Please wait a minute and try again.')
      } else {
        setFormError(errorMessage(error))
      }
    }
  }

  return (
    <>
      <PageMeta title={'Track your order'} />
    <div className="container-page grid gap-10 py-10 md:py-20 lg:grid-cols-[1fr_28rem] lg:items-center lg:gap-20">
      <div className="max-w-xl">
        <p className="eyebrow mb-3">Order tracking</p>
        <h1 className="text-[2.5rem] leading-[1.05] md:text-6xl">Where are my towels?</h1>
        <p className="mt-5 text-base leading-relaxed text-charcoal-soft md:text-lg">
          Enter your order number and the phone number you ordered with to see its status, pay by mobile money, or send us your payment
          details.
        </p>
        <p className="mt-4 text-sm text-stone">
          Your order number looks like <span className="font-mono text-charcoal">BTZ-261003-4821</span> and is in your confirmation
          message.{' '}
          <Link to="/account" className="underline underline-offset-4 hover:text-charcoal">
            Have an account?
          </Link>
        </p>
      </div>

      <form noValidate onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5 rounded-md border border-sand bg-cream p-6 md:p-8">
        <span className="flex size-11 items-center justify-center rounded-full bg-sand/70" aria-hidden="true">
          <PackageSearch className="size-5" strokeWidth={1.5} />
        </span>
        <Input
          label="Order number"
          placeholder="BTZ-261003-4821"
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
          required
          inputClassName="font-mono uppercase placeholder:normal-case"
          error={errors.orderNumber?.message}
          {...register('orderNumber')}
        />
        <Input
          label="Phone number"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="097 123 4567"
          required
          hint="The number you used at checkout."
          error={errors.phone?.message}
          {...register('phone')}
        />
        {formError && <Alert tone="danger">{formError}</Alert>}
        <Button type="submit" size="lg" fullWidth loading={isSubmitting} loadingText="Finding your order…">
          Track order
        </Button>
      </form>
    </div>
    </>
  )
}
