import { ShoppingBag } from 'lucide-react'
import { ButtonLink, Drawer, EmptyState } from '@/components/ui'
import { formatKwacha } from '@/lib/money'
import { selectCartCount, selectCartSubtotal, useCart } from '@/stores/cart'
import { CartLine } from './CartLine'

export function CartDrawer() {
  const isOpen = useCart((s) => s.isOpen)
  const close = useCart((s) => s.closeCart)
  const items = useCart((s) => s.items)
  const count = useCart(selectCartCount)
  const subtotal = useCart(selectCartSubtotal)

  return (
    <Drawer
      open={isOpen}
      onClose={close}
      side="right"
      title={count > 0 ? `Your cart (${count})` : 'Your cart'}
      footer={
        items.length > 0 && (
          <div className="flex flex-col gap-3">
            <div className="flex items-baseline justify-between">
              <span className="text-[0.9375rem]">Subtotal</span>
              <span className="font-display text-xl tabular-nums">{formatKwacha(subtotal)}</span>
            </div>
            <p className="text-xs text-stone">Delivery fee is added at checkout based on your area.</p>
            <ButtonLink to="/checkout" onClick={close} fullWidth size="lg">
              Checkout
            </ButtonLink>
            <ButtonLink to="/cart" onClick={close} variant="ghost" fullWidth>
              View cart
            </ButtonLink>
          </div>
        )
      }
    >
      {items.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="Your cart is empty"
          description="Soft, heavyweight towels from Botswana are waiting for you."
          action={
            <ButtonLink to="/shop" onClick={close} variant="secondary">
              Start shopping
            </ButtonLink>
          }
          className="px-6"
        />
      ) : (
        <ul className="divide-y divide-sand px-5 md:px-6">
          {items.map((item) => (
            <CartLine key={item.key} item={item} onNavigate={close} />
          ))}
        </ul>
      )}
    </Drawer>
  )
}
