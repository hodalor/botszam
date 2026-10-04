import { AnimatePresence, motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { useId, useState, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

export interface AccordionItem {
  id: string
  title: ReactNode
  content: ReactNode
}

interface AccordionProps {
  items: AccordionItem[]
  /** Ids of the items open on first render. */
  defaultOpen?: string[]
  className?: string
}

/** Disclosure list: each header is a button controlling its own region; several can be open at once. */
export function Accordion({ items, defaultOpen = [], className }: AccordionProps) {
  const [open, setOpen] = useState(() => new Set(defaultOpen))
  const baseId = useId()

  const toggle = (id: string) =>
    setOpen((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  return (
    <div className={cn('divide-y divide-sand border-y border-sand', className)}>
      {items.map((item) => {
        const isOpen = open.has(item.id)
        const buttonId = `${baseId}-${item.id}-button`
        const panelId = `${baseId}-${item.id}-panel`
        return (
          <div key={item.id}>
            <h3 className="font-sans text-base">
              <button
                type="button"
                id={buttonId}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => toggle(item.id)}
                className="flex w-full items-center justify-between gap-4 py-5 text-left text-[0.9375rem] font-medium tracking-wide text-charcoal focus-visible:outline-offset-[-2px]"
              >
                {item.title}
                <Plus
                  className={cn('size-4 shrink-0 text-stone transition-transform duration-300 ease-calm', isOpen && 'rotate-45')}
                  aria-hidden="true"
                />
              </button>
            </h3>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <div className="pb-6 text-[0.9375rem] leading-relaxed text-charcoal-soft">{item.content}</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}
