import { AlertCircle, CheckCircle2, Info, TriangleAlert, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

type AlertTone = 'info' | 'success' | 'warning' | 'danger'

const tones: Record<AlertTone, { box: string; icon: LucideIcon; iconColour: string }> = {
  info: { box: 'border-info/20 bg-info-soft/60', icon: Info, iconColour: 'text-info' },
  success: { box: 'border-success/20 bg-success-soft/60', icon: CheckCircle2, iconColour: 'text-success' },
  warning: { box: 'border-warning/20 bg-warning-soft/60', icon: TriangleAlert, iconColour: 'text-warning' },
  danger: { box: 'border-danger/20 bg-danger-soft/60', icon: AlertCircle, iconColour: 'text-danger' },
}

interface AlertProps {
  tone?: AlertTone
  title?: ReactNode
  children?: ReactNode
  action?: ReactNode
  className?: string
}

/** Inline message box. Danger alerts are announced to screen readers. */
export function Alert({ tone = 'info', title, children, action, className }: AlertProps) {
  const { box, icon: Icon, iconColour } = tones[tone]
  return (
    <div role={tone === 'danger' ? 'alert' : 'status'} className={cn('flex gap-3 rounded-md border p-4 text-sm', box, className)}>
      <Icon className={cn('mt-0.5 size-[1.125rem] shrink-0', iconColour)} strokeWidth={1.75} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        {title && <p className="font-medium text-charcoal">{title}</p>}
        {children && <div className={cn('leading-relaxed text-charcoal-soft', title && 'mt-1')}>{children}</div>}
        {action && <div className="mt-3 flex flex-wrap gap-2">{action}</div>}
      </div>
    </div>
  )
}
