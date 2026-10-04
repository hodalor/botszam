import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { Field, type FieldProps } from './Field'
import { controlClasses } from './styles'

export type InputProps = Omit<ComponentProps<'input'>, 'size'> &
  FieldProps & {
    leftIcon?: ReactNode
    rightSlot?: ReactNode
    inputClassName?: string
  }

export function Input({
  label,
  hideLabel,
  hint,
  error,
  required,
  optional,
  className,
  inputClassName,
  leftIcon,
  rightSlot,
  id,
  ...props
}: InputProps) {
  return (
    <Field
      id={id}
      label={label}
      hideLabel={hideLabel}
      hint={hint}
      error={error}
      required={required}
      optional={optional}
      className={className}
    >
      {({ id: inputId, describedBy }) => (
        <div className="relative">
          {leftIcon && (
            <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-stone" aria-hidden="true">
              {leftIcon}
            </span>
          )}
          <input
            id={inputId}
            required={required}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            className={cn(controlClasses(Boolean(error)), 'h-11 px-3.5', leftIcon && 'pl-10', rightSlot && 'pr-11', inputClassName)}
            {...props}
          />
          {rightSlot && <span className="absolute inset-y-0 right-1 flex items-center">{rightSlot}</span>}
        </div>
      )}
    </Field>
  )
}
