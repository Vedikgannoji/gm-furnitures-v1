import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Package, ArrowRight, ShieldCheck, ChevronRight } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'
import { API_BASE } from '@/lib/api'

interface OrderItem {
  id?: string
  productId?: string
  name?: string
  sku?: string
  slug?: string
  image?: string
  images?: string[]
  product?: {
    id?: string
    name?: string
    sku?: string
    images?: string[]
  }
  quantity: number
  selectedColor?: string
  price: number
}

interface StoredOrder {
  id: string
  orderNumber: string
  total: number
  subtotal: number
  discount: number
  assemblyCharge?: number
  convenienceFee?: number
  gst?: number
  couponCode?: string | null
  couponDiscountAmount?: number
  status: string
  paymentStatus?: string
  deliveryAddress?: {
    fullName?: string
    city?: string
    state?: string
    address?: string
    addressLine?: string
  }
  items: OrderItem[]
  createdAt: string
}

function getStatusBadge(status: string) {
  const norm = (status || '').toLowerCase().trim()
  switch (norm) {
    case 'delivered':
      return { label: 'Delivered', style: 'bg-emerald-50 text-emerald-800 border-emerald-200' }
    case 'out_for_delivery':
      return { label: 'Out for Delivery', style: 'bg-cyan-50 text-cyan-800 border-cyan-200' }
    case 'in_transit':
      return { label: 'In Transit', style: 'bg-purple-50 text-purple-800 border-purple-200' }
    case 'shipped':
      return { label: 'Shipped', style: 'bg-indigo-50 text-indigo-800 border-indigo-200' }
    case 'confirmed':
      return { label: 'Confirmed', style: 'bg-blue-50 text-blue-800 border-blue-200' }
    case 'pending':
    default:
      return { label: 'Pending', style: 'bg-amber-50 text-amber-800 border-amber-200' }
  }
}

export const AccountOrdersPage: React.FC = () => {
  const { token } = useAuth()
  const [orders, setOrders] = useState<StoredOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchOrders = useCallback(async () => {
    if (!token) return
    setIsLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setOrders(data)
      }
    } catch (err) {
      console.error('Failed to load orders:', err)
    } finally {
      setIsLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-light text-foreground">Order History</h2>
        <p className="text-xs text-muted mt-1">
          View your past orders, real purchased items, and track live fulfillment status.
        </p>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-xs text-muted">
          Loading order history...
        </div>
      ) : orders.length === 0 ? (
        <div className="border border-dashed border-border p-12 text-center bg-surface/50">
          <Package className="w-8 h-8 text-muted mx-auto mb-3 stroke-[1.2]" />
          <h3 className="text-sm font-medium text-foreground">No Orders Yet</h3>
          <p className="text-xs text-muted mt-1 max-w-sm mx-auto">
            You have not placed any orders yet.
          </p>
          <Link
            to="/shop"
            className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-foreground text-background text-xs uppercase tracking-wider font-semibold hover:bg-black/85 transition-colors"
          >
            <span>EXPLORE CATALOG &rarr;</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const badge = getStatusBadge(order.status)
            const hasCoupon = Boolean(order.couponDiscountAmount && order.couponDiscountAmount > 0)

            return (
              <div
                key={order.id}
                className="bg-background border border-border p-5 transition-all hover:border-foreground/60 shadow-sm"
              >
                {/* Header info */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border text-xs">
                  <div className="flex items-center gap-6">
                    <div>
                      <span className="text-[10px] text-muted uppercase tracking-wider block">Order No.</span>
                      <span className="font-mono font-semibold text-foreground">{order.orderNumber}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted uppercase tracking-wider block">Date Placed</span>
                      <span className="text-foreground">
                        {new Date(order.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                    {order.deliveryAddress?.city && (
                      <div>
                        <span className="text-[10px] text-muted uppercase tracking-wider block">Destination</span>
                        <span className="text-foreground">
                          {order.deliveryAddress.city}, {order.deliveryAddress.state}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 text-[10px] font-semibold tracking-wider uppercase border ${badge.style}`}>
                      {badge.label}
                    </span>
                    <Link
                      to={`/account/orders/${order.id}`}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-foreground hover:underline"
                    >
                      <span>View Details</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>

                {/* Line items mini-summary with ACTUAL historical snapshot images */}
                <div className="py-4 space-y-3">
                  {order.items?.map((item, idx) => {
                    const imageSrc = item.image || item.images?.[0] || item.product?.images?.[0]
                    const itemName = item.name || item.product?.name || 'Furniture Piece'

                    return (
                      <div key={idx} className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          {imageSrc ? (
                            <img
                              src={imageSrc}
                              alt={itemName}
                              className="w-12 h-14 object-cover border border-border bg-surface shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-14 border border-border bg-surface flex items-center justify-center shrink-0 text-muted">
                              <Package className="w-4 h-4 stroke-[1.2]" />
                            </div>
                          )}
                          <div>
                            <p className="text-xs font-medium text-foreground">{itemName}</p>
                            <p className="text-[11px] text-muted mt-0.5">
                              Qty: {item.quantity} {item.selectedColor ? `• Finish: ${item.selectedColor}` : ''}
                              {item.sku ? ` • SKU: ${item.sku}` : ''}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-semibold text-foreground block">
                            {formatCurrency(item.price * item.quantity)}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Financial breakdown */}
                <div className="pt-3 border-t border-border space-y-1.5 text-xs">
                  {hasCoupon && (
                    <div className="flex items-center justify-between text-emerald-600 text-[11px]">
                      <span>Coupon Applied ({order.couponCode || 'PROMO'})</span>
                      <span className="font-semibold">-{formatCurrency(order.couponDiscountAmount || 0)}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-muted text-[11px]">
                      Total Paid (Inclusive of all applicable fees & taxes)
                    </span>
                    <span className="font-semibold text-foreground text-sm">
                      {formatCurrency(order.total)}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

