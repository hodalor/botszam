import type { CustomerOrder } from '@/api/types'
import { ProductImage } from '@/components/ui'
import { formatKwacha } from '@/lib/money'
import { formatPhoneLocal } from '@/lib/phone'

export function OrderDetails({ order }: { order: CustomerOrder }) {
  const { deliveryAddress: address, customer } = order
  return (
    <section aria-labelledby="order-items" className="rounded-md border border-sand bg-cream p-5 md:p-7">
      <h2 id="order-items" className="text-2xl">
        Your order
      </h2>
      <ul className="mt-5 divide-y divide-sand border-y border-sand">
        {order.items.map((item) => (
          <li key={item.variantSku} className="flex gap-4 py-4">
            <div className="aspect-[4/5] w-16 shrink-0 overflow-hidden rounded-md bg-sand/60">
              <ProductImage
                src={item.image}
                alt={item.name}
                width={64}
                height={80}
                className="size-full object-cover"
                fallbackClassName="size-full"
              />
            </div>
            <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-display text-[1.0625rem] leading-snug">{item.name}</p>
                <p className="mt-0.5 text-sm text-stone">
                  {item.size} · {item.colour}
                </p>
                <p className="mt-0.5 text-sm text-stone tabular-nums">
                  {item.quantity} × {formatKwacha(item.unitPriceNgwee)}
                </p>
              </div>
              <p className="shrink-0 text-[0.9375rem] tabular-nums">{formatKwacha(item.lineTotalNgwee)}</p>
            </div>
          </li>
        ))}
      </ul>

      <dl className="mt-5 flex flex-col gap-3 text-[0.9375rem]">
        <div className="flex justify-between gap-4">
          <dt className="text-charcoal-soft">Subtotal</dt>
          <dd className="tabular-nums">{formatKwacha(order.subtotalNgwee)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-charcoal-soft">Delivery · {address.zoneName}</dt>
          <dd className="tabular-nums">{order.deliveryFeeNgwee === 0 ? 'Free' : formatKwacha(order.deliveryFeeNgwee)}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-4 border-t border-sand pt-4">
          <dt className="font-medium">Total</dt>
          <dd className="font-display text-2xl tabular-nums">{formatKwacha(order.totalNgwee)}</dd>
        </div>
      </dl>

      <div className="mt-7 grid gap-6 border-t border-sand pt-6 text-sm sm:grid-cols-2">
        <div>
          <h3 className="eyebrow mb-2">Delivering to</h3>
          <p className="leading-relaxed text-charcoal">
            {address.street}
            <br />
            {address.area}, {address.zoneName}
            {address.landmark && (
              <>
                <br />
                <span className="text-stone">Near {address.landmark}</span>
              </>
            )}
          </p>
          {address.notes && <p className="mt-2 text-stone">“{address.notes}”</p>}
        </div>
        <div>
          <h3 className="eyebrow mb-2">Contact</h3>
          <p className="leading-relaxed text-charcoal">
            {customer.name}
            <br />
            {formatPhoneLocal(customer.phone)}
            {customer.email && (
              <>
                <br />
                {customer.email}
              </>
            )}
          </p>
          <p className="mt-2 text-stone">{order.paymentMethod === 'mobile_money' ? 'Mobile money' : 'Pay on delivery'}</p>
        </div>
      </div>
    </section>
  )
}
