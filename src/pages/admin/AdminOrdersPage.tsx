import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Search, Eye, ShoppingBag, RefreshCw, AlertCircle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'

interface AdminOrder {
  id: string
  orderNumber: string
  date: string
  customer: { id: string; name: string; email: string }
  items: any[]
  subtotal: number
  total: number
  status: string
}

export const AdminOrdersPage: React.FC = () => {
  const { token } = useAuth()
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const fetchOrders = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const res = await fetch('/api/admin/orders', {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || 'Failed to load orders.')
      }
      setOrders(await res.json())
    } catch (err: any) {
      setError(err.message || 'Unable to connect to database.')
    } finally {
      setIsLoading(false)
    }
  }, [token])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const q = searchQuery.toLowerCase()
      const matchSearch =
        o.orderNumber.toLowerCase().includes(q) ||
        o.customer.name.toLowerCase().includes(q) ||
        o.customer.email.toLowerCase().includes(q)
      const matchStatus = statusFilter === 'all' || o.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [orders, searchQuery, statusFilter])

  const statusStyle = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-emerald-50 text-emerald-800 border-emerald-200'
      case 'shipped':   return 'bg-blue-50 text-blue-800 border-blue-200'
      case 'cancelled': return 'bg-rose-50 text-rose-800 border-rose-200'
      default:          return 'bg-zinc-100 text-zinc-800 border-zinc-200'
    }
  }

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
            All orders from the database. Updated in real time.
          </p>
        </div>
        <button
          onClick={fetchOrders}
          disabled={isLoading}
          className="h-9 px-3 border border-border text-xs flex items-center gap-1.5 hover:bg-surface transition-colors self-start"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filters */}
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
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={fetchOrders} className="underline ml-4">Retry</button>
        </div>
      )}

      {/* Table */}
      <div className="bg-background border border-border overflow-x-auto">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="w-6 h-6 border-2 border-foreground border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <span className="text-xs text-muted">Loading orders from database...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <ShoppingBag className="w-10 h-10 text-border mx-auto" />
            <p className="text-sm font-medium text-foreground">
              {orders.length === 0 ? 'No Orders Yet' : 'No matching orders'}
            </p>
            <p className="text-xs text-muted max-w-xs mx-auto">
              {orders.length === 0
                ? 'Customer orders will appear here once they complete a purchase.'
                : 'Try a different search or filter.'}
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border bg-surface text-muted uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4 font-semibold">Order ID</th>
                <th className="py-3 px-4 font-semibold">Customer</th>
                <th className="py-3 px-4 font-semibold">Date</th>
                <th className="py-3 px-4 font-semibold">Items</th>
                <th className="py-3 px-4 font-semibold">Total</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((ord) => (
                <tr key={ord.id} className="hover:bg-surface/50 transition-colors">
                  <td className="py-3 px-4 font-mono font-medium">{ord.orderNumber}</td>
                  <td className="py-3 px-4">
                    <span className="font-medium text-foreground block">{ord.customer.name}</span>
                    <span className="text-[11px] text-muted block">{ord.customer.email}</span>
                  </td>
                  <td className="py-3 px-4 text-muted whitespace-nowrap">{ord.date}</td>
                  <td className="py-3 px-4 font-mono">{ord.items.length} item{ord.items.length !== 1 ? 's' : ''}</td>
                  <td className="py-3 px-4 font-semibold">{formatCurrency(ord.total)}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 text-[9px] font-semibold tracking-wider uppercase border ${statusStyle(ord.status)}`}>
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
        )}
      </div>
    </div>
  )
}
