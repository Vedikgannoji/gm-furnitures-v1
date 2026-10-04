import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ShoppingBag, Heart, MapPin, ArrowRight, ShieldCheck } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useWishlist } from '@/context/WishlistContext'
import { useAuth } from '@/context/AuthContext'

export const AccountDashboardPage: React.FC = () => {
  const { token, user } = useAuth()
  const { wishlistCount } = useWishlist()
  const [orderCount, setOrderCount] = useState<number>(0)
  const [addressCount, setAddressCount] = useState<number>(0)
  const [latestOrder, setLatestOrder] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!token) return

    let isMounted = true

    async function fetchDashboardStats() {
      setIsLoading(true)
      try {
        const [ordersRes, addressesRes] = await Promise.all([
          fetch('/api/orders', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/addresses', { headers: { Authorization: `Bearer ${token}` } }),
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
            <span className="text-[11px] font-medium uppercase tracking-wider">Curated Wishlist</span>
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
              <span className="editorial-badge text-muted">Latest Commission</span>
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
                View Commission History &rarr;
              </Link>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {latestOrder.items?.map((item: any, i: number) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-surface border border-border">
                <img
                  src={
                    item.product?.images?.[0] ||
                    'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=400&q=80'
                  }
                  alt={item.product?.name || 'Furniture'}
                  className="w-12 h-14 object-cover shrink-0 border border-border"
                />
                <div className="text-xs truncate">
                  <p className="font-medium text-foreground truncate">{item.product?.name}</p>
                  <p className="text-muted mt-0.5 text-[11px]">
                    Qty: {item.quantity} {item.selectedColor ? `• ${item.selectedColor}` : ''}
                  </p>
                  <p className="font-semibold text-foreground mt-1">
                    {formatCurrency(item.price * item.quantity)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-surface border border-border p-6 text-center">
          <h3 className="text-sm font-medium text-foreground">Welcome to your Client Portal</h3>
          <p className="text-xs text-muted mt-1 max-w-md mx-auto leading-relaxed">
            Your client portfolio is registered under {user?.email}. Browse our available dining tables to place your initial commission.
          </p>
          <Link
            to="/shop"
            className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-foreground text-background text-xs uppercase tracking-wider font-semibold hover:bg-black/85 transition-colors"
          >
            <span>Explore Dining Tables</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </div>
  )
}
