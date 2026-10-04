import {
  Boxes,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Settings,
  ShoppingCart,
  Store,
  Users,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useLogout, useMe } from '@/api/auth'
import { RequireAdmin } from '@/components/auth/Guards'
import { cn } from '@/lib/cn'
import { AnimatedOutlet } from './AnimatedOutlet'
import { Logo } from './Logo'

const ADMIN_NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/inventory', label: 'Inventory', icon: Boxes },
  { to: '/admin/customers', label: 'Customers', icon: Users },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
]

function NavItems({ onNavigate }: { onNavigate?: () => void }) {
  const { data: user } = useMe()
  const logout = useLogout()
  const navigate = useNavigate()

  return (
    <>
      <nav aria-label="Admin" className="flex-1 px-3 py-2">
        <ul className="flex flex-col gap-1">
          {ADMIN_NAV.map(({ to, label, icon: Icon, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors',
                    isActive ? 'bg-sand text-charcoal' : 'text-charcoal-soft hover:bg-linen hover:text-charcoal',
                  )
                }
              >
                <Icon className="size-4 shrink-0" strokeWidth={1.5} aria-hidden="true" />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <div className="mt-auto border-t border-sand px-3 py-3">
        <NavLink
          to="/"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-charcoal-soft hover:bg-linen"
        >
          <Store className="size-4" strokeWidth={1.5} aria-hidden="true" />
          View store
        </NavLink>
        <button
          type="button"
          onClick={() =>
            logout.mutate(undefined, {
              onSuccess: () => navigate('/admin/login'),
            })
          }
          className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm text-charcoal-soft hover:bg-linen"
        >
          <LogOut className="size-4" strokeWidth={1.5} aria-hidden="true" />
          Sign out{user ? ` (${user.name.split(' ')[0]})` : ''}
        </button>
      </div>
    </>
  )
}

function Sidebar({ className }: { className?: string }) {
  return (
    <aside className={cn('flex h-full flex-col bg-cream', className)}>
      <div className="flex h-16 items-center justify-between px-5 md:h-20">
        <Logo />
        <span className="eyebrow">Admin</span>
      </div>
      <NavItems />
    </aside>
  )
}

export function AdminLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  const routeKey = location.pathname + location.search
  const [menuRoute, setMenuRoute] = useState(routeKey)
  if (menuOpen && menuRoute !== routeKey) {
    setMenuOpen(false)
    setMenuRoute(routeKey)
  }

  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  return (
    <RequireAdmin>
      <div className="min-h-dvh bg-linen md:grid md:grid-cols-[15rem_1fr]">
        <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-sand bg-cream px-4 print:hidden md:hidden">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setMenuRoute(routeKey)
                setMenuOpen(true)
              }}
              className="inline-flex size-10 items-center justify-center rounded-md text-charcoal hover:bg-sand/60"
              aria-label="Open admin menu"
              aria-expanded={menuOpen}
            >
              <Menu className="size-5" strokeWidth={1.5} />
            </button>
            <Logo />
          </div>
          <span className="eyebrow">Admin</span>
        </div>

        <div className="hidden print:hidden md:sticky md:top-0 md:block md:h-dvh md:border-r md:border-sand">
          <Sidebar />
        </div>

        {menuOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-charcoal/40 backdrop-blur-[2px]"
              aria-label="Close menu"
              onClick={() => setMenuOpen(false)}
            />
            <div className="relative flex h-full w-[min(18rem,88vw)] flex-col bg-cream shadow-lift">
              <div className="flex h-14 items-center justify-between border-b border-sand px-4">
                <span className="eyebrow">Menu</span>
                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  className="inline-flex size-10 items-center justify-center rounded-md hover:bg-sand/60"
                  aria-label="Close admin menu"
                >
                  <X className="size-5" />
                </button>
              </div>
              <NavItems onNavigate={() => setMenuOpen(false)} />
            </div>
          </div>
        )}

        <main id="main" tabIndex={-1} className="min-w-0 pb-[env(safe-area-inset-bottom)] focus:outline-none">
          <AnimatedOutlet />
        </main>
      </div>
    </RequireAdmin>
  )
}
