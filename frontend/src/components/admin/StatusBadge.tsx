import type { OrderStatus } from '@/api/types'
import { Badge } from '@/components/ui'
import { ORDER_STATUS_META } from '@/lib/orderStatus'

export function StatusBadge({ status, size = 'md' }: { status: OrderStatus; size?: 'sm' | 'md' }) {
  const meta = ORDER_STATUS_META[status]
  return (
    <Badge tone={meta.tone} size={size} dot>
      {meta.label}
    </Badge>
  )
}
