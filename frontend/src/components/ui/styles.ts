import { cn } from '@/lib/cn'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost'
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon'

const buttonBase =
  'relative inline-flex select-none items-center justify-center gap-2 rounded-md font-medium tracking-wide ' +
  'transition-[background-color,border-color,color,transform] duration-200 ease-calm ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-charcoal ' +
  'active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50'

const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-r from-coral to-magenta text-white shadow-soft hover:from-blush hover:to-terracotta-dark',
  secondary:
    'border-2 border-coral/40 bg-rose-soft text-terracotta-ink hover:border-coral hover:bg-coral-soft',
  ghost: 'text-terracotta-ink hover:bg-coral-soft/80',
}

const buttonSizes: Record<ButtonSize, string> = {
  /* min-h-11 keeps ≥44px tap targets on touch devices even when visual height is tighter */
  sm: 'min-h-11 h-9 px-3.5 text-sm',
  md: 'h-11 px-5 text-[0.9375rem]',
  lg: 'h-13 px-7 text-base',
  icon: 'size-11',
}

export function buttonClasses({
  variant = 'primary',
  size = 'md',
  fullWidth,
  className,
}: { variant?: ButtonVariant; size?: ButtonSize; fullWidth?: boolean; className?: string } = {}) {
  return cn(buttonBase, buttonVariants[variant], buttonSizes[size], fullWidth && 'w-full', className)
}

export const controlClasses = (hasError?: boolean) =>
  cn(
    'w-full rounded-md border bg-cream text-[0.9375rem] text-charcoal placeholder:text-stone/70',
    'transition-[border-color,box-shadow] duration-200',
    'focus:outline-none focus-visible:outline-none focus:border-charcoal focus:ring-2 focus:ring-charcoal/10',
    'disabled:cursor-not-allowed disabled:bg-linen-deep disabled:text-stone',
    hasError ? 'border-danger focus:border-danger focus:ring-danger/15' : 'border-sand-deep hover:border-stone/60',
  )
