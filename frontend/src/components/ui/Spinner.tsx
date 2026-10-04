import { cn } from '@/lib/cn'

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  /** Announced to screen readers. Pass null when the parent already announces loading (e.g. a busy button). */
  label?: string | null
}

const sizes = { sm: 'size-4', md: 'size-6', lg: 'size-10' }

export function Spinner({ size = 'md', className, label = 'Loading' }: SpinnerProps) {
  const svg = (
    <svg
      className={cn('animate-spin text-current', sizes[size], className)}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2" />
      <path d="M21.5 12a9.5 9.5 0 0 0-9.5-9.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )

  if (label === null) return svg
  return (
    <span role="status" className="inline-flex items-center">
      {svg}
      <span className="sr-only">{label}</span>
    </span>
  )
}
