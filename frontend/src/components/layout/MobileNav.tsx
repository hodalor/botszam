import { MessageCircle, User } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useMe } from '@/api/auth'
import { useCategories, usePublicSettings } from '@/api/store'
import { Drawer } from '@/components/ui'
import { cn } from '@/lib/cn'
import { FALLBACK_CONTACT } from '@/lib/constants'
import { toWhatsAppNumber } from '@/lib/phone'
import { PRIMARY_NAV } from './navigation'

export function MobileNav({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: user } = useMe()
  const { data: settings } = usePublicSettings()
  const { data: categories = [] } = useCategories()
  const whatsapp = toWhatsAppNumber(settings?.whatsappNumber || FALLBACK_CONTACT.whatsapp)

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'block py-2.5 font-display text-2xl transition-colors',
      isActive ? 'text-magenta' : 'text-charcoal hover:text-magenta',
    )

  return (
    <Drawer open={open} onClose={onClose} side="left" title="Menu">
      <nav aria-label="Mobile" className="flex h-full flex-col px-5 py-6">
        <ul>
          {PRIMARY_NAV.map((item) => (
            <li key={item.to}>
              <NavLink to={item.to} end={item.to === '/shop'} onClick={onClose} className={linkClass}>
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="mt-6 border-t border-coral/25 pt-6">
          <p className="eyebrow mb-3">Collections</p>
          <ul className="grid grid-cols-2 gap-x-4">
            {categories.map((c) => (
              <li key={c.slug}>
                <NavLink
                  to={`/shop/${c.slug}`}
                  onClick={onClose}
                  className={({ isActive }) =>
                    cn('block py-2 text-[0.9375rem]', isActive ? 'text-magenta' : 'text-charcoal-soft')
                  }
                >
                  {c.name}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-auto flex flex-col gap-3 border-t border-coral/25 pt-6">
          <NavLink
            to={user ? '/account' : '/login'}
            onClick={onClose}
            className="inline-flex items-center gap-3 py-1.5 text-[0.9375rem] text-charcoal"
          >
            <User className="size-5" strokeWidth={1.5} aria-hidden="true" />
            {user ? `My account (${user.name.split(' ')[0]})` : 'Sign in or create an account'}
          </NavLink>
          {whatsapp && (
            <a
              href={`https://wa.me/${whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 py-1.5 text-[0.9375rem] text-charcoal"
            >
              <MessageCircle className="size-5" strokeWidth={1.5} aria-hidden="true" />
              Chat with us on WhatsApp
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          )}
        </div>
      </nav>
    </Drawer>
  )
}
