import { ArrowLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

interface AdminPageHeaderProps {
  title: string
  description?: string
  actions?: ReactNode
  backTo?: string
  backLabel?: string
}

export function AdminPageHeader({ title, description, actions, backTo, backLabel = 'Back' }: AdminPageHeaderProps) {
  return (
    <header className="flex flex-col gap-4 px-4 pb-6 pt-6 sm:px-6 md:flex-row md:items-end md:justify-between md:px-10 md:pt-10">
      <div className="min-w-0">
        {backTo && (
          <Link
            to={backTo}
            className="mb-3 inline-flex items-center gap-1.5 text-sm text-stone transition-colors hover:text-charcoal"
          >
            <ArrowLeft className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
            {backLabel}
          </Link>
        )}
        <h1 className="text-3xl md:text-4xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm text-stone">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
    </header>
  )
}
