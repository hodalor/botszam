import { Link } from 'react-router-dom'
import { BRAND_NAME } from '@/lib/constants'
import { cn } from '@/lib/cn'

export function Logo({ className, onClick }: { className?: string; onClick?: () => void }) {
  return (
    <Link
      to="/"
      onClick={onClick}
      className={cn(
        'inline-flex min-h-11 items-center font-display text-[1.6rem] leading-none tracking-tight text-magenta md:text-[1.75rem]',
        className,
      )}
      aria-label={`${BRAND_NAME} home`}
    >
      {BRAND_NAME}
      <span className="text-coral" aria-hidden="true">
        .
      </span>
    </Link>
  )
}
