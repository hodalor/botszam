import { AlertCircle, Info, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ProductImage, QuantityStepper } from '@/components/ui'
import { cn } from '@/lib/cn'
import { MAX_QUANTITY_PER_ITEM } from '@/lib/constants'
import { formatKwacha } from '@/lib/money'
import { useCart, type CartItem } from '@/stores/cart'

export interface CartLineNotice {
  tone: 'info' | 'warning' | 'danger'
  text: string
}

interface CartLineProps {
  item: CartItem
  onNavigate?: () => void
  /** Lower than the default when stock is limited. */
  maxQuantity?: number
  notice?: CartLineNotice
  /** The variant can no longer be bought; quantity controls are disabled. */
  blocked?: boolean
  size?: 'sm' | 'lg'
}

const noticeStyles = {
  info: 'text-info',
  warning: 'text-warning',
  danger: 'text-danger',
}

export function CartLine({ item, onNavigate, maxQuantity = MAX_QUANTITY_PER_ITEM, notice, blocked, size = 'sm' }: CartLineProps) {
  const setQuantity = useCart((s) => s.setQuantity)
  const removeItem = useCart((s) => s.removeItem)
  const NoticeIcon = notice?.tone === 'info' ? Info : AlertCircle

  return (
    <li className={cn('flex gap-4', size === 'lg' ? 'py-6 md:gap-6' : 'py-5')}>
      <Link
        to={`/product/${item.slug}`}
        onClick={onNavigate}
        className={cn(
          'block shrink-0 overflow-hidden rounded-md bg-sand/60',
          size === 'lg' ? 'aspect-[4/5] w-24 md:w-32' : 'size-24',
          blocked && 'opacity-50 grayscale',
        )}
        tabIndex={-1}
        aria-hidden="true"
      >
        <ProductImage
          src={item.image}
          alt=""
          width={size === 'lg' ? 128 : 96}
          height={size === 'lg' ? 160 : 96}
          className="size-full object-cover"
          fallbackClassName="size-full"
        />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link
              to={`/product/${item.slug}`}
              onClick={onNavigate}
              className={cn(
                'block truncate font-display leading-snug hover:underline',
                size === 'lg' ? 'text-lg md:text-xl' : 'text-lg',
              )}
            >
              {item.name}
            </Link>
            <p className="mt-0.5 text-sm text-stone">
              {item.size} · {item.colour}
            </p>
            {size === 'lg' && (
              <p className="mt-1 text-sm text-stone tabular-nums">
                {formatKwacha(item.unitPriceNgwee)} each
              </p>
            )}
          </div>
          <p className={cn('shrink-0 font-medium tabular-nums', size === 'lg' ? 'text-base' : 'text-[0.9375rem]', blocked && 'text-stone line-through')}>
            {formatKwacha(item.unitPriceNgwee * item.quantity)}
          </p>
        </div>

        {notice && (
          <p className={cn('mt-2 flex items-start gap-1.5 text-sm', noticeStyles[notice.tone])} role={notice.tone === 'danger' ? 'alert' : undefined}>
            <NoticeIcon className="mt-0.5 size-4 shrink-0" strokeWidth={1.5} aria-hidden="true" />
            {notice.text}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between pt-3">
          <QuantityStepper
            size="sm"
            value={item.quantity}
            max={Math.max(1, maxQuantity)}
            onChange={(q) => setQuantity(item.key, q)}
            itemLabel={item.name}
            disabled={blocked}
          />
          <button
            type="button"
            onClick={() => removeItem(item.key)}
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-stone transition-colors hover:bg-sand/60 hover:text-charcoal"
          >
            <Trash2 className="size-4" strokeWidth={1.5} aria-hidden="true" />
            Remove<span className="sr-only"> {item.name}</span>
          </button>
        </div>
      </div>
    </li>
  )
}
