import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { useUpdateMe } from '@/api/auth'
import { errorMessage, isApiError } from '@/api/client'
import type { User } from '@/api/types'
import { PasswordInput } from '@/components/auth/PasswordInput'
import { Alert, Button, Input } from '@/components/ui'
import { applyServerFieldErrors, nameSchema, optionalEmailSchema, passwordSchema } from '@/lib/forms'
import { formatPhoneLocal, zambianPhoneSchema } from '@/lib/phone'

const profileSchema = z.object({ name: nameSchema, phone: zambianPhoneSchema, email: optionalEmailSchema })
type ProfileValues = z.output<typeof profileSchema>

export function ProfileForm({ user }: { user: User }) {
  const updateMe = useUpdateMe()
  const [formError, setFormError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<z.input<typeof profileSchema>, unknown, ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user.name, phone: formatPhoneLocal(user.phone), email: user.email ?? '' },
  })

  const onSubmit = async (values: ProfileValues) => {
    setFormError(null)
    try {
      const updated = await updateMe.mutateAsync({ name: values.name, phone: values.phone, email: values.email || null })
      reset({ name: updated.name, phone: formatPhoneLocal(updated.phone), email: updated.email ?? '' })
      toast.success('Your details have been saved')
    } catch (error) {
      if (isApiError(error) && error.code === 'PHONE_TAKEN') {
        setError('phone', { type: 'server', message: error.message }, { shouldFocus: true })
      } else if (isApiError(error) && error.code === 'EMAIL_TAKEN') {
        setError('email', { type: 'server', message: error.message }, { shouldFocus: true })
      } else if (!applyServerFieldErrors(error, setError, { name: 'name', phone: 'phone', email: 'email' })) {
        setFormError(errorMessage(error))
      }
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <Input label="Full name" autoComplete="name" required error={errors.name?.message} {...register('name')} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Input
          label="Phone number"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          required
          error={errors.phone?.message}
          {...register('phone')}
        />
        <Input label="Email" type="email" autoComplete="email" optional error={errors.email?.message} {...register('email')} />
      </div>
      {formError && <Alert tone="danger">{formError}</Alert>}
      <div>
        <Button type="submit" loading={isSubmitting} loadingText="Saving…" disabled={!isDirty}>
          Save details
        </Button>
      </div>
    </form>
  )
}

const passwordFormSchema = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current password'),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, { message: 'The passwords don’t match', path: ['confirmPassword'] })

type PasswordValues = z.output<typeof passwordFormSchema>

export function PasswordForm() {
  const updateMe = useUpdateMe()
  const [formError, setFormError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PasswordValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  })

  const onSubmit = async ({ currentPassword, newPassword }: PasswordValues) => {
    setFormError(null)
    try {
      await updateMe.mutateAsync({ currentPassword, newPassword })
      reset()
      toast.success('Your password has been changed')
    } catch (error) {
      if (isApiError(error) && error.code === 'INVALID_PASSWORD') {
        setError('currentPassword', { type: 'server', message: 'That’s not your current password' }, { shouldFocus: true })
      } else if (!applyServerFieldErrors(error, setError, { currentPassword: 'currentPassword', newPassword: 'newPassword' })) {
        setFormError(errorMessage(error))
      }
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <PasswordInput
        label="Current password"
        autoComplete="current-password"
        required
        error={errors.currentPassword?.message}
        {...register('currentPassword')}
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <PasswordInput
          label="New password"
          autoComplete="new-password"
          required
          hint="At least 8 characters."
          error={errors.newPassword?.message}
          {...register('newPassword')}
        />
        <PasswordInput
          label="Confirm new password"
          autoComplete="new-password"
          required
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />
      </div>
      {formError && <Alert tone="danger">{formError}</Alert>}
      <div>
        <Button type="submit" variant="secondary" loading={isSubmitting} loadingText="Updating…">
          Change password
        </Button>
      </div>
    </form>
  )
}
