import { zodResolver } from '@hookform/resolvers/zod'
import { ShieldCheck } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Alert, Button, Input } from '@/components/ui'
import { zambianPhoneSchema } from '@/lib/phone'

const schema = z.object({ phone: zambianPhoneSchema })

interface VerifyPhoneFormProps {
  orderNumber: string
  error?: string | null
  verifying?: boolean
  onVerify: (phone: string) => void
}

/** Asks for the phone an order was placed with before showing it. */
export function VerifyPhoneForm({ orderNumber, error, verifying, onVerify }: VerifyPhoneFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.input<typeof schema>, unknown, z.output<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { phone: '' },
  })

  return (
    <div className="mx-auto max-w-md rounded-md border border-sand bg-cream p-6 md:p-8">
      <span className="flex size-11 items-center justify-center rounded-full bg-sand/70" aria-hidden="true">
        <ShieldCheck className="size-5" strokeWidth={1.5} />
      </span>
      <h2 className="mt-4 text-2xl">Confirm it’s you</h2>
      <p className="mt-2 text-sm leading-relaxed text-stone">
        To keep your details private, enter the phone number you used for order{' '}
        <span className="font-mono font-medium text-charcoal">{orderNumber}</span>.
      </p>
      <form noValidate onSubmit={handleSubmit(({ phone }) => onVerify(phone))} className="mt-6 flex flex-col gap-4">
        <Input
          label="Phone number"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="097 123 4567"
          required
          error={errors.phone?.message}
          {...register('phone')}
        />
        {error && <Alert tone="danger">{error}</Alert>}
        <Button type="submit" size="lg" fullWidth loading={verifying} loadingText="Checking…">
          View order
        </Button>
      </form>
    </div>
  )
}
