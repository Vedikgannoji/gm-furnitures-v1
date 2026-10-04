export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock'

export interface ColorOption {
  name: string
  hex: string
}

export interface ProductDimensions {
  width: string
  depth: string
  height: string
  seatHeight?: string
  weight?: string
}

export interface SpecificationItem {
  label: string
  value: string
}

export interface Product {
  id: string
  slug: string
  name: string
  sku: string
  category: string
  collection: string
  room: string
  price: number
  mrp: number
  discount?: number
  description: string
  shortDescription?: string
  images: string[]
  colors: ColorOption[]
  dimensions: ProductDimensions
  material: string
  finish?: string
  stock: number
  threshold?: number
  stockStatus: StockStatus
  featured?: boolean
  bestSeller?: boolean
  newArrival?: boolean
  rating: number
  reviewCount: number
  tags: string[]
  specifications: SpecificationItem[]
  careInstructions: string[]
  leadTime: string
  warranty: string
  status?: 'published' | 'draft' | 'archived'
}

export interface Category {
  id: string
  slug: string
  name: string
  description: string
  image: string
  itemCount: number
}

export interface Room {
  id: string
  slug: string
  name: string
  tagline: string
  description: string
  image: string
  featuredProductIds: string[]
  comingSoon?: boolean
}

export interface Collection {
  id: string
  slug: string
  name: string
  tagline: string
  description: string
  image: string
  productCount: number
}

export interface CartItem {
  id?: string
  product: Product
  quantity: number
  selectedColor?: string
}

export interface ShippingAddress {
  fullName: string
  streetAddress: string
  apartment?: string
  city: string
  state: string
  pincode: string
  phone: string
  isDefault?: boolean
}

export interface OrderItem {
  productId: string
  name: string
  sku: string
  price: number
  quantity: number
  selectedColor?: string
  image: string
}

export interface OrderTimelineStep {
  status: string
  date: string
  description: string
  completed: boolean
  current?: boolean
}

export type OrderStatus = 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
export type PaymentStatus = 'paid' | 'pending' | 'failed'

export interface Order {
  id: string
  orderNumber: string
  date: string
  customer: {
    id?: string
    name: string
    email: string
    phone: string
  }
  items: OrderItem[]
  subtotal: number
  tax: number
  shipping: number
  total: number
  paymentMethod: 'credit_card' | 'upi' | 'net_banking' | 'cash_on_delivery'
  paymentStatus: PaymentStatus
  status: OrderStatus
  shippingAddress: ShippingAddress
  timeline: OrderTimelineStep[]
}

export interface Customer {
  id: string
  name: string
  email: string
  phone: string
  totalOrders: number
  totalSpent: number
  lastOrderDate: string
  status: 'active' | 'inactive'
  joinedDate: string
  addresses: ShippingAddress[]
}

export interface Invoice {
  id: string
  invoiceNumber: string
  orderId: string
  orderNumber: string
  customerName: string
  customerEmail: string
  date: string
  dueDate: string
  hsnCode: string
  taxableAmount: number
  cgst: number
  sgst: number
  totalAmount: number
  status: 'paid' | 'issued' | 'overdue'
}

export interface StoreSettings {
  storeName: string
  brandTagline: string
  supportEmail: string
  supportPhone: string
  registeredAddress: string
  gstin: string
  pan: string
  currency: string
  freeShippingThreshold: number
  standardShippingFee: number
  whiteGloveAssemblyFee: number
  orderNotificationEmail: string
  enableLowStockAlerts: boolean
  lowStockThreshold: number
}
