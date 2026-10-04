import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { usePublicSettings } from '@/api/store'
import { PageHeader } from '@/components/PageHeader'
import { PageMeta } from '@/components/seo/PageMeta'
import { ButtonLink } from '@/components/ui'
import { BRAND_NAME, FALLBACK_CONTACT } from '@/lib/constants'
import { formatPhoneLocal, toWhatsAppNumber } from '@/lib/phone'
import { useWhatsAppLink } from '@/lib/useWhatsAppLink'

function Prose({ children }: { children: ReactNode }) {
  return <div className="mt-10 space-y-5 text-[1.05rem] leading-relaxed text-charcoal-soft">{children}</div>
}

export function AboutPage() {
  return (
    <div className="container-page max-w-3xl pb-20">
      <PageMeta
        title="About"
        description="botszam brings heavyweight cotton towels from Botswana to homes across Zambia — calm, tactile, made for everyday luxury."
        path="/about"
      />
      <PageHeader
        eyebrow="Our story"
        title="From Botswana, for Zambian homes"
        description="We source heavyweight cotton towels in Botswana and bring them to your door anywhere in Zambia."
      />
      <Prose>
        <p>
          {BRAND_NAME} began with a simple wish: bath linen that feels substantial in the hand, dries properly, and
          still looks beautiful after years of washing — without the mark-up of imported boutique brands that never
          quite reach Lusaka.
        </p>
        <p>
          We work with mills in Botswana that weave dense, long-staple cotton terry. The towels are packed and
          shipped to Zambia, where we sell them directly online. No showroom markup, no mystery middlemen — just
          carefully chosen pieces, photographed as they are, priced in Kwacha.
        </p>
        <p>
          Whether you are refreshing a guest bathroom in Kabulonga or sending a housewarming set up the Copperbelt,
          we fold, pack and hand your order to a rider or courier with the same care we would for our own home.
        </p>
        <p>
          Questions about GSM, colours or gift wrapping?{' '}
          <Link to="/contact" className="font-medium text-charcoal underline underline-offset-4">
            Send us a note
          </Link>{' '}
          — we answer on WhatsApp during business hours.
        </p>
      </Prose>
      <div className="mt-10">
        <ButtonLink to="/shop">Shop the collection</ButtonLink>
      </div>
    </div>
  )
}

export function DeliveryReturnsPage() {
  return (
    <div className="container-page max-w-3xl pb-20">
      <PageMeta
        title="Delivery & returns"
        description="Delivery zones and fees across Zambia, plus our calm returns policy for unused towels in original packaging."
        path="/delivery"
      />
      <PageHeader
        eyebrow="Getting your order"
        title="Delivery & returns"
        description="Clear timelines, fair fees, and a returns process that respects both of us."
      />
      <Prose>
        <h2 className="font-display text-2xl text-charcoal">Delivery</h2>
        <p>
          We deliver across Zambia. Lusaka Central is typically same or next day; outskirts take a little longer;
          outside Lusaka we use trusted couriers (usually 2–5 days depending on the route). Exact fees and estimates
          appear at checkout once you choose your zone.
        </p>
        <p>
          You will get an SMS or WhatsApp note when your order is out for delivery. Please keep your phone on — riders
          often call when they are nearby.
        </p>

        <h2 className="mt-10 font-display text-2xl text-charcoal">Pay on delivery</h2>
        <p>
          Prefer to pay when the parcel arrives? Choose Pay on Delivery at checkout. We will call to confirm the order
          before packing. Payment can be cash or mobile money with the rider.
        </p>

        <h2 className="mt-10 font-display text-2xl text-charcoal">Returns & exchanges</h2>
        <p>
          If something is not right — wrong size, a weaving fault, or a colour that does not match the photo — message
          us within 7 days of delivery. Unused items in original packaging can be exchanged or refunded. We cannot
          accept returns on towels that have been washed or used, for hygiene reasons.
        </p>
        <p>
          To start a return, include your order number on{' '}
          <Link to="/contact" className="font-medium text-charcoal underline underline-offset-4">
            Contact
          </Link>{' '}
          or WhatsApp. We will arrange collection in Lusaka or advise the nearest courier drop-off.
        </p>
      </Prose>
      <div className="mt-10 flex flex-wrap gap-3">
        <ButtonLink to="/track">Track an order</ButtonLink>
        <ButtonLink to="/contact" variant="secondary">
          Talk to us
        </ButtonLink>
      </div>
    </div>
  )
}

export function ContactPage() {
  const { data: settings } = usePublicSettings()
  const phone = settings?.contactPhone || FALLBACK_CONTACT.phone
  const email = settings?.email || FALLBACK_CONTACT.email
  const whatsapp = useWhatsAppLink(`Hello ${BRAND_NAME}, I have a question.`)
  const waDigits = toWhatsAppNumber(settings?.whatsappNumber || FALLBACK_CONTACT.whatsapp)

  return (
    <div className="container-page max-w-3xl pb-20">
      <PageMeta
        title="Contact"
        description="Reach botszam by WhatsApp, phone or email. We usually reply within minutes during business hours."
        path="/contact"
      />
      <PageHeader
        eyebrow="Hello"
        title="Contact"
        description="We are a small team. WhatsApp is the fastest way to reach us; email works too."
      />
      <Prose>
        <ul className="space-y-4 not-italic">
          <li>
            <span className="block text-sm text-stone">WhatsApp</span>
            {whatsapp && waDigits ? (
              <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="font-medium text-charcoal underline underline-offset-4">
                {formatPhoneLocal(settings?.whatsappNumber || FALLBACK_CONTACT.whatsapp)}
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            ) : (
              <span>{formatPhoneLocal(FALLBACK_CONTACT.whatsapp)}</span>
            )}
          </li>
          <li>
            <span className="block text-sm text-stone">Phone</span>
            <a href={`tel:${phone}`} className="font-medium text-charcoal underline underline-offset-4">
              {formatPhoneLocal(phone)}
            </a>
          </li>
          <li>
            <span className="block text-sm text-stone">Email</span>
            <a href={`mailto:${email}`} className="font-medium text-charcoal underline underline-offset-4">
              {email}
            </a>
          </li>
        </ul>
        <p className="mt-8">
          Business hours: Monday–Saturday, 08:00–18:00 CAT. Orders placed in the evening are packed the next morning.
        </p>
      </Prose>
      {whatsapp && (
        <div className="mt-10">
          <a
            href={whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 items-center justify-center rounded-md bg-[#1F7A4D] px-6 text-sm font-medium text-white hover:bg-[#186640]"
          >
            Chat on WhatsApp
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </div>
      )}
    </div>
  )
}
