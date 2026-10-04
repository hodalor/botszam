import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { z } from 'zod'
import { useMe, useRegister } from '@/api/auth'
import { errorMessage, isApiError } from '@/api/client'
import { AuthShell } from '@/components/auth/AuthShell'
import { PasswordInput } from '@/components/auth/PasswordInput'
import { Alert, Button, Input } from '@/components/ui'
import { applyServerFieldErrors, nameSchema, optionalEmailSchema, passwordSchema } from '@/lib/forms'
import { zambianPhoneSchema } from '@/lib/phone'
import { safeRedirect } from '@/lib/redirect'
import { PageMeta } from '@/components/seo/PageMeta'

const registerSchema = z.object({
  name: nameSchema,
  phone: zambianPhoneSchema,
  email: optionalEmailSchema,
  password: passwordSchema,
})

type RegisterValues = z.output<typeof registerSchema>

export function RegisterPage() {
  const [params] = useSearchParams()
  const redirect = safeRedirect(params.get('redirect'))
  const navigate = useNavigate()
  const { data: user } = useMe()
  const registerAccount = useRegister()
  const [formError, setFormError] = useState<{ message: string; exists?: boolean } | null>(null)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<z.input<typeof registerSchema>, unknown, RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', phone: '', email: '', password: '' },
  })

  if (user && !isSubmitting) return <Navigate to={redirect} replace />

  const query = params.get('redirect') ? `?redirect=${encodeURIComponent(redirect)}` : ''

  const onSubmit = async ({ email, ...values }: RegisterValues) => {
    setFormError(null)
    try {
      await registerAccount.mutateAsync({ ...values, email: email || undefined })
      navigate(redirect, { replace: true })
    } catch (error) {
      if (isApiError(error) && error.code === 'ACCOUNT_EXISTS') {
        setFormError({ message: 'An account with this phone number or email already exists.', exists: true })
      } else if (!applyServerFieldErrors(error, setError, { name: 'name', phone: 'phone', email: 'email', password: 'password' })) {
        setFormError({
          message:
            isApiError(error) && error.status === 429 ? 'Too many attempts. Please wait a few minutes and try again.' : errorMessage(error),
        })
      }
    }
  }

  return (
    <>
      <PageMeta title={'Create an account'} />
    <AuthShell
      eyebrow="Join botszam"
      title="Create an account"
      description="Save your delivery addresses, check out in seconds and follow every order."
      footer={
        <>
          Already have an account?{' '}
          <Link to={`/login${query}`} className="font-medium text-charcoal underline underline-offset-4">
            Sign in
          </Link>
        </>
      }
    >
      <form noValidate onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
        <Input label="Full name" autoComplete="name" required error={errors.name?.message} {...register('name')} />
        <Input
          label="Phone number"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="097 123 4567"
          required
          hint="You can sign in with this number."
          error={errors.phone?.message}
          {...register('phone')}
        />
        <Input label="Email" type="email" autoComplete="email" optional error={errors.email?.message} {...register('email')} />
        <PasswordInput
          label="Password"
          autoComplete="new-password"
          required
          hint="At least 8 characters."
          error={errors.password?.message}
          {...register('password')}
        />
        {formError && (
          <Alert tone="danger" action={formError.exists && <Link to={`/login${query}`} className="text-sm font-medium text-charcoal underline underline-offset-4">Sign in instead</Link>}>
            {formError.message}
          </Alert>
        )}
        <Button type="submit" size="lg" fullWidth loading={isSubmitting} loadingText="Creating your account…">
          Create account
        </Button>
        <p className="text-center text-xs leading-relaxed text-stone">
          We only use your details for your orders. No spam, ever.
        </p>
      </form>
    </AuthShell>
    </>
  )
}
