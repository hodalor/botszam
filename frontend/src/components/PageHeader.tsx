import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface PageHeaderProps {
  eyebrow?: string
  title: string
  description?: ReactNode
  actions?: ReactNode
  className?: string
}

export function PageHeader({ eyebrow, title, description, actions, className }: PageHeaderProps) {
  return (
    <header className={cn('flex flex-col gap-4 pb-8 pt-10 md:flex-row md:items-end md:justify-between md:pb-12 md:pt-16', className)}>
      <div className="max-w-2xl">
        {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
        <h1 className="text-4xl leading-[1.05] md:text-5xl">{title}</h1>
        {description && <p className="mt-4 text-base leading-relaxed text-charcoal-soft md:text-lg">{description}</p>}
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </header>
  )
}

/** Temporary body for pages that are not built yet. */
export function ComingSoon({ children }: { children?: ReactNode }) {
  return (
    <div className="rounded-md border border-dashed border-sand-deep bg-cream/60 px-6 py-12 text-center text-sm text-stone">
      {children ?? 'This page is coming soon.'}
    </div>
  )
}
