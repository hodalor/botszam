import { CartDrawer } from '@/components/cart/CartDrawer'
import { AnimatedOutlet } from './AnimatedOutlet'
import { Footer } from './Footer'
import { Header } from './Header'

export function RootLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
        <AnimatedOutlet />
      </main>
      <Footer />
      <CartDrawer />
    </div>
  )
}
