import type { ComponentProps, ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router-dom'
import { Spinner } from './Spinner'
import { buttonClasses, type ButtonSize, type ButtonVariant } from './styles'

interface ButtonOwnProps {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  loading?: boolean
  /** Replaces the label while loading, e.g. "Placing order…". */
  loadingText?: ReactNode
  leftIcon?: ReactNode
  rightIcon?: ReactNode
}

export type ButtonProps = ComponentProps<'button'> & ButtonOwnProps

export function Button({
  variant,
  size,
  fullWidth,
  loading = false,
  loadingText,
  leftIcon,
  rightIcon,
  className,
  children,
  disabled,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClasses({ variant, size, fullWidth, className })}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <Spinner size="sm" label={null} /> : leftIcon}
      {loading && loadingText ? loadingText : children}
      {!loading && rightIcon}
      {loading && <span className="sr-only">Loading</span>}
    </button>
  )
}

export type ButtonLinkProps = LinkProps & Omit<ButtonOwnProps, 'loading' | 'loadingText'>

/** A router link styled as a button. */
export function ButtonLink({ variant, size, fullWidth, leftIcon, rightIcon, className, children, ...props }: ButtonLinkProps) {
  return (
    <Link className={buttonClasses({ variant, size, fullWidth, className })} {...props}>
      {leftIcon}
      {children}
      {rightIcon}
    </Link>
  )
}
