import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { z } from 'zod'
import { useLogin, useMe } from '@/api/auth'
import { errorMessage, isApiError } from '@/api/client'
import { PasswordInput } from '@/components/auth/PasswordInput'
import { Alert, Button, Input } from '@/components/ui'
import { Logo } from '@/components/layout/Logo'
import { normalisePhone } from '@/lib/phone'
import { safeRedirect } from '@/lib/redirect'
import { PageMeta } from '@/components/seo/PageMeta'

const loginSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(3, 'Enter your email or phone number')
    .max(200)
    .transform((v) => (v.includes('@') ? v.toLowerCase() : (normalisePhone(v) ?? v))),
  password: z.string().min(1, 'Enter your password').max(200),
})

export function AdminLoginPage() {
  const [params] = useSearchParams()
  const redirect = safeRedirect(params.get('redirect'), '/admin')
  const navigate = useNavigate()
  const { data: user, isPending } = useMe()
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

  if (!isPending && user?.role === 'admin' && !isSubmitting) {
    return <Navigate to={redirect.startsWith('/admin') ? redirect : '/admin'} replace />
  }

  if (!isPending && user && user.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  const onSubmit = async (values: z.output<typeof loginSchema>) => {
    setFormError(null)
    try {
      const { user: signedIn } = await login.mutateAsync(values)
      if (signedIn.role !== 'admin') {
        setFormError('This account does not have admin access.')
        return
      }
      navigate(redirect.startsWith('/admin') ? redirect : '/admin', { replace: true })
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

  return (
    <>
      <PageMeta title={'Admin sign in'} noIndex />
    <div className="flex min-h-dvh flex-col bg-linen">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#E6DCCF_0%,_transparent_55%)]" aria-hidden="true" />
      <div className="relative mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-12">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo />
          <p className="eyebrow mt-6">Staff only</p>
          <h1 className="mt-2 text-3xl">Admin sign in</h1>
          <p className="mt-2 text-sm text-stone">Manage orders, stock and store settings.</p>
        </div>

        <form
          noValidate
          onSubmit={(e) => void handleSubmit(onSubmit)(e)}
          className="rounded-md border border-sand bg-cream p-6 shadow-soft"
        >
          <div className="flex flex-col gap-4">
            <Input
              label="Email or phone"
              autoComplete="username"
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
          </div>
        </form>

        <p className="mt-6 text-center text-sm text-stone">
          <Link to="/" className="underline underline-offset-4 hover:text-charcoal">
            Back to store
          </Link>
        </p>
      </div>
    </div>
    </>
  )
}
