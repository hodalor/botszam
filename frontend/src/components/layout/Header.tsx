import { AnimatePresence, motion } from 'framer-motion'
import { Menu, Search, ShoppingBag, User } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useMe } from '@/api/auth'
import { cn } from '@/lib/cn'
import { selectCartCount, useCart } from '@/stores/cart'
import { CollectionsMenu } from './CollectionsMenu'
import { Logo } from './Logo'
import { MobileNav } from './MobileNav'
import { PRIMARY_NAV } from './navigation'
import { SearchDialog } from './SearchDialog'

const iconButton =
  'relative inline-flex size-11 items-center justify-center rounded-md text-terracotta-ink transition-colors hover:bg-coral-soft hover:text-magenta'

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const count = useCart(selectCartCount)
  const openCart = useCart((s) => s.openCart)
  const { data: user } = useMe()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const [shop, ...rest] = PRIMARY_NAV
  const navLink = ({ isActive }: { isActive: boolean }) =>
    cn(
      'relative py-2 text-[0.9375rem] font-medium transition-colors hover:text-magenta',
      'after:absolute after:inset-x-0 after:-bottom-0.5 after:h-[3px] after:origin-left after:rounded-full after:bg-coral after:transition-transform after:duration-300',
      isActive ? 'text-magenta after:scale-x-100' : 'text-charcoal-soft after:scale-x-0 hover:after:scale-x-100',
    )

  return (
    <>
      <a
        href="#main"
        className="sr-only z-[60] rounded-md bg-magenta px-4 py-2 text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>
      <div
        aria-hidden="true"
        className="h-1 bg-gradient-to-r from-peach via-coral to-magenta"
      />
      <header
        className={cn(
          'sticky top-0 z-40 border-b bg-cream/95 backdrop-blur-md transition-[border-color,box-shadow] duration-300 supports-[backdrop-filter]:bg-cream/90',
          scrolled ? 'border-coral/25 shadow-soft' : 'border-coral/15',
        )}
      >
        <div className="container-page flex h-16 items-center gap-2 md:h-20 md:gap-6">
          <button
            type="button"
            className={cn(iconButton, '-ml-2.5 md:hidden')}
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            aria-expanded={menuOpen}
            aria-haspopup="dialog"
          >
            <Menu className="size-5" strokeWidth={1.5} aria-hidden="true" />
          </button>

          <Logo />

          <nav aria-label="Main" className="hidden flex-1 items-center justify-center gap-8 md:flex">
            <NavLink to={shop.to} end className={navLink}>
              {shop.label}
            </NavLink>
            <CollectionsMenu />
            {rest.map((item) => (
              <NavLink key={item.to} to={item.to} className={navLink}>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center md:ml-0 md:-mr-2.5">
            <button
              type="button"
              className={iconButton}
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
              aria-haspopup="dialog"
            >
              <Search className="size-5" strokeWidth={1.5} aria-hidden="true" />
            </button>
            <Link
              to={user ? '/account' : '/login'}
              className={iconButton}
              aria-label={user ? `Account (${user.name})` : 'Sign in'}
            >
              <User className="size-5" strokeWidth={1.5} aria-hidden="true" />
            </Link>
            <button
              type="button"
              className={iconButton}
              onClick={openCart}
              aria-label={`Cart, ${count} ${count === 1 ? 'item' : 'items'}`}
              aria-haspopup="dialog"
            >
              <ShoppingBag className="size-5" strokeWidth={1.5} aria-hidden="true" />
              <AnimatePresence>
                {count > 0 && (
                  <motion.span
                    key={count}
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.6, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 26 }}
                    className="absolute right-1 top-1 flex h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-gradient-to-br from-coral to-magenta px-1 text-[0.6875rem] font-semibold leading-none text-white tabular-nums shadow-soft"
                    aria-hidden="true"
                  >
                    {count > 99 ? '99+' : count}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>
      </header>

      <MobileNav open={menuOpen} onClose={() => setMenuOpen(false)} />
      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  )
}
