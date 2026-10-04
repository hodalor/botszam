import type { ReactNode } from 'react'

interface AuthShellProps {
  eyebrow: string
  title: string
  description: ReactNode
  children: ReactNode
  footer?: ReactNode
}

export function AuthShell({ eyebrow, title, description, children, footer }: AuthShellProps) {
  return (
    <div className="container-page flex justify-center py-10 md:py-20">
      <div className="w-full max-w-md">
        <p className="eyebrow mb-3 text-center">{eyebrow}</p>
        <h1 className="text-center text-[2.5rem] leading-[1.05] md:text-5xl">{title}</h1>
        <p className="mx-auto mt-4 max-w-sm text-center text-[0.9375rem] leading-relaxed text-charcoal-soft">{description}</p>
        <div className="mt-8 rounded-md border border-sand bg-cream p-6 md:p-8">{children}</div>
        {footer && <div className="mt-6 text-center text-sm text-stone">{footer}</div>}
      </div>
    </div>
  )
}
