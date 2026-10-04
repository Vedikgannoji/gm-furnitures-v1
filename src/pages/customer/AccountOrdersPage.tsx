import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Package, ArrowRight, ShieldCheck } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'

interface OrderItem {
  product: {
    id: string
    name: string
    images?: string[]
    images_json?: string
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
  status: string
  deliveryAddress: {
    fullName: string
    city: string
    state: string
    addressLine: string
  }
  items: OrderItem[]
  createdAt: string
}

export const AccountOrdersPage: React.FC = () => {
  const { token } = useAuth()
  const [orders, setOrders] = useState<StoredOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchOrders = useCallback(async () => {
    if (!token) return
    setIsLoading(true)
    try {
      const res = await fetch('/api/orders', {
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
          View your past orders and track your purchases.
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
          {orders.map((order) => (
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
                  <div>
                    <span className="text-[10px] text-muted uppercase tracking-wider block">Destination</span>
                    <span className="text-foreground">
                      {order.deliveryAddress?.city}, {order.deliveryAddress?.state}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 text-[10px] font-semibold tracking-wider uppercase bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {order.status}
                  </span>
                </div>
              </div>

              {/* Line items mini-summary */}
              <div className="py-4 space-y-3">
                {order.items?.map((item, idx) => {
                  const imageSrc =
                    item.product?.images?.[0] ||
                    'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=400&q=80'

                  return (
                    <div key={idx} className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={imageSrc}
                          alt={item.product?.name || 'Piece'}
                          className="w-12 h-14 object-cover border border-border bg-surface shrink-0"
                        />
                        <div>
                          <p className="text-xs font-medium text-foreground">{item.product?.name}</p>
                          <p className="text-[11px] text-muted mt-0.5">
                            Qty: {item.quantity} {item.selectedColor ? `• ${item.selectedColor}` : ''}
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

              {/* Footer */}
              <div className="pt-3 border-t border-border flex items-center justify-between text-xs">
                <span className="text-muted text-[11px]">
                  Total Order Value (incl. 18% GST & Delivery)
                </span>
                <span className="font-semibold text-foreground text-sm">
                  {formatCurrency(order.total)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
