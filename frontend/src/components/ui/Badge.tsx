import type { ComponentProps } from 'react'
import { cn } from '@/lib/cn'

export type BadgeTone = 'neutral' | 'sand' | 'accent' | 'success' | 'warning' | 'danger' | 'info' | 'dark'

const tones: Record<BadgeTone, string> = {
  neutral: 'bg-linen-deep text-charcoal-soft ring-charcoal/10',
  sand: 'bg-sand text-charcoal ring-sand-deep',
  accent: 'bg-terracotta-soft text-terracotta-ink ring-terracotta/20',
  success: 'bg-success-soft text-success ring-success/20',
  warning: 'bg-warning-soft text-warning ring-warning/20',
  danger: 'bg-danger-soft text-danger ring-danger/20',
  info: 'bg-info-soft text-info ring-info/20',
  dark: 'bg-charcoal text-linen ring-charcoal',
}

export type BadgeProps = ComponentProps<'span'> & {
  tone?: BadgeTone
  size?: 'sm' | 'md'
  dot?: boolean
}

export function Badge({ tone = 'neutral', size = 'md', dot, className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full font-medium ring-1 ring-inset',
        size === 'sm' ? 'px-2 py-0.5 text-[0.6875rem]' : 'px-2.5 py-1 text-xs',
        tones[tone],
        className,
      )}
      {...props}
    >
      {dot && <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />}
      {children}
    </span>
  )
}
