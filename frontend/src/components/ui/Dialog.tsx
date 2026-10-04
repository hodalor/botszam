import { AnimatePresence, motion, type Variants } from 'framer-motion'
import { X } from 'lucide-react'
import { useEffect, useId, useLayoutEffect, useRef, type ReactNode, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/cn'

const FOCUSABLE =
  'a[href], area[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), [contenteditable="true"]'

let openDialogs = 0

/** Locks page scroll while any dialog is open (handles nested dialogs). */
function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return
    openDialogs++
    const { body, documentElement } = document
    const scrollbar = window.innerWidth - documentElement.clientWidth
    if (openDialogs === 1) {
      body.style.overflow = 'hidden'
      body.style.paddingRight = scrollbar > 0 ? `${scrollbar}px` : ''
    }
    return () => {
      openDialogs--
      if (openDialogs === 0) {
        body.style.overflow = ''
        body.style.paddingRight = ''
      }
    }
  }, [active])
}

/** Keeps Tab focus inside the panel, closes on Escape and restores focus to the trigger on close. */
function useFocusTrap(
  active: boolean,
  panelRef: RefObject<HTMLDivElement | null>,
  onClose: () => void,
  initialFocusRef?: RefObject<HTMLElement | null>,
) {
  const onCloseRef = useRef(onClose)
  useLayoutEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    if (!active) return
    const previouslyFocused = document.activeElement as HTMLElement | null
    const panel = panelRef.current

    const focusFirst = () => {
      const target =
        initialFocusRef?.current ??
        panel?.querySelector<HTMLElement>('[data-autofocus]') ??
        panel?.querySelector<HTMLElement>(FOCUSABLE) ??
        panel
      target?.focus({ preventScroll: true })
    }
    const frame = requestAnimationFrame(focusFirst)

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onCloseRef.current()
        return
      }
      if (event.key !== 'Tab' || !panel) return
      const focusable = [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
        (el) => el.offsetParent !== null || el === document.activeElement,
      )
      if (focusable.length === 0) {
        event.preventDefault()
        panel.focus()
        return
      }
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && (document.activeElement === first || document.activeElement === panel)) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      cancelAnimationFrame(frame)
      document.removeEventListener('keydown', onKeyDown)
      if (previouslyFocused && document.contains(previouslyFocused)) {
        previouslyFocused.focus({ preventScroll: true })
      }
    }
  }, [active, panelRef, initialFocusRef])
}

interface DialogBaseProps {
  open: boolean
  onClose: () => void
  title: ReactNode
  /** Visually hide the title (it is still used as the accessible name). */
  hideTitle?: boolean
  description?: ReactNode
  children: ReactNode
  footer?: ReactNode
  initialFocusRef?: RefObject<HTMLElement | null>
  className?: string
}

const backdrop: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.25 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
}

function DialogShell({
  open,
  onClose,
  title,
  hideTitle,
  description,
  children,
  footer,
  initialFocusRef,
  className,
  panelClassName,
  containerClassName,
  panelVariants,
}: DialogBaseProps & { panelClassName: string; containerClassName: string; panelVariants: Variants }) {
  const panelRef = useRef<HTMLDivElement>(null)
  const titleId = useId()
  const descriptionId = useId()

  useScrollLock(open)
  useFocusTrap(open, panelRef, onClose, initialFocusRef)

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className={cn('fixed inset-0 z-50 flex', containerClassName)}>
          <motion.div
            className="absolute inset-0 bg-charcoal/40 backdrop-blur-[2px]"
            variants={backdrop}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={description ? descriptionId : undefined}
            tabIndex={-1}
            className={cn('relative flex flex-col bg-linen shadow-lift focus:outline-none', panelClassName, className)}
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="flex items-start justify-between gap-4 border-b border-sand px-5 py-4 md:px-6">
              <div className={cn(hideTitle && 'sr-only')}>
                <h2 id={titleId} className="font-display text-xl leading-tight">
                  {title}
                </h2>
                {description && (
                  <p id={descriptionId} className="mt-1 text-sm text-stone">
                    {description}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="-mr-2 -mt-1 ml-auto inline-flex size-10 shrink-0 items-center justify-center rounded-md text-charcoal-soft transition-colors hover:bg-sand/60 hover:text-charcoal"
                aria-label="Close"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto overscroll-contain">{children}</div>
            {footer && <div className="border-t border-sand px-5 py-4 md:px-6">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

const ease = [0.22, 1, 0.36, 1] as const

export type ModalProps = DialogBaseProps & { size?: 'sm' | 'md' | 'lg' }

const modalSizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' }

/** Centered dialog. On small screens it becomes a bottom sheet. */
export function Modal({ size = 'md', ...props }: ModalProps) {
  return (
    <DialogShell
      {...props}
      containerClassName="items-end justify-center sm:items-center sm:p-6"
      panelClassName={cn(
        'max-h-[90dvh] w-full rounded-t-xl sm:rounded-md pb-[env(safe-area-inset-bottom)] sm:pb-0',
        modalSizes[size],
      )}
      panelVariants={{
        hidden: { opacity: 0, y: 24, scale: 0.98 },
        visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.35, ease } },
        exit: { opacity: 0, y: 16, scale: 0.98, transition: { duration: 0.2 } },
      }}
    />
  )
}

export type DrawerProps = DialogBaseProps & { side?: 'left' | 'right'; width?: 'sm' | 'md' }

/** Full-height panel that slides in from the side (navigation, cart). */
export function Drawer({ side = 'right', width = 'md', ...props }: DrawerProps) {
  const offset = side === 'right' ? '100%' : '-100%'
  return (
    <DialogShell
      {...props}
      containerClassName={side === 'right' ? 'justify-end' : 'justify-start'}
      panelClassName={cn(
        'h-dvh w-[88vw] pb-[env(safe-area-inset-bottom)]',
        width === 'sm' ? 'max-w-xs' : 'max-w-md',
      )}
      panelVariants={{
        hidden: { x: offset },
        visible: { x: 0, transition: { duration: 0.4, ease } },
        exit: { x: offset, transition: { duration: 0.28, ease } },
      }}
    />
  )
}
