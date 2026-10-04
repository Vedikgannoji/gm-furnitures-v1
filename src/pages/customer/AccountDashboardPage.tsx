import React from 'react'
import { Link } from 'react-router-dom'
import { ShoppingBag, Heart, MapPin, ArrowRight, ShieldCheck, Clock } from 'lucide-react'
import { mockOrders } from '@/data/mockData'
import { formatCurrency } from '@/lib/utils'
import { useWishlist } from '@/context/WishlistContext'

export const AccountDashboardPage: React.FC = () => {
  const { wishlistCount } = useWishlist()
  const recentOrder = mockOrders[0]

  return (
    <div className="space-y-8">
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-background border border-border p-5">
          <div className="flex items-center justify-between text-muted">
            <span className="text-[11px] font-medium uppercase tracking-wider">Total Orders</span>
            <ShoppingBag className="w-4 h-4" />
          </div>
          <p className="text-2xl font-light text-foreground mt-2">{mockOrders.length}</p>
          <Link
            to="/account/orders"
            className="text-[11px] text-muted hover:text-foreground mt-3 inline-flex items-center gap-1 underline"
          >
            <span>View All</span>
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
          <p className="text-2xl font-light text-foreground mt-2">2 Locations</p>
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
      {recentOrder && (
        <div className="bg-background border border-border p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border gap-2">
            <div>
              <span className="editorial-badge text-muted">Latest Commission</span>
              <h3 className="text-base font-medium text-foreground mt-0.5">
                Order {recentOrder.orderNumber}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase bg-emerald-100 text-emerald-900 border border-emerald-200">
                {recentOrder.status}
              </span>
              <Link
                to={`/account/orders/${recentOrder.id}`}
                className="text-xs text-foreground font-medium underline ml-2"
              >
                Track & Details &rarr;
              </Link>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {recentOrder.items.map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-2 bg-surface border border-border">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-12 h-14 object-cover shrink-0"
                />
                <div className="text-xs truncate">
                  <p className="font-medium text-foreground truncate">{item.name}</p>
                  <p className="text-muted mt-0.5 text-[11px]">
                    Qty: {item.quantity} • {item.selectedColor}
                  </p>
                  <p className="font-semibold text-foreground mt-1">
                    {formatCurrency(item.price * item.quantity)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Customer Support Card */}
      <div className="bg-surface border border-border p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">
            Customer Support
          </h4>
          <p className="text-xs text-muted mt-1 leading-relaxed max-w-lg">
            Have questions regarding delivery, custom orders, or interior design consultations? Our team is available Monday – Saturday to assist you.
          </p>
        </div>
        <Link to="/contact">
          <button className="px-4 py-2 bg-foreground text-background text-xs uppercase tracking-wider font-medium hover:bg-black/85 transition-colors whitespace-nowrap">
            Contact Support
          </button>
        </Link>
      </div>
    </div>
  )
}
