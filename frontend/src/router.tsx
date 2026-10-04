import { createBrowserRouter } from 'react-router-dom'
import { RequireAuth } from '@/components/auth/Guards'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { RootLayout } from '@/components/layout/RootLayout'
import { AccountPage } from '@/pages/AccountPage'
import { AdminCustomersPage } from '@/pages/admin/AdminCustomersPage'
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage'
import { AdminInventoryPage } from '@/pages/admin/AdminInventoryPage'
import { AdminLoginPage } from '@/pages/admin/AdminLoginPage'
import { AdminNotFoundPage } from '@/pages/admin/AdminPages'
import { AdminOrderDetailPage } from '@/pages/admin/AdminOrderDetailPage'
import { AdminOrdersPage } from '@/pages/admin/AdminOrdersPage'
import { AdminPackingSlipPage } from '@/pages/admin/AdminPackingSlipPage'
import { AdminProductFormPage } from '@/pages/admin/AdminProductFormPage'
import { AdminProductsPage } from '@/pages/admin/AdminProductsPage'
import { AdminSettingsPage } from '@/pages/admin/AdminSettingsPage'
import { CartPage } from '@/pages/CartPage'
import { CheckoutPage } from '@/pages/CheckoutPage'
import { HomePage } from '@/pages/HomePage'
import { LoginPage } from '@/pages/LoginPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { OrderPage } from '@/pages/OrderPage'
import { AboutPage, ContactPage, DeliveryReturnsPage } from '@/pages/content/ContentPages'
import { ProductPage } from '@/pages/ProductPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { ShopPage } from '@/pages/ShopPage'
import { TrackPage } from '@/pages/TrackPage'

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'shop', element: <ShopPage /> },
      { path: 'shop/:category', element: <ShopPage /> },
      { path: 'product/:slug', element: <ProductPage /> },
      { path: 'cart', element: <CartPage /> },
      { path: 'checkout', element: <CheckoutPage /> },
      { path: 'order/:orderNumber', element: <OrderPage /> },
      { path: 'track', element: <TrackPage /> },
      {
        path: 'account',
        element: (
          <RequireAuth>
            <AccountPage />
          </RequireAuth>
        ),
      },
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      { path: 'about', element: <AboutPage /> },
      { path: 'delivery', element: <DeliveryReturnsPage /> },
      { path: 'contact', element: <ContactPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  { path: 'admin/login', element: <AdminLoginPage /> },
  {
    path: 'admin',
    element: <AdminLayout />,
    children: [
      { index: true, element: <AdminDashboardPage /> },
      { path: 'orders', element: <AdminOrdersPage /> },
      { path: 'orders/:orderNumber', element: <AdminOrderDetailPage /> },
      { path: 'orders/:orderNumber/print', element: <AdminPackingSlipPage /> },
      { path: 'products', element: <AdminProductsPage /> },
      { path: 'products/new', element: <AdminProductFormPage /> },
      { path: 'products/:id', element: <AdminProductFormPage /> },
      { path: 'inventory', element: <AdminInventoryPage /> },
      { path: 'customers', element: <AdminCustomersPage /> },
      { path: 'settings', element: <AdminSettingsPage /> },
      { path: '*', element: <AdminNotFoundPage /> },
    ],
  },
])
