import { ButtonLink } from '@/components/ui'
import { PageMeta } from '@/components/seo/PageMeta'

export function NotFoundPage() {
  return (
    <>
      <PageMeta title={'Page not found'} />
    <div className="container-page flex flex-col items-center py-24 text-center md:py-32">
      <p className="eyebrow">Error 404</p>
      <h1 className="mt-4 text-5xl md:text-6xl">This page has wandered off.</h1>
      <p className="mt-5 max-w-md text-charcoal-soft">
        The link may be broken or the page may have been moved. Let’s get you somewhere soft.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <ButtonLink to="/">Back to home</ButtonLink>
        <ButtonLink to="/shop" variant="secondary">
          Browse the shop
        </ButtonLink>
      </div>
    </div>
    </>
  )
}
