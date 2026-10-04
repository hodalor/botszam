import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Banknote, ShoppingBag, Smartphone } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useMe, useUpdateMe } from '@/api/auth'
import { errorMessage, isApiError } from '@/api/client'
import { useCreateOrder } from '@/api/orders'
import { productKeys } from '@/api/products'
import { useDeliveryZones } from '@/api/store'
import type { Address, User } from '@/api/types'
import { useCartCheck } from '@/components/cart/useCartCheck'
import {
  addressFields,
  CHECKOUT_FIELD_PATHS,
  checkoutSchema,
  NEW_ADDRESS,
  stockIssueFromError,
  toOrderInput,
  type CheckoutFormInput,
  type CheckoutFormValues,
  type StockIssue,
} from '@/components/checkout/checkoutForm'
import { CheckoutSummary } from '@/components/checkout/CheckoutSummary'
import { ButtonLink, ChoiceCard, EmptyState, ErrorState, Input, Select, Spinner, Textarea } from '@/components/ui'
import { toAddressInput } from '@/lib/addresses'
import { applyServerFieldErrors } from '@/lib/forms'
import { formatKwacha } from '@/lib/money'
import { rememberOrderPhone } from '@/lib/orderAccess'
import { formatPhoneLocal } from '@/lib/phone'
import { PageMeta } from '@/components/seo/PageMeta'
import { useCart } from '@/stores/cart'

const MAX_SAVED_ADDRESSES = 10

function defaultAddress(user: User | null | undefined): Address | undefined {
  return user?.addresses.find((a) => a.isDefault) ?? user?.addresses[0]
}

export function CheckoutPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: user, isPending: userPending } = useMe()
  const zones = useDeliveryZones()
  const createOrder = useCreateOrder()
  const updateMe = useUpdateMe()
  const items = useCart((s) => s.items)
  const clearCart = useCart((s) => s.clear)
  const { lines, checking, blocked, subtotalNgwee } = useCartCheck()

  const [stockIssue, setStockIssue] = useState<StockIssue | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [placedOrder, setPlacedOrder] = useState<string | null>(null)
  const submittingRef = useRef(false)
  const summaryRef = useRef<HTMLDivElement>(null)

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutFormInput, unknown, CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      addressChoice: NEW_ADDRESS,
      zoneId: '',
      area: '',
      street: '',
      landmark: '',
      notes: '',
      paymentMethod: undefined,
      saveAddress: false,
    },
  })

  // Prefill from the account once it loads, without overwriting anything the customer already typed.
  const prefilledFor = useRef<string | null>(null)
  useEffect(() => {
    if (!user || prefilledFor.current === user._id) return
    prefilledFor.current = user._id
    const saved = defaultAddress(user)
    reset(
      (current) => ({
        ...current,
        name: current.name || user.name,
        phone: current.phone || formatPhoneLocal(user.phone),
        email: current.email || user.email || '',
        ...(saved && !current.area && !current.street
          ? { addressChoice: saved._id ?? NEW_ADDRESS, ...addressFields(saved) }
          : {}),
      }),
      { keepDirtyValues: true, keepErrors: true },
    )
  }, [user, reset])

  const zoneId = useWatch({ control, name: 'zoneId' })
  const addressChoice = useWatch({ control, name: 'addressChoice' })
  const selectedZone = zones.data?.find((z) => z.id === zoneId)
  const savedAddresses = user?.addresses ?? []
  const usingSaved = addressChoice !== NEW_ADDRESS && savedAddresses.some((a) => a._id === addressChoice)

  const chooseAddress = (choice: string) => {
    const saved = savedAddresses.find((a) => a._id === choice)
    const fields = saved
      ? addressFields(saved)
      : { zoneId: '', area: '', street: '', landmark: '', notes: '' }
    for (const [name, value] of Object.entries(fields)) {
      setValue(name as keyof typeof fields, value, { shouldDirty: true })
    }
  }

  const onSubmit = async (values: CheckoutFormValues) => {
    // RHF already guards re-entry while the handler runs, but a ref also covers fast double taps.
    if (submittingRef.current || blocked) return
    submittingRef.current = true
    setFormError(null)
    setStockIssue(null)
    try {
      const { order } = await createOrder.mutateAsync(toOrderInput(values, items))
      rememberOrderPhone(order.orderNumber, order.customer.phone)
      setPlacedOrder(order.orderNumber)
      if (user && values.saveAddress && !usingSaved) saveAddress(user, values)
      clearCart()
      navigate(`/order/${order.orderNumber}`, { replace: true })
    } catch (error) {
      handleError(error)
      submittingRef.current = false
    }
  }

  const saveAddress = (account: User, values: CheckoutFormValues) => {
    if (account.addresses.length >= MAX_SAVED_ADDRESSES) return
    const address: Omit<Address, '_id'> = {
      label: 'Home',
      zone: values.zoneId,
      area: values.area,
      street: values.street,
      landmark: values.landmark,
      notes: values.notes,
      isDefault: account.addresses.length === 0,
    }
    updateMe.mutate(
      { addresses: [...account.addresses.map(toAddressInput), address] },
      { onError: () => toast.error('Your order was placed, but we couldn’t save the address to your account.') },
    )
  }

  const handleError = (error: unknown) => {
    const issue = stockIssueFromError(error, items)
    if (issue) {
      setStockIssue(issue)
      queryClient.invalidateQueries({ queryKey: productKeys.all })
      summaryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }
    if (isApiError(error) && error.code === 'INVALID_DELIVERY_ZONE') {
      setError('zoneId', { type: 'server', message: 'This zone is no longer available. Please choose another.' }, { shouldFocus: true })
      zones.refetch()
      return
    }
    if (applyServerFieldErrors(error, setError, CHECKOUT_FIELD_PATHS)) return
    setFormError(
      isApiError(error) && error.status === 429
        ? 'Too many attempts. Please wait a minute and try again.'
        : errorMessage(error),
    )
  }

  if (placedOrder) {
    return (
      <div className="container-page flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <Spinner size="lg" label={null} />
        <p className="font-display text-2xl">Order placed — opening your order…</p>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="container-page">
        <EmptyState
          icon={ShoppingBag}
          title="Your cart is empty"
          description="Add a few towels to your cart, then come back here to check out."
          action={<ButtonLink to="/shop">Shop towels</ButtonLink>}
          className="py-20 md:py-28"
        />
      </div>
    )
  }

  const submitting = isSubmitting || createOrder.isPending
  const zoneOptions =
    zones.data?.map((z) => ({
      value: z.id,
      label: `${z.name} — ${z.feeNgwee === 0 ? 'Free' : formatKwacha(z.feeNgwee)}`,
    })) ?? []

  return (
    <>
      <PageMeta title="Checkout" description="Secure checkout — mobile money or pay on delivery across Zambia." path="/checkout" noIndex />
    <div className="container-page">
      <header className="flex flex-wrap items-end justify-between gap-4 pb-8 pt-10 md:pb-12 md:pt-16">
        <div>
          <p className="eyebrow mb-3">Secure checkout</p>
          <h1 className="text-[2.5rem] leading-[1.05] md:text-6xl">Checkout</h1>
        </div>
        <Link to="/cart" className="group inline-flex items-center gap-2 pb-1 text-sm text-charcoal-soft hover:text-charcoal">
          <ArrowLeft className="size-4 transition-transform duration-300 group-hover:-translate-x-0.5" aria-hidden="true" />
          Back to cart
        </Link>
      </header>

      <form noValidate onSubmit={(e) => handleSubmit(onSubmit)(e)} className="grid gap-10 lg:grid-cols-[1fr_26rem] lg:gap-16">
        <div className="flex flex-col gap-12">
          <Section
            step="01"
            title="Contact"
            aside={
              !userPending &&
              !user && (
                <p className="text-sm text-stone">
                  <Link
                    to="/login?redirect=%2Fcheckout"
                    className="font-medium text-charcoal underline underline-offset-4 hover:text-terracotta-ink"
                  >
                    Log in for faster checkout
                  </Link>
                  <span className="block text-xs sm:inline sm:pl-1.5">or continue as a guest</span>
                </p>
              )
            }
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <Input
                label="Full name"
                autoComplete="name"
                required
                className="sm:col-span-2"
                error={errors.name?.message}
                {...register('name')}
              />
              <Input
                label="Phone number"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="097 123 4567"
                required
                hint="We’ll call or WhatsApp you about delivery."
                error={errors.phone?.message}
                {...register('phone')}
              />
              <Input
                label="Email"
                type="email"
                autoComplete="email"
                optional
                hint="For your order confirmation."
                error={errors.email?.message}
                {...register('email')}
              />
            </div>
          </Section>

          <Section step="02" title="Delivery">
            {savedAddresses.length > 0 && (
              <fieldset className="mb-6">
                <legend className="mb-3 text-sm font-medium">Deliver to</legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  {savedAddresses.map((address) => {
                    const zone = zones.data?.find((z) => z.id === address.zone)
                    return (
                      <ChoiceCard
                        key={address._id}
                        value={address._id}
                        title={address.label || 'Saved address'}
                        description={
                          <>
                            {address.street}, {address.area}
                            <span className="block text-xs">
                              {zone ? zone.name : zones.isPending ? '…' : 'Zone no longer available'}
                            </span>
                          </>
                        }
                        disabled={zones.isSuccess && !zone}
                        {...register('addressChoice', { onChange: (e) => chooseAddress(e.target.value) })}
                      />
                    )
                  })}
                  <ChoiceCard
                    value={NEW_ADDRESS}
                    title="A different address"
                    description="Enter a new delivery address."
                    {...register('addressChoice', { onChange: (e) => chooseAddress(e.target.value) })}
                  />
                </div>
              </fieldset>
            )}

            {!usingSaved && (
              <div className="grid gap-5 sm:grid-cols-2">
                {zones.isError ? (
                  <ErrorState
                    compact
                    className="sm:col-span-2"
                    title="We couldn’t load delivery zones"
                    error={zones.error}
                    onRetry={() => zones.refetch()}
                    retrying={zones.isFetching}
                  />
                ) : (
                  <Select
                    label="Delivery zone"
                    required
                    className="sm:col-span-2"
                    placeholder={zones.isPending ? 'Loading delivery zones…' : 'Choose your zone'}
                    disabled={zones.isPending}
                    options={zoneOptions}
                    hint={selectedZone ? `Estimated delivery: ${selectedZone.estimatedDays.toLowerCase()}.` : 'The delivery fee depends on your zone.'}
                    error={errors.zoneId?.message}
                    {...register('zoneId')}
                  />
                )}
                <Input
                  label="Area / neighbourhood"
                  autoComplete="address-level3"
                  placeholder="e.g. Kabulonga"
                  required
                  error={errors.area?.message}
                  {...register('area')}
                />
                <Input
                  label="Street & house number"
                  autoComplete="street-address"
                  placeholder="e.g. Plot 12, Lukasu Road"
                  required
                  error={errors.street?.message}
                  {...register('street')}
                />
                <Input
                  label="Nearest landmark"
                  optional
                  placeholder="e.g. Opposite Kabulonga Mall"
                  className="sm:col-span-2"
                  error={errors.landmark?.message}
                  {...register('landmark')}
                />
                <Textarea
                  label="Delivery notes"
                  optional
                  rows={3}
                  placeholder="e.g. Call when you reach the gate"
                  className="sm:col-span-2"
                  error={errors.notes?.message}
                  {...register('notes')}
                />
                {user && !usingSaved && savedAddresses.length < MAX_SAVED_ADDRESSES && (
                  <label className="flex items-center gap-2.5 text-sm text-charcoal-soft sm:col-span-2">
                    <input type="checkbox" className="size-4 accent-charcoal" {...register('saveAddress')} />
                    Save this address to my account
                  </label>
                )}
              </div>
            )}

            {usingSaved && selectedZone && (
              <p className="mt-4 text-sm text-stone">
                Delivery to {selectedZone.name}: {selectedZone.feeNgwee === 0 ? 'free' : formatKwacha(selectedZone.feeNgwee)}, estimated{' '}
                {selectedZone.estimatedDays.toLowerCase()}.
              </p>
            )}
            {usingSaved && (errors.zoneId || errors.area || errors.street) && (
              <p className="mt-3 text-sm text-danger" role="alert">
                This saved address is incomplete. Choose “A different address” to enter it again.
              </p>
            )}
          </Section>

          <Section step="03" title="Payment">
            <fieldset aria-describedby={errors.paymentMethod ? 'payment-error' : undefined}>
              <legend className="sr-only">Payment method</legend>
              <div className="grid gap-3">
                <ChoiceCard
                  value="mobile_money"
                  title="Mobile Money (MTN / Airtel / Zamtel)"
                  description="Pay from your phone. After you place the order we’ll show you our numbers and the exact amount."
                  icon={<Smartphone className="size-7" strokeWidth={1.25} aria-hidden="true" />}
                  className="md:p-6"
                  {...register('paymentMethod')}
                />
                <ChoiceCard
                  value="pay_on_delivery"
                  title="Pay on Delivery"
                  description="Pay in cash or by mobile money when your towels arrive. We’ll call to confirm before we deliver."
                  icon={<Banknote className="size-7" strokeWidth={1.25} aria-hidden="true" />}
                  className="md:p-6"
                  {...register('paymentMethod')}
                />
              </div>
              {errors.paymentMethod && (
                <p id="payment-error" className="mt-2 text-xs font-medium text-danger" role="alert">
                  {errors.paymentMethod.message}
                </p>
              )}
            </fieldset>
          </Section>
        </div>

        <div ref={summaryRef} className="scroll-mt-24">
          <CheckoutSummary
            lines={lines}
            subtotalNgwee={subtotalNgwee}
            zone={selectedZone}
            checking={checking}
            stockIssue={stockIssue}
            formError={formError}
            submitting={submitting}
            submitDisabled={blocked || submitting}
          />
        </div>
      </form>
    </div>
    </>
  )
}

function Section({ step, title, aside, children }: { step: string; title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section aria-labelledby={`checkout-${step}`} className="border-t border-sand pt-8">
      <div className="mb-6 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h2 id={`checkout-${step}`} className="flex items-baseline gap-3 text-2xl md:text-[1.75rem]">
          <span className="font-sans text-xs font-medium tracking-[0.16em] text-stone">{step}</span>
          {title}
        </h2>
        {aside}
      </div>
      {children}
    </section>
  )
}
