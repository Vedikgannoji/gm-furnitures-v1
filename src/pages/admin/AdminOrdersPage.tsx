import React, { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Search, Eye, Filter, ShoppingBag, CheckCircle2 } from 'lucide-react'
import { mockOrders } from '@/data/mockData'
import { Order, OrderStatus } from '@/types'
import { formatCurrency } from '@/lib/utils'

export const AdminOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>(mockOrders)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchSearch =
        o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.customer.email.toLowerCase().includes(searchQuery.toLowerCase())
      const matchStatus = statusFilter === 'all' || o.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [orders, searchQuery, statusFilter])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-border gap-4">
        <div>
          <span className="editorial-badge text-muted">Fulfillment Register</span>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight mt-1">
            Customer Commissions & Orders
          </h1>
          <p className="text-xs text-muted mt-0.5">
            Monitor client orders, track white-glove dispatch schedules, and generate GST tax invoices.
          </p>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-background border border-border p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Search by order ID, customer name, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 bg-surface pl-8 pr-3 text-xs border border-border focus:border-foreground focus:outline-none"
          />
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-3 text-muted" />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 px-3 bg-surface border border-border text-xs focus:border-foreground focus:outline-none cursor-pointer w-full sm:w-auto"
          >
            <option value="all">All Fulfillment Stages ({orders.length})</option>
            <option value="confirmed">Confirmed</option>
            <option value="processing">Processing & QC</option>
            <option value="shipped">Shipped In Transit</option>
            <option value="delivered">Delivered & Assembled</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-background border border-border overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-border bg-surface text-muted uppercase text-[10px] tracking-wider">
              <th className="py-3 px-4 font-semibold">Order ID</th>
              <th className="py-3 px-4 font-semibold">Customer & Contact</th>
              <th className="py-3 px-4 font-semibold">Date</th>
              <th className="py-3 px-4 font-semibold">Items</th>
              <th className="py-3 px-4 font-semibold">Total Amount</th>
              <th className="py-3 px-4 font-semibold">Payment</th>
              <th className="py-3 px-4 font-semibold">Fulfillment Status</th>
              <th className="py-3 px-4 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredOrders.map((ord) => (
              <tr key={ord.id} className="hover:bg-surface/50 transition-colors">
                <td className="py-3 px-4 font-mono font-medium">{ord.orderNumber}</td>
                <td className="py-3 px-4">
                  <span className="font-medium text-foreground block">{ord.customer.name}</span>
                  <span className="text-[11px] text-muted block">{ord.customer.email}</span>
                </td>
                <td className="py-3 px-4 text-muted whitespace-nowrap">{ord.date}</td>
                <td className="py-3 px-4 font-mono">{ord.items.length} designs</td>
                <td className="py-3 px-4 font-semibold">{formatCurrency(ord.total)}</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-0.5 text-[9px] font-semibold tracking-wider uppercase bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {ord.paymentStatus}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span
                    className={`px-2 py-0.5 text-[9px] font-semibold tracking-wider uppercase border ${
                      ord.status === 'delivered'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : ord.status === 'shipped'
                        ? 'bg-blue-50 text-blue-800 border-blue-200'
                        : 'bg-zinc-100 text-zinc-800 border-zinc-200'
                    }`}
                  >
                    {ord.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  <Link
                    to={`/admin/orders/${ord.id}`}
                    className="inline-flex items-center gap-1 text-xs text-foreground font-medium hover:underline p-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Manage</span>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
