import { Mail, MessageCircle, Phone, Truck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useCategories, useDeliveryZones, usePublicSettings } from '@/api/store'
import { BRAND_NAME, FALLBACK_CONTACT } from '@/lib/constants'
import { formatKwacha } from '@/lib/money'
import { formatPhoneLocal, toWhatsAppNumber } from '@/lib/phone'
import { Logo } from './Logo'
import { PaymentBadges } from './PaymentBadges'

const linkClass =
  'inline-flex min-h-11 items-center text-[0.9375rem] text-charcoal-soft transition-colors hover:text-magenta'
const year = new Date().getFullYear()

export function Footer() {
  const { data: settings } = usePublicSettings()
  const { data: zones } = useDeliveryZones()
  const { data: categories = [] } = useCategories()

  const phone = settings?.contactPhone || FALLBACK_CONTACT.phone
  const email = settings?.email || FALLBACK_CONTACT.email
  const whatsapp = toWhatsAppNumber(settings?.whatsappNumber || FALLBACK_CONTACT.whatsapp)
  return (
    <footer className="mt-24 border-t-4 border-coral bg-gradient-to-b from-rose-soft to-linen-deep">
      <div className="container-page grid gap-12 py-14 md:grid-cols-12 md:py-20">
        <div className="md:col-span-4">
          <Logo />
          <p className="mt-4 max-w-xs text-[0.9375rem] leading-relaxed text-charcoal-soft">
            Soft, colourful towels for every room — sourced in Botswana and delivered across Zambia.
          </p>
          {whatsapp && (
            <a
              href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(`Hello ${BRAND_NAME}, I have a question.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex h-11 items-center gap-2 rounded-md bg-gradient-to-r from-coral to-magenta px-4 text-sm font-medium text-white shadow-soft transition-[filter] hover:brightness-105"
            >
              <MessageCircle className="size-4" aria-hidden="true" />
              Chat on WhatsApp
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          )}
        </div>

        <nav aria-label="Shop" className="md:col-span-2">
          <h2 className="eyebrow mb-4 font-sans">Shop</h2>
          <ul className="flex flex-col gap-2.5">
            {categories.map((c) => (
              <li key={c.slug}>
                <Link to={`/shop/${c.slug}`} className={linkClass}>
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Help" className="md:col-span-2">
          <h2 className="eyebrow mb-4 font-sans">Help</h2>
          <ul className="flex flex-col gap-2.5">
            <li>
              <Link to="/track" className={linkClass}>
                Track your order
              </Link>
            </li>
            <li>
              <Link to="/account" className={linkClass}>
                My account
              </Link>
            </li>
            <li>
              <Link to="/about" className={linkClass}>
                About us
              </Link>
            </li>
            <li>
              <Link to="/delivery" className={linkClass}>
                Delivery & returns
              </Link>
            </li>
            <li>
              <Link to="/contact" className={linkClass}>
                Contact
              </Link>
            </li>
          </ul>
        </nav>

        <div className="flex flex-col gap-8 md:col-span-4">
          <section aria-labelledby="footer-contact">
            <h2 id="footer-contact" className="eyebrow mb-4 font-sans">
              Contact
            </h2>
            <ul className="flex flex-col gap-2.5">
              <li>
                <a href={`tel:${phone}`} className={`${linkClass} inline-flex items-center gap-2.5`}>
                  <Phone className="size-4" strokeWidth={1.5} aria-hidden="true" />
                  {formatPhoneLocal(phone)}
                </a>
              </li>
              <li>
                <a href={`mailto:${email}`} className={`${linkClass} inline-flex items-center gap-2.5`}>
                  <Mail className="size-4" strokeWidth={1.5} aria-hidden="true" />
                  {email}
                </a>
              </li>
            </ul>
          </section>

          <section aria-labelledby="footer-delivery">
            <h2 id="footer-delivery" className="eyebrow mb-4 flex items-center gap-2 font-sans">
              <Truck className="size-3.5" aria-hidden="true" />
              Delivery
            </h2>
            {zones && zones.length > 0 ? (
              <ul className="flex flex-col gap-2 text-[0.9375rem] text-charcoal-soft">
                {zones.map((z) => (
                  <li key={z.id} className="flex justify-between gap-4 border-b border-sand/80 pb-2 last:border-0">
                    <span>
                      {z.name}
                      <span className="block text-xs text-stone">{z.estimatedDays}</span>
                    </span>
                    <span className="tabular-nums">{formatKwacha(z.feeNgwee)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[0.9375rem] text-charcoal-soft">
                Same or next-day delivery in Lusaka. Courier to every province.
              </p>
            )}
          </section>
        </div>
      </div>

      <div className="border-t border-coral/25 bg-gradient-to-r from-coral via-blush to-magenta">
        <div className="container-page flex flex-col gap-4 py-5 md:flex-row md:items-center md:justify-between">
          <PaymentBadges />
          <p className="text-xs font-medium text-white/90">
            © {year} {BRAND_NAME}. Prices in Zambian Kwacha.
          </p>
        </div>
      </div>
    </footer>
  )
}
