import { motion } from 'framer-motion'
import {
  ArrowRight,
  ArrowUpRight,
  ClipboardCheck,
  Droplets,
  HandCoins,
  MessageCircle,
  PackageCheck,
  ShoppingBag,
  Smartphone,
  Sprout,
  Truck,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useFeaturedProducts } from '@/api/products'
import { useCategories } from '@/api/store'
import { ProductRow } from '@/components/product/ProductCard'
import { Reveal } from '@/components/Reveal'
import { ButtonLink, ErrorState } from '@/components/ui'
import { BRAND_NAME } from '@/lib/constants'
import { PHOTOS, unsplash } from '@/lib/imagery'
import { PageMeta } from '@/components/seo/PageMeta'
import { useWhatsAppLink } from '@/lib/useWhatsAppLink'

const ease = [0.22, 1, 0.36, 1] as const

export function HomePage() {
  return (
    <>
      <PageMeta />
      <Hero />
      <CategoryGrid />
      <FeaturedProducts />
      <WhyOurTowels />
      <HowOrderingWorks />
      <Testimonials />
      <WhatsAppBanner />
    </>
  )
}

/* ------------------------------------------------------------------ Hero */

function Hero() {
  return (
    <section aria-labelledby="hero-title" className="relative isolate overflow-hidden bg-charcoal">
      <motion.picture
        initial={{ scale: 1.08 }}
        animate={{ scale: 1 }}
        transition={{ duration: 2.4, ease }}
        className="absolute inset-0 -z-10 block"
      >
        <source media="(min-width: 1024px)" srcSet={unsplash(PHOTOS.hero, 2400, 1350, 'center')} />
        <source media="(min-width: 640px)" srcSet={unsplash(PHOTOS.hero, 1400, 1200, 'left')} />
        <img
          src={unsplash(PHOTOS.hero, 900, 1350, 'left')}
          alt="Folded cotton towels in soft natural light"
          width={900}
          height={1350}
          className="size-full object-cover"
          fetchPriority="high"
          decoding="async"
        />
      </motion.picture>
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-t from-charcoal/75 via-charcoal/25 to-charcoal/5 md:bg-gradient-to-r md:from-charcoal/70 md:via-charcoal/30 md:to-transparent"
      />

      <div className="container-page flex min-h-[calc(100svh-4rem)] flex-col justify-end pb-14 pt-32 md:min-h-[min(calc(100svh-5rem),860px)] md:justify-center md:pb-24">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.3, ease }}
          className="eyebrow !text-linen/80"
        >
          Botswana cotton · Delivered in Zambia
        </motion.p>
        <motion.h1
          id="hero-title"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, delay: 0.45, ease }}
          className="mt-5 max-w-3xl text-[3.25rem] leading-[0.98] !text-linen sm:text-7xl lg:text-[6.5rem]"
        >
          Softness, imported <em className="font-normal italic">from&nbsp;Botswana.</em>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.65, ease }}
          className="mt-6 max-w-md text-base leading-relaxed text-linen/85 md:text-lg"
        >
          Heavyweight, long-staple cotton towels in quiet, earthy tones. Delivered to your door, with pay on
          delivery across Lusaka.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.8, ease }}
          className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-4"
        >
          <ButtonLink to="/shop" size="lg" rightIcon={<ArrowRight className="size-4" aria-hidden="true" />}>
            Shop the collection
          </ButtonLink>
          <Link
            to="/shop/home-use"
            className="group inline-flex items-center gap-2 py-2 text-[0.9375rem] font-medium text-linen focus-visible:outline-linen"
          >
            <span className="border-b border-linen/40 pb-0.5 transition-colors group-hover:border-linen">
              Explore home use
            </span>
          </Link>
        </motion.div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ Categories */

function SectionHeading({
  id,
  eyebrow,
  title,
  link,
}: {
  id: string
  eyebrow: string
  title: string
  link?: { to: string; label: string }
}) {
  return (
    <div className="mb-8 flex items-end justify-between gap-6 md:mb-12">
      <div>
        <p className="eyebrow mb-3">{eyebrow}</p>
        <h2 id={id} className="text-[2rem] leading-tight md:text-5xl">
          {title}
        </h2>
      </div>
      {link && (
        <Link
          to={link.to}
          className="group hidden shrink-0 items-center gap-1.5 pb-1 text-sm font-medium text-charcoal sm:inline-flex"
        >
          <span className="border-b border-charcoal/30 pb-0.5 transition-colors group-hover:border-charcoal">
            {link.label}
          </span>
          <ArrowRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden="true" />
        </Link>
      )}
    </div>
  )
}

function CategoryGrid() {
  const { data: categories = [] } = useCategories()
  const fallbackPhotos = [PHOTOS.hangingTowels, PHOTOS.rolledHandTowels, PHOTOS.beachTowel, PHOTOS.foldedStack, PHOTOS.stackOnRack]

  return (
    <section aria-labelledby="collections" className="container-page pt-20 md:pt-32">
      <SectionHeading
        id="collections"
        eyebrow="Shop by use"
        title="Find the right towel fast"
        link={{ to: '/shop', label: 'Shop everything' }}
      />
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5 md:gap-4">
        {categories.map((cat, i) => {
          const photo = cat.imageUrl || unsplash(fallbackPhotos[i % fallbackPhotos.length]!, 800, 1066)
          return (
            <Reveal as="li" key={cat.slug} delay={i * 0.08}>
              <Link
                to={`/shop/${cat.slug}`}
                className="group relative block aspect-[3/4] overflow-hidden rounded-md bg-rose-soft ring-1 ring-coral/15"
              >
                <img
                  src={photo}
                  alt={cat.name}
                  width={800}
                  height={1066}
                  loading="lazy"
                  decoding="async"
                  className="size-full object-cover transition-transform duration-[1400ms] ease-calm group-hover:scale-[1.06]"
                />
                <span
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-charcoal/70 via-coral/20 to-transparent"
                />
                <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-4 md:p-5">
                  <span>
                    <span className="block font-display text-xl text-linen md:text-[1.5rem]">
                      {cat.name}
                    </span>
                    <span className="mt-1 hidden text-sm text-linen/80 md:block line-clamp-2">{cat.description}</span>
                  </span>
                  <span
                    aria-hidden="true"
                    className="hidden size-10 shrink-0 items-center justify-center rounded-full border border-linen/40 text-linen transition-colors duration-300 group-hover:bg-linen group-hover:text-charcoal md:flex"
                  >
                    <ArrowUpRight className="size-4" />
                  </span>
                </span>
              </Link>
            </Reveal>
          )
        })}
      </ul>
    </section>
  )
}

/* ------------------------------------------------------------------ Featured */

function FeaturedProducts() {
  const featured = useFeaturedProducts()

  return (
    <section aria-labelledby="featured" className="container-page pt-20 md:pt-32">
      <SectionHeading
        id="featured"
        eyebrow="Most loved"
        title="Featured pieces"
        link={{ to: '/shop', label: 'View all towels' }}
      />
      {featured.isError ? (
        <ErrorState
          compact
          title="We couldn’t load our featured towels"
          error={featured.error}
          onRetry={() => featured.refetch()}
          retrying={featured.isFetching}
        />
      ) : featured.data?.length === 0 ? (
        <p className="rounded-md border border-dashed border-sand-deep px-6 py-10 text-center text-stone">
          New pieces are on their way. <Link to="/shop" className="text-terracotta-ink underline underline-offset-4">Browse the shop</Link> in the meantime.
        </p>
      ) : (
        <ProductRow products={featured.data?.slice(0, 4)} loading={featured.isPending} label="Featured products" />
      )}
    </section>
  )
}

/* ------------------------------------------------------------------ Why our towels */

const REASONS = [
  {
    icon: Sprout,
    title: 'Quality cotton',
    text: 'Long-staple cotton spun into dense 600–700 GSM loops. Softer with every wash, never scratchy.',
  },
  {
    icon: Droplets,
    title: 'Real absorbency',
    text: 'Deep, thirsty pile that dries you in one pass, and dries itself quickly on the rail.',
  },
  {
    icon: Truck,
    title: 'Delivered across Lusaka',
    text: 'Same or next-day delivery in Lusaka, and trusted couriers to every province.',
  },
  {
    icon: HandCoins,
    title: 'Pay on delivery',
    text: 'Pay with cash or mobile money when your towels arrive. Or pay ahead with MTN or Airtel.',
  },
]

function WhyOurTowels() {
  return (
    <section aria-labelledby="why" className="pt-20 md:pt-32">
      <div className="container-page grid items-center gap-10 md:grid-cols-12 md:gap-16">
        <Reveal className="md:col-span-5">
          <div className="overflow-hidden rounded-md">
            <img
              src={unsplash(PHOTOS.stackOnRack, 1000, 1250)}
              alt="Folded towels stacked on a wooden bathroom rack"
              loading="lazy"
              decoding="async"
              className="aspect-[4/5] w-full object-cover"
            />
          </div>
        </Reveal>
        <div className="md:col-span-7">
          <p className="eyebrow mb-3">Why our towels</p>
          <h2 id="why" className="max-w-xl text-[2rem] leading-tight md:text-5xl">
            Made to be used, every&nbsp;single&nbsp;day.
          </h2>
          <ul className="mt-10 grid gap-x-10 gap-y-9 sm:grid-cols-2 md:mt-14">
            {REASONS.map(({ icon: Icon, title, text }, i) => (
              <Reveal as="li" key={title} delay={i * 0.08} className="border-t border-sand pt-6">
                <Icon className="size-6 text-terracotta" strokeWidth={1.25} aria-hidden="true" />
                <h3 className="mt-4 text-xl">{title}</h3>
                <p className="mt-2 text-[0.9375rem] leading-relaxed text-charcoal-soft">{text}</p>
              </Reveal>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ How ordering works */

const STEPS = [
  { icon: ShoppingBag, title: 'Choose', text: 'Pick your towels, sizes and colours.' },
  { icon: ClipboardCheck, title: 'Order', text: 'Check out as a guest in under a minute.' },
  { icon: Smartphone, title: 'Pay', text: 'Via MTN MoMo or Airtel Money, or pay on delivery.' },
  { icon: PackageCheck, title: 'Delivered', text: 'To your door, with tracking by order number.' },
]

function HowOrderingWorks() {
  return (
    <section aria-labelledby="how" className="mt-20 border-y border-sand bg-linen-deep md:mt-32">
      <div className="container-page py-16 md:py-24">
        <div className="mb-10 text-center md:mb-16">
          <p className="eyebrow mb-3">How ordering works</p>
          <h2 id="how" className="text-[2rem] leading-tight md:text-5xl">
            Simple, from basket to doorstep
          </h2>
        </div>
        <ol className="relative grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-4 md:gap-8">
          <span
            aria-hidden="true"
            className="absolute left-[12.5%] right-[12.5%] top-7 hidden h-px bg-sand-deep md:block"
          />
          {STEPS.map(({ icon: Icon, title, text }, i) => (
            <Reveal as="li" key={title} delay={i * 0.1} className="relative flex flex-col items-center text-center">
              <span className="relative flex size-14 items-center justify-center rounded-full border border-sand-deep bg-cream text-charcoal">
                <Icon className="size-5" strokeWidth={1.5} aria-hidden="true" />
              </span>
              <span className="mt-5 font-display text-sm italic text-stone" aria-hidden="true">
                0{i + 1}
              </span>
              <h3 className="mt-1 text-xl md:text-2xl">
                <span className="sr-only">Step {i + 1}: </span>
                {title}
              </h3>
              <p className="mt-2 max-w-[15rem] text-sm leading-relaxed text-charcoal-soft">{text}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ Testimonials */

/** Placeholder copy: replace with real customer reviews before launch. */
const TESTIMONIALS = [
  {
    quote: 'The bath sheets feel like a five-star hotel. Delivered to Kabulonga the next morning, and I paid on delivery.',
    name: 'Chipo M.',
    place: 'Lusaka',
  },
  {
    quote: 'Bought the complete set as a wedding gift. Beautifully wrapped, and the sand colour is even nicer in person.',
    name: 'Mwila K.',
    place: 'Ndola',
  },
  {
    quote: 'Three months of washing and they are softer than the day they arrived. Finally towels that actually dry you.',
    name: 'Natasha B.',
    place: 'Lusaka',
  },
]

function Testimonials() {
  return (
    <section aria-labelledby="testimonials" className="container-page pt-20 md:pt-32">
      <SectionHeading id="testimonials" eyebrow="Kind words" title="Loved in Zambian homes" />
      <ul className="-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 [scrollbar-width:none] md:mx-0 md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:px-0 [&::-webkit-scrollbar]:hidden">
        {TESTIMONIALS.map((t, i) => (
          <Reveal
            as="li"
            key={t.name}
            delay={i * 0.08}
            className="w-[85%] shrink-0 snap-start rounded-md border border-sand bg-cream p-7 sm:w-[60%] md:w-auto md:p-9"
          >
            <figure className="flex h-full flex-col">
              <span aria-hidden="true" className="font-display text-5xl leading-none text-terracotta">
                “
              </span>
              <blockquote className="mt-2 flex-1 font-display text-xl leading-snug text-charcoal">
                {t.quote}
              </blockquote>
              <figcaption className="mt-6 text-sm text-stone">
                <span className="font-medium text-charcoal">{t.name}</span> · {t.place}
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </ul>
    </section>
  )
}

/* ------------------------------------------------------------------ WhatsApp */

function WhatsAppBanner() {
  const href = useWhatsAppLink(`Hello ${BRAND_NAME}, I'd like some help choosing towels.`)

  return (
    <section aria-labelledby="whatsapp" className="container-page pt-20 md:pt-32">
      <Reveal className="relative overflow-hidden rounded-md bg-charcoal px-6 py-12 text-linen md:px-16 md:py-16">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-terracotta/25 blur-3xl"
        />
        <div className="relative flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl">
            <p className="eyebrow !text-linen/60">Need a hand?</p>
            <h2 id="whatsapp" className="mt-3 text-3xl leading-tight !text-linen md:text-[2.75rem]">
              Not sure which size or colour? Chat to us on WhatsApp.
            </h2>
            <p className="mt-4 text-[0.9375rem] leading-relaxed text-linen/75">
              Real people in Lusaka, usually replying within the hour, Monday to Saturday.
            </p>
          </div>
          {href && (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-13 shrink-0 items-center justify-center gap-2.5 self-start rounded-md bg-linen px-7 font-medium text-charcoal transition-colors hover:bg-white focus-visible:outline-linen md:self-center"
            >
              <MessageCircle className="size-5" strokeWidth={1.5} aria-hidden="true" />
              Chat on WhatsApp
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          )}
        </div>
      </Reveal>
    </section>
  )
}
