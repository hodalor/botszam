import { CloudOff, RotateCw } from 'lucide-react'
import { errorMessage } from '@/api/client'
import { Button } from './Button'
import { EmptyState } from './EmptyState'

interface ErrorStateProps {
  title?: string
  error?: unknown
  onRetry?: () => void
  retrying?: boolean
  compact?: boolean
  className?: string
}

/** Friendly failure state for a query, with a retry button. */
export function ErrorState({
  title = 'Something went wrong',
  error,
  onRetry,
  retrying,
  compact,
  className,
}: ErrorStateProps) {
  return (
    <div role="alert" className={className}>
      <EmptyState
        icon={CloudOff}
        compact={compact}
        title={title}
        description={error ? errorMessage(error) : 'Please check your connection and try again.'}
        action={
          onRetry && (
            <Button
              variant="secondary"
              onClick={onRetry}
              loading={retrying}
              leftIcon={<RotateCw className="size-4" aria-hidden="true" />}
            >
              Try again
            </Button>
          )
        }
      />
    </div>
  )
}
