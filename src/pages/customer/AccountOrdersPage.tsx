import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Eye, Package } from 'lucide-react'
import { mockOrders } from '@/data/mockData'
import { formatCurrency } from '@/lib/utils'

export const AccountOrdersPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-light text-foreground">Order & Commission History</h2>
        <p className="text-xs text-muted mt-1">
          Review previous shipments, verify White-Glove dispatch milestones, and download GST tax invoices.
        </p>
      </div>

      <div className="space-y-4">
        {mockOrders.map((order) => (
          <div
            key={order.id}
            className="bg-background border border-border p-5 transition-all hover:border-foreground/60"
          >
            {/* Header info */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border text-xs">
              <div className="flex items-center gap-4">
                <div>
                  <span className="text-[10px] text-muted uppercase tracking-wider block">Order No.</span>
                  <span className="font-mono font-semibold text-foreground">{order.orderNumber}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted uppercase tracking-wider block">Date Placed</span>
                  <span className="text-foreground">{order.date}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase border ${
                    order.status === 'delivered'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : order.status === 'shipped'
                      ? 'bg-blue-50 text-blue-800 border-blue-200'
                      : 'bg-zinc-100 text-zinc-800 border-zinc-200'
                  }`}
                >
                  {order.status}
                </span>
                <Link
                  to={`/account/orders/${order.id}`}
                  className="h-8 px-3 bg-surface hover:bg-surface-subtle border border-border text-foreground text-xs flex items-center gap-1 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View Details</span>
                </Link>
              </div>
            </div>

            {/* Line items mini-summary */}
            <div className="py-3 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-3 overflow-hidden">
                  {order.items.map((item, i) => (
                    <img
                      key={i}
                      src={item.image}
                      alt={item.name}
                      className="inline-block h-10 w-10 object-cover border border-background ring-1 ring-border"
                    />
                  ))}
                </div>
                <span className="text-xs text-muted">
                  {order.items.length} {order.items.length === 1 ? 'Design' : 'Designs'} (
                  {order.items.map((it) => it.name).join(', ')})
                </span>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-muted uppercase tracking-wider block">
                  Total (incl. 18% GST)
                </span>
                <span className="text-sm font-semibold text-foreground">
                  {formatCurrency(order.total)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
