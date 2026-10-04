import { ButtonLink } from '@/components/ui'
import { PageMeta } from '@/components/seo/PageMeta'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'

export function AdminNotFoundPage() {
  return (
    <>
      <PageMeta title={'Not found · Admin'} noIndex />
      <AdminPageHeader title="Page not found" description="This admin page does not exist." />
      <div className="px-4 sm:px-6 md:px-10">
        <ButtonLink to="/admin" variant="secondary">
          Back to dashboard
        </ButtonLink>
      </div>
    </>
  )
}
