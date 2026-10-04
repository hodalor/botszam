import { ChevronDown } from 'lucide-react'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/cn'
import { Field, type FieldProps } from './Field'
import { controlClasses } from './styles'

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

export type SelectProps = Omit<ComponentProps<'select'>, 'size'> &
  FieldProps & {
    options?: SelectOption[]
    placeholder?: string
    selectClassName?: string
  }

/** Native select (best on mobile) with consistent styling. */
export function Select({
  label,
  hideLabel,
  hint,
  error,
  required,
  optional,
  className,
  selectClassName,
  options,
  placeholder,
  children,
  id,
  ...props
}: SelectProps) {
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
      {({ id: selectId, describedBy }) => (
        <div className="relative">
          <select
            id={selectId}
            required={required}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            className={cn(controlClasses(Boolean(error)), 'h-11 appearance-none pl-3.5 pr-10', selectClassName)}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options?.map((o) => (
              <option key={o.value} value={o.value} disabled={o.disabled}>
                {o.label}
              </option>
            ))}
            {children}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-stone"
            aria-hidden="true"
          />
        </div>
      )}
    </Field>
  )
}
