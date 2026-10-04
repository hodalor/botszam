import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useCategories } from '@/api/store'
import { cn } from '@/lib/cn'

/** Desktop disclosure menu listing the collections. */
export function CollectionsMenu() {
  const [open, setOpen] = useState(false)
  const panelId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const { pathname } = useLocation()
  const active = pathname.startsWith('/shop/')
  const { data: categories = [] } = useCategories()

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        buttonRef.current?.focus()
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div
      ref={rootRef}
      className="relative"
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOpen(false)
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'inline-flex items-center gap-1 py-2 text-[0.9375rem] font-medium transition-colors hover:text-magenta',
          active || open ? 'text-magenta' : 'text-charcoal-soft',
        )}
      >
        Collections
        <ChevronDown
          className={cn('size-4 transition-transform duration-300', open && 'rotate-180')}
          aria-hidden="true"
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            id={panelId}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="absolute left-1/2 top-full z-50 mt-3 w-[34rem] -translate-x-1/2 rounded-md border-2 border-coral/30 bg-cream p-3 shadow-lift"
          >
            <ul className="grid grid-cols-2 gap-1">
              {categories.map((c) => (
                <li key={c.slug}>
                  <Link
                    to={`/shop/${c.slug}`}
                    onClick={() => setOpen(false)}
                    className="block rounded-md px-4 py-3 transition-colors hover:bg-coral-soft"
                  >
                    <span className="block font-display text-lg text-magenta">{c.name}</span>
                    <span className="mt-0.5 block text-sm text-stone">{c.description}</span>
                  </Link>
                </li>
              ))}
            </ul>
            <Link
              to="/shop"
              onClick={() => setOpen(false)}
              className="mt-2 block rounded-md border-t border-coral/25 px-4 pb-1 pt-3 text-sm font-medium text-magenta hover:underline"
            >
              Shop everything →
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
