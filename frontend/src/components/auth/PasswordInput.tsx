import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { Input, type InputProps } from '@/components/ui/Input'

export function PasswordInput(props: Omit<InputProps, 'type' | 'rightSlot'>) {
  const [visible, setVisible] = useState(false)
  const Icon = visible ? EyeOff : Eye
  return (
    <Input
      {...props}
      type={visible ? 'text' : 'password'}
      rightSlot={
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="inline-flex size-9 items-center justify-center rounded-md text-stone transition-colors hover:bg-sand/60 hover:text-charcoal"
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
        >
          <Icon className="size-4" strokeWidth={1.75} aria-hidden="true" />
        </button>
      }
    />
  )
}
