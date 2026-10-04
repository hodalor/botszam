import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useMe } from '@/api/auth'
import { Spinner } from '@/components/ui'

function FullPageSpinner() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center text-stone">
      <Spinner size="lg" label="Checking your session" />
    </div>
  )
}

/** Sends guests to /login, then back to where they were going. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { data: user, isPending } = useMe()
  const location = useLocation()
  if (isPending) return <FullPageSpinner />
  if (!user) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`} replace />
  }
  return children
}

/** UI guard only: the API enforces role=admin on every admin route. */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const { data: user, isPending } = useMe()
  const location = useLocation()
  if (isPending) return <FullPageSpinner />
  if (!user) {
    return (
      <Navigate
        to={`/admin/login?redirect=${encodeURIComponent(location.pathname + location.search)}`}
        replace
      />
    )
  }
  if (user.role !== 'admin') return <Navigate to="/" replace />
  return children
}
