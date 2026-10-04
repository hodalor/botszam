import type { ComponentProps } from 'react'
import { cn } from '@/lib/cn'

/** Decorative placeholder. Wrap groups of skeletons in an element with aria-busy for screen readers. */
export function Skeleton({ className, ...props }: ComponentProps<'div'>) {
  return <div aria-hidden="true" className={cn('animate-pulse rounded-md bg-sand/70', className)} {...props} />
}

export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('flex flex-col gap-2', className)} aria-hidden="true">
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} className={cn('h-3.5', i === lines - 1 ? 'w-2/3' : 'w-full')} />
      ))}
    </div>
  )
}
