/** Response shapes of the botszam API. All money is integer ngwee. */

/** Category slug from the Category collection (e.g. home-use, saloon-use). */
export type ProductCategory = string

export interface StoreCategory {
  id: string
  name: string
  slug: string
  description: string
  imageUrl: string | null
  sortOrder: number
}

export interface AdminCategory {
  _id: string
  name: string
  slug: string
  description: string
  sortOrder: number
  active: boolean
  imageUrl: string | null
}
export type MobileMoneyNetwork = 'MTN' | 'Airtel' | 'Zamtel'
export type PaymentMethod = 'mobile_money' | 'pay_on_delivery'
export type OrderStatus =
  | 'awaiting_payment'
  | 'payment_submitted'
  | 'paid'
  | 'pending_confirmation'
  | 'confirmed'
  | 'processing'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'payment_rejected'
export type InventoryReason = 'order' | 'cancel' | 'restock' | 'adjustment' | 'payment_rejected'

export interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface Paginated<T> {
  items: T[]
  pagination: Pagination
}

/* ---------------------------------------------------------------- Catalogue */

export interface PublicVariant {
  sku: string
  size: string
  colour: string
  colourHex: string | null
  images: { url: string }[]
  priceNgwee: number
  compareAtPriceNgwee: number | null
  inStock: boolean
  lowStock: boolean
  /** Exact count, only sent when the variant is low on stock. */
  stockLeft: number | null
}

export interface PublicProduct {
  id: string
  name: string
  slug: string
  description: string
  /** Empty when the product uses the default care copy. */
  careInstructions: string
  category: ProductCategory
  /** Default / shared gallery (used when a colour has no photos of its own). */
  images: { url: string }[]
  /** Per-colour galleries for the storefront swatches. */
  colourImages: { colour: string; images: { url: string }[] }[]
  featured: boolean
  minPriceNgwee: number | null
  maxPriceNgwee: number | null
  inStock: boolean
  colours: { name: string; hex: string | null }[]
  sizes: string[]
  variants: PublicVariant[]
  createdAt: string
}

export type ProductSort = 'newest' | 'price_asc' | 'price_desc' | 'featured'

export interface ProductFilters {
  category?: ProductCategory
  colour?: string
  size?: string
  minPrice?: number
  maxPrice?: number
  search?: string
  sort?: ProductSort
  page?: number
  limit?: number
}

export interface ProductFacets {
  colours: { name: string; hex: string | null }[]
  sizes: string[]
  minPriceNgwee: number | null
  maxPriceNgwee: number | null
}

export interface DeliveryZone {
  id: string
  name: string
  feeNgwee: number
  estimatedDays: string
}

export interface MobileMoneyAccount {
  network: MobileMoneyNetwork
  number: string
  accountName: string
}

export interface PublicSettings {
  storeName: string
  contactPhone: string
  whatsappNumber: string
  email: string
  mobileMoneyAccounts: MobileMoneyAccount[]
  paymentInstructions: string
}

/* ---------------------------------------------------------------- Auth */

export interface Address {
  _id?: string
  label: string
  zone: string
  area: string
  street: string
  landmark: string
  notes: string
  isDefault: boolean
}

export interface User {
  _id: string
  name: string
  email?: string
  phone: string
  role: 'customer' | 'admin'
  addresses: Address[]
  createdAt: string
  updatedAt: string
}

export interface AuthResponse {
  user: User
  token: string
}

export interface RegisterInput {
  name: string
  email?: string
  phone: string
  password: string
}

export interface LoginInput {
  identifier: string
  password: string
}

export interface UpdateMeInput {
  name?: string
  email?: string | null
  phone?: string
  addresses?: Omit<Address, '_id'>[]
  currentPassword?: string
  newPassword?: string
}

/* ---------------------------------------------------------------- Orders */

export interface OrderItem {
  productId: string
  variantSku: string
  name: string
  size: string
  colour: string
  image: string | null
  unitPriceNgwee: number
  quantity: number
  lineTotalNgwee: number
}

export interface CustomerOrder {
  orderNumber: string
  status: OrderStatus
  paymentMethod: PaymentMethod
  customer: { name: string; phone: string; email: string | null }
  deliveryAddress: { zoneName: string; area: string; street: string; landmark: string; notes: string }
  items: OrderItem[]
  subtotalNgwee: number
  deliveryFeeNgwee: number
  totalNgwee: number
  payment: {
    network: MobileMoneyNetwork | null
    payerPhone: string | null
    transactionRef: string | null
    submittedAt: string | null
    verifiedAt: string | null
    rejectionReason: string | null
  }
  statusHistory: { status: OrderStatus; at: string }[]
  createdAt: string
  updatedAt: string
}

export interface PaymentInstructions {
  method: PaymentMethod
  orderNumber: string
  amountNgwee: number
  accounts: MobileMoneyAccount[]
  message: string
}

export interface OrderWithInstructions {
  order: CustomerOrder
  paymentInstructions: PaymentInstructions | null
}

/** Prices and totals are intentionally absent: the server calculates them. */
export interface CreateOrderInput {
  items: { productId: string; variantSku: string; quantity: number }[]
  customer: { name: string; phone: string; email?: string }
  deliveryAddress: { zoneId: string; area: string; street: string; landmark?: string; notes?: string }
  paymentMethod: PaymentMethod
}

export interface PaymentProofInput {
  phone: string
  network: MobileMoneyNetwork
  payerPhone: string
  transactionRef: string
}

/* ---------------------------------------------------------------- Admin */

export interface AdminVariant {
  _id: string
  sku: string
  size: string
  colour: string
  colourHex?: string
  images?: { url: string; publicId: string | null }[]
  priceNgwee: number
  compareAtPriceNgwee?: number | null
  stock: number
  lowStockThreshold: number
  active: boolean
}

export interface AdminProduct {
  _id: string
  name: string
  slug: string
  description: string
  careInstructions?: string
  category: ProductCategory
  images: { url: string; publicId: string | null }[]
  featured: boolean
  active: boolean
  variants: AdminVariant[]
  createdAt: string
  updatedAt: string
}

export interface AdminProductInput {
  name: string
  slug?: string
  description?: string
  careInstructions?: string
  category: ProductCategory
  featured?: boolean
  active?: boolean
  images?: { url: string; publicId?: string | null }[]
  variants: (Omit<AdminVariant, '_id' | 'stock'> & { stock?: number })[]
}

export interface AdminOrder {
  _id: string
  orderNumber: string
  user: string | { _id: string; name: string; email?: string; phone: string } | null
  customer: { name: string; phone: string; email?: string }
  deliveryAddress: { zone: string; zoneName: string; area: string; street: string; landmark: string; notes: string }
  items: (Omit<OrderItem, 'productId' | 'lineTotalNgwee'> & { product: string })[]
  subtotalNgwee: number
  deliveryFeeNgwee: number
  totalNgwee: number
  paymentMethod: PaymentMethod
  payment: {
    provider: string
    network?: MobileMoneyNetwork
    payerPhone?: string
    transactionRef?: string
    submittedAt?: string
    verifiedAt?: string
    verifiedBy?: string | { _id: string; name: string; email?: string }
    rejectionReason?: string
  }
  status: OrderStatus
  statusHistory?: { status: OrderStatus; at: string; by: null | string | { _id: string; name: string }; note: string }[]
  createdAt: string
  updatedAt: string
}

export interface AdminOrderFilters {
  status?: OrderStatus
  paymentMethod?: PaymentMethod
  from?: string
  to?: string
  search?: string
  page?: number
  limit?: number
}

export type AdminSettableStatus = 'confirmed' | 'processing' | 'out_for_delivery' | 'delivered' | 'cancelled'

export interface LowStockItem {
  productId: string
  productName: string
  slug: string
  productActive: boolean
  variantActive: boolean
  sku: string
  size: string
  colour: string
  stock: number
  lowStockThreshold: number
}

export interface InventoryLog {
  _id: string
  product: { _id: string; name: string; slug: string } | null
  variantSku: string
  change: number
  reason: InventoryReason
  order: { _id: string; orderNumber: string } | null
  user: { _id: string; name: string; email?: string } | null
  note: string
  createdAt: string
}

export interface InventoryLogFilters {
  productId?: string
  variantSku?: string
  reason?: InventoryReason
  orderNumber?: string
  from?: string
  to?: string
  page?: number
  limit?: number
}

export interface InventoryAdjustInput {
  productId: string
  variantSku: string
  change: number
  reason: 'restock' | 'adjustment'
  note?: string
}

export interface AdminDeliveryZone {
  _id: string
  name: string
  feeNgwee: number
  estimatedDays: string
  active: boolean
}

export type AdminSettings = PublicSettings

export interface AdminStats {
  revenue: {
    today: { totalNgwee: number; orders: number }
    month: { totalNgwee: number; orders: number }
  }
  ordersByStatus: Record<OrderStatus, number>
  pendingPaymentVerifications: number
  lowStockVariants: number
}

export interface AdminCustomer {
  _id: string
  name: string
  email: string
  phone: string
  addressCount: number
  orderCount: number
  lastOrderAt: string | null
  createdAt: string
  updatedAt: string
}

export interface AdminCustomerFilters {
  search?: string
  page?: number
  limit?: number
}
