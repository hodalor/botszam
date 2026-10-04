import { LogOut } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { useLogout, useMe } from '@/api/auth'
import { AddressBook } from '@/components/account/AddressBook'
import { OrderHistory } from '@/components/account/OrderHistory'
import { PasswordForm, ProfileForm } from '@/components/account/ProfileForms'
import { Button } from '@/components/ui'
import { cn } from '@/lib/cn'
import { PageMeta } from '@/components/seo/PageMeta'

const TABS = [
  { id: 'orders', label: 'Orders' },
  { id: 'addresses', label: 'Addresses' },
  { id: 'profile', label: 'Profile' },
] as const

type TabId = (typeof TABS)[number]['id']

export function AccountPage() {
  const { data: user } = useMe()
  const logout = useLogout()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const requested = params.get('tab')
  const tab: TabId = TABS.some((t) => t.id === requested) ? (requested as TabId) : 'orders'

  // RequireAuth only renders this page for signed-in users.
  if (!user) return null

  const selectTab = (id: TabId) => setParams(id === 'orders' ? {} : { tab: id }, { replace: true })

  return (
    <>
      <PageMeta title="My account" path="/account" noIndex />
    <div className="container-page">
      <header className="flex flex-wrap items-end justify-between gap-4 pb-8 pt-10 md:pb-10 md:pt-16">
        <div>
          <p className="eyebrow mb-3">My account</p>
          <h1 className="text-[2.5rem] leading-[1.05] md:text-6xl">Hello, {user.name.split(' ')[0]}</h1>
        </div>
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<LogOut className="size-4" strokeWidth={1.75} aria-hidden="true" />}
          loading={logout.isPending}
          onClick={() =>
            logout.mutate(undefined, {
              onSuccess: () => {
                toast.success('You’ve been signed out')
                navigate('/')
              },
            })
          }
        >
          Sign out
        </Button>
      </header>

      <div role="tablist" aria-label="Account sections" className="flex gap-6 border-b border-sand">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls={`panel-${t.id}`}
            tabIndex={tab === t.id ? 0 : -1}
            onClick={() => selectTab(t.id)}
            onKeyDown={(e) => {
              if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
              const index = TABS.findIndex((x) => x.id === tab)
              const next = TABS[(index + (e.key === 'ArrowRight' ? 1 : TABS.length - 1)) % TABS.length]
              selectTab(next.id)
              document.getElementById(`tab-${next.id}`)?.focus()
            }}
            className={cn(
              '-mb-px border-b-2 pb-3 text-[0.9375rem] transition-colors',
              tab === t.id ? 'border-charcoal font-medium text-charcoal' : 'border-transparent text-stone hover:text-charcoal',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="max-w-4xl py-8 md:py-10">
        {tab === 'orders' && <OrderHistory />}
        {tab === 'addresses' && <AddressBook user={user} />}
        {tab === 'profile' && (
          <div className="flex flex-col gap-12">
            <section aria-labelledby="details-heading">
              <h2 id="details-heading" className="mb-5 text-2xl">
                Your details
              </h2>
              <ProfileForm key={user.updatedAt} user={user} />
            </section>
            <section aria-labelledby="password-heading" className="border-t border-sand pt-10">
              <h2 id="password-heading" className="mb-5 text-2xl">
                Password
              </h2>
              <PasswordForm />
            </section>
          </div>
        )}
      </div>
    </div>
    </>
  )
}
