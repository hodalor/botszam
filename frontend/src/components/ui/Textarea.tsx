import type { ComponentProps } from 'react'
import { cn } from '@/lib/cn'
import { Field, type FieldProps } from './Field'
import { controlClasses } from './styles'

export type TextareaProps = ComponentProps<'textarea'> & FieldProps & { textareaClassName?: string }

export function Textarea({
  label,
  hideLabel,
  hint,
  error,
  required,
  optional,
  className,
  textareaClassName,
  rows = 4,
  id,
  ...props
}: TextareaProps) {
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
      {({ id: textareaId, describedBy }) => (
        <textarea
          id={textareaId}
          rows={rows}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(controlClasses(Boolean(error)), 'resize-y px-3.5 py-2.5 leading-relaxed', textareaClassName)}
          {...props}
        />
      )}
    </Field>
  )
}
