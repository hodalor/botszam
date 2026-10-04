import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { useLocation, useOutlet } from 'react-router-dom'

/** Keeps the outgoing page rendered while its exit animation plays. */
function FrozenOutlet() {
  const outlet = useOutlet()
  const [frozen] = useState(outlet)
  return frozen
}

/**
 * Animated route transitions. Once the old page has faded out (i.e. after a navigation),
 * scrolls to the top and moves focus to the main landmark so keyboard and screen-reader
 * users start at the new content.
 */
export function AnimatedOutlet() {
  const { pathname } = useLocation()

  return (
    <AnimatePresence
      mode="wait"
      initial={false}
      onExitComplete={() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
        document.getElementById('main')?.focus({ preventScroll: true })
      }}
    >
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } }}
        exit={{ opacity: 0, y: -6, transition: { duration: 0.2, ease: 'easeIn' } }}
      >
        <FrozenOutlet />
      </motion.div>
    </AnimatePresence>
  )
}
