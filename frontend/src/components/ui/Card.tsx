import type { ComponentProps } from 'react'
import { cn } from '@/lib/cn'

type Padding = 'none' | 'sm' | 'md' | 'lg'

const paddings: Record<Padding, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-5 md:p-6',
  lg: 'p-6 md:p-8',
}

export type CardProps = ComponentProps<'div'> & {
  padding?: Padding
  /** Adds a gentle hover lift for clickable cards. */
  interactive?: boolean
}

export function Card({ padding = 'md', interactive, className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-md border border-sand bg-cream',
        interactive && 'transition-[box-shadow,border-color] duration-300 hover:border-sand-deep hover:shadow-soft',
        paddings[padding],
        className,
      )}
      {...props}
    />
  )
}

export function CardTitle({ className, ...props }: ComponentProps<'h3'>) {
  return <h3 className={cn('font-display text-xl', className)} {...props} />
}

export function CardDescription({ className, ...props }: ComponentProps<'p'>) {
  return <p className={cn('mt-1 text-sm text-stone', className)} {...props} />
}
