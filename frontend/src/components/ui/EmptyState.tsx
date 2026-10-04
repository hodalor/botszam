import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: ReactNode
  action?: ReactNode
  className?: string
  compact?: boolean
}

export function EmptyState({ icon: Icon, title, description, action, className, compact }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center text-center', compact ? 'gap-3 py-8' : 'gap-4 py-16', className)}>
      {Icon && (
        <span className="flex size-14 items-center justify-center rounded-full bg-sand/70 text-charcoal-soft">
          <Icon className="size-6" strokeWidth={1.5} aria-hidden="true" />
        </span>
      )}
      <div className="max-w-sm">
        <h2 className={cn('font-display', compact ? 'text-xl' : 'text-2xl')}>{title}</h2>
        {description && <p className="mt-2 text-sm leading-relaxed text-stone">{description}</p>}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  )
}
