import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { z } from 'zod'
import { useLogin, useMe } from '@/api/auth'
import { errorMessage, isApiError } from '@/api/client'
import { AuthShell } from '@/components/auth/AuthShell'
import { PasswordInput } from '@/components/auth/PasswordInput'
import { Alert, Button, Input } from '@/components/ui'
import { normalisePhone } from '@/lib/phone'
import { safeRedirect } from '@/lib/redirect'
import { PageMeta } from '@/components/seo/PageMeta'

const loginSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(3, 'Enter your email or phone number')
    .max(200)
    // Phones can be typed in any format; the API matches the normalised +260 form.
    .transform((v) => (v.includes('@') ? v.toLowerCase() : (normalisePhone(v) ?? v))),
  password: z.string().min(1, 'Enter your password').max(200),
})

export function LoginPage() {
  const [params] = useSearchParams()
  const redirect = safeRedirect(params.get('redirect'))
  const navigate = useNavigate()
  const { data: user } = useMe()
  const login = useLogin()
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.input<typeof loginSchema>, unknown, z.output<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: '', password: '' },
  })

  if (user && !isSubmitting) return <Navigate to={redirect} replace />

  const onSubmit = async (values: z.output<typeof loginSchema>) => {
    setFormError(null)
    try {
      await login.mutateAsync(values)
      navigate(redirect, { replace: true })
    } catch (error) {
      setFormError(
        isApiError(error) && error.status === 429
          ? 'Too many sign-in attempts. Please wait a few minutes and try again.'
          : isApiError(error) && error.status === 401
            ? 'That email/phone and password don’t match. Please try again.'
            : errorMessage(error),
      )
    }
  }

  const query = params.get('redirect') ? `?redirect=${encodeURIComponent(redirect)}` : ''

  return (
    <>
      <PageMeta title={'Sign in'} />
    <AuthShell
      eyebrow="Welcome back"
      title="Sign in"
      description="Check out faster with your saved details and see all your orders in one place."
      footer={
        <>
          New to botszam?{' '}
          <Link to={`/register${query}`} className="font-medium text-charcoal underline underline-offset-4">
            Create an account
          </Link>
          {redirect === '/checkout' && (
            <p className="mt-3">
              <Link to="/checkout" className="underline underline-offset-4 hover:text-charcoal">
                Continue as a guest instead
              </Link>
            </p>
          )}
        </>
      }
    >
      <form noValidate onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
        <Input
          label="Email or phone number"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          required
          error={errors.identifier?.message}
          {...register('identifier')}
        />
        <PasswordInput
          label="Password"
          autoComplete="current-password"
          required
          error={errors.password?.message}
          {...register('password')}
        />
        {formError && <Alert tone="danger">{formError}</Alert>}
        <Button type="submit" size="lg" fullWidth loading={isSubmitting} loadingText="Signing in…">
          Sign in
        </Button>
      </form>
    </AuthShell>
    </>
  )
}
