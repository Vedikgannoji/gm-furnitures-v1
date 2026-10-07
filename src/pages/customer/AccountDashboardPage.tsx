import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ShoppingBag, Heart, MapPin, ArrowRight, ShieldCheck } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useWishlist } from '@/context/WishlistContext'
import { useAuth } from '@/context/AuthContext'
import { API_BASE } from '@/lib/api'

interface DashboardOrderItem {
  id?: string
  productId?: string
  name?: string
  sku?: string
  image?: string
  images?: string[]
  product?: {
    id?: string
    name?: string
    images?: string[]
  }
  quantity: number
  selectedColor?: string
  price: number
}

interface DashboardOrder {
  id: string
  orderNumber: string
  total: number
  status: string
  items?: DashboardOrderItem[]
  createdAt: string
}

export const AccountDashboardPage: React.FC = () => {
  const { token, user } = useAuth()
  const { wishlistCount } = useWishlist()
  const [orderCount, setOrderCount] = useState<number>(0)
  const [addressCount, setAddressCount] = useState<number>(0)
  const [latestOrder, setLatestOrder] = useState<DashboardOrder | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!token) {
      setOrderCount(0)
      setAddressCount(0)
      setLatestOrder(null)
      setIsLoading(false)
      return
    }

    let isMounted = true

    async function fetchDashboardStats() {
      setIsLoading(true)
      try {
        const [ordersRes, addressesRes] = await Promise.all([
          fetch(`${API_BASE}/api/orders`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_BASE}/api/addresses`, { headers: { Authorization: `Bearer ${token}` } }),
        ])

        if (ordersRes.ok && isMounted) {
          const orders = await ordersRes.json()
          setOrderCount(orders.length)
          if (orders.length > 0) {
            setLatestOrder(orders[0])
          }
        }

        if (addressesRes.ok && isMounted) {
          const addresses = await addressesRes.json()
          setAddressCount(addresses.length)
        }
      } catch (err) {
        console.error('Failed to load dashboard metrics:', err)
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    fetchDashboardStats()

    return () => {
      isMounted = false
    }
  }, [token])

  return (
    <div className="space-y-8">
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-background border border-border p-5">
          <div className="flex items-center justify-between text-muted">
            <span className="text-[11px] font-medium uppercase tracking-wider">Total Orders</span>
            <ShoppingBag className="w-4 h-4" />
          </div>
          <p className="text-2xl font-light text-foreground mt-2">
            {isLoading ? '—' : orderCount}
          </p>
          <Link
            to="/account/orders"
            className="text-[11px] text-muted hover:text-foreground mt-3 inline-flex items-center gap-1 underline"
          >
            <span>View Orders</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="bg-background border border-border p-5">
          <div className="flex items-center justify-between text-muted">
            <span className="text-[11px] font-medium uppercase tracking-wider">Wishlist</span>
            <Heart className="w-4 h-4" />
          </div>
          <p className="text-2xl font-light text-foreground mt-2">{wishlistCount} Saved</p>
          <Link
            to="/account/wishlist"
            className="text-[11px] text-muted hover:text-foreground mt-3 inline-flex items-center gap-1 underline"
          >
            <span>Browse Items</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="bg-background border border-border p-5">
          <div className="flex items-center justify-between text-muted">
            <span className="text-[11px] font-medium uppercase tracking-wider">Saved Addresses</span>
            <MapPin className="w-4 h-4" />
          </div>
          <p className="text-2xl font-light text-foreground mt-2">
            {isLoading ? '—' : `${addressCount} Locations`}
          </p>
          <Link
            to="/account/addresses"
            className="text-[11px] text-muted hover:text-foreground mt-3 inline-flex items-center gap-1 underline"
          >
            <span>Manage Locations</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Most Recent Order Spotlight */}
      {latestOrder ? (
        <div className="bg-background border border-border p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border gap-2">
            <div>
              <span className="editorial-badge text-muted">Latest Order</span>
              <h3 className="text-base font-medium text-foreground mt-0.5">
                Order {latestOrder.orderNumber}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase bg-emerald-100 text-emerald-900 border border-emerald-200">
                {latestOrder.status}
              </span>
              <Link
                to="/account/orders"
                className="text-xs text-foreground font-medium underline ml-2"
              >
                View Order History &rarr;
              </Link>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {latestOrder.items?.map((item: DashboardOrderItem, i: number) => {
              const imageSrc = item.image || item.images?.[0] || item.product?.images?.[0]
              const itemName = item.name || item.product?.name || 'Piece'

              return (
                <div key={i} className="flex items-center gap-3 p-3 bg-surface border border-border">
                  {imageSrc ? (
                    <img
                      src={imageSrc}
                      alt={itemName}
                      className="w-12 h-14 object-cover shrink-0 border border-border"
                    />
                  ) : (
                    <div className="w-12 h-14 bg-background border border-border shrink-0 flex items-center justify-center text-muted">
                      <ShoppingBag className="w-4 h-4 stroke-[1.2]" />
                    </div>
                  )}
                  <div className="text-xs truncate">
                    <p className="font-medium text-foreground truncate">{itemName}</p>
                    <p className="text-muted mt-0.5 text-[11px]">
                      Qty: {item.quantity} {item.selectedColor ? `• ${item.selectedColor}` : ''}
                    </p>
                    <p className="font-semibold text-foreground mt-1">
                      {formatCurrency(item.price * item.quantity)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="bg-surface border border-border p-6 text-center">
          <h3 className="text-base font-medium text-foreground">
            Welcome, {user?.name || user?.email?.split('@')[0] || 'there'}
          </h3>
          <p className="text-xs text-muted mt-1 max-w-md mx-auto leading-relaxed">
            Browse our furniture and find something you like.
          </p>
          <Link
            to="/shop"
            className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-foreground text-background text-xs uppercase tracking-wider font-semibold hover:bg-black/85 transition-colors"
          >
            <span>EXPLORE CATALOG &rarr;</span>
          </Link>
        </div>
      )}
    </div>
  )
}
