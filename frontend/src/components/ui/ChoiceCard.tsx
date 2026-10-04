import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/lib/cn'

export type ChoiceCardProps = Omit<ComponentProps<'input'>, 'type' | 'title'> & {
  title: ReactNode
  description?: ReactNode
  icon?: ReactNode
  /** Extra content on the right, e.g. a price. */
  aside?: ReactNode
}

/** A large radio option. Works with react-hook-form's register() like a native radio. */
export function ChoiceCard({ title, description, icon, aside, className, ...props }: ChoiceCardProps) {
  return (
    <label
      className={cn(
        'group relative flex cursor-pointer items-start gap-4 rounded-md border border-sand-deep bg-cream p-4 transition-[border-color,background-color,box-shadow] duration-200 md:p-5',
        'hover:border-stone/60 has-[:checked]:border-charcoal has-[:checked]:bg-white has-[:checked]:ring-1 has-[:checked]:ring-charcoal',
        'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-charcoal',
        'has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60',
        className,
      )}
    >
      <input type="radio" className="peer sr-only" {...props} />
      <span
        className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-sand-deep bg-cream transition-colors peer-checked:border-charcoal peer-checked:bg-charcoal"
        aria-hidden="true"
      >
        <span className="size-2 rounded-full bg-cream opacity-0 transition-opacity group-has-[:checked]:opacity-100" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-3">
          <span className="font-medium leading-snug text-charcoal">{title}</span>
          {aside && <span className="shrink-0 text-sm tabular-nums text-charcoal">{aside}</span>}
        </span>
        {description && <span className="mt-1 block text-sm leading-relaxed text-stone">{description}</span>}
      </span>
      {icon && <span className="hidden shrink-0 text-charcoal-soft sm:block">{icon}</span>}
    </label>
  )
}
