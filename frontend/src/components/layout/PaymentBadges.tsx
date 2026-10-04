import { Truck } from 'lucide-react'
import { cn } from '@/lib/cn'

/** Text-based payment marks (no third-party logos), in the networks' brand colours. */
export function PaymentBadges({ className }: { className?: string }) {
  return (
    <ul className={cn('flex flex-wrap items-center gap-2', className)} aria-label="Payment methods we accept">
      <li className="inline-flex h-8 items-center gap-1.5 rounded-md bg-[#FFCB05] px-3 text-xs font-semibold text-[#1F1D1B]">
        <span className="font-bold">MTN</span> MoMo
      </li>
      <li className="inline-flex h-8 items-center gap-1.5 rounded-md bg-[#E40000] px-3 text-xs font-semibold text-white">
        <span className="font-bold">airtel</span> money
      </li>
      <li className="inline-flex h-8 items-center gap-1.5 rounded-md border border-sand-deep bg-cream px-3 text-xs font-semibold text-charcoal">
        <Truck className="size-3.5" aria-hidden="true" />
        Pay on Delivery
      </li>
    </ul>
  )
}
