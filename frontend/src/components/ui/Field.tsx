import { useId, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

export interface FieldProps {
  label: ReactNode
  /** Visually hide the label but keep it for screen readers. */
  hideLabel?: boolean
  hint?: ReactNode
  error?: string
  required?: boolean
  optional?: boolean
  className?: string
}

export interface FieldIds {
  id: string
  hintId?: string
  errorId?: string
  describedBy?: string
}

/** Shared label / hint / error wrapper so every form control is labelled and described the same way. */
export function Field({
  label,
  hideLabel,
  hint,
  error,
  required,
  optional,
  className,
  id: providedId,
  children,
}: FieldProps & { id?: string; children: (ids: FieldIds) => ReactNode }) {
  const generatedId = useId()
  const id = providedId ?? generatedId
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className={cn('text-sm font-medium text-charcoal', hideLabel && 'sr-only')}>
        {label}
        {required && (
          <span className="ml-0.5 text-terracotta-ink" aria-hidden="true">
            *
          </span>
        )}
        {optional && <span className="ml-1.5 text-xs font-normal text-stone">(optional)</span>}
      </label>
      {children({ id, hintId, errorId, describedBy })}
      {hint && !error && (
        <p id={hintId} className="text-xs text-stone">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-xs font-medium text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}