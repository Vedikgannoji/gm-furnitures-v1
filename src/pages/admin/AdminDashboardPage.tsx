import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Package,
  Users,
  AlertTriangle,
  Layers,
  CheckCircle2,
  FileText,
  ShoppingBag,
  RefreshCw,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { formatCurrency } from '@/lib/utils'

interface AdminStats {
  totalProducts: number
  publishedProducts: number
  draftProducts: number
  lowStockProducts: number
  totalCustomers: number
  totalOrders: number
  totalRevenue: number
  recentOrders: Array<{
    id: string
    orderNumber: string
    customer: { name: string; email: string }
    date: string
    total: number
    status: string
  }>
  lowStockItems: Array<any>
}

export const AdminDashboardPage: React.FC = () => {
  const { token } = useAuth()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchStats = async () => {
    try {
      setIsLoading(true)
      const res = await fetch('/api/admin/stats', {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch (err) {
      console.error('Fetch admin stats error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [token])

  const kpis = [
    {
      title: 'Total Furniture Pieces',
      value: stats ? stats.totalProducts.toString() : '...',
      sub: `${stats ? stats.publishedProducts : 0} published catalog items`,
      icon: Package,
      highlight: false,
    },
    {
      title: 'Draft / Unpublished',
      value: stats ? stats.draftProducts.toString() : '...',
      sub: 'Pieces in development or archive',
      icon: Layers,
      highlight: false,
    },
    {
      title: 'Low Stock Priority',
      value: stats ? stats.lowStockProducts.toString() : '...',
      sub: stats && stats.lowStockProducts > 0 ? 'Requires stock replenishing' : 'Inventory adequate',
      icon: AlertTriangle,
      highlight: stats && stats.lowStockProducts > 0,
    },
    {
      title: 'Registered Customers',
      value: stats ? stats.totalCustomers.toString() : '...',
      sub: 'Active consumer client accounts',
      icon: Users,
      highlight: false,
    },
  ]

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-border gap-4">
        <div>
          <span className="editorial-badge text-muted">Operations & Oversight</span>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight mt-1">
            Store Performance & Atelier Metrics
          </h1>
          <p className="text-xs text-muted mt-0.5">
            Real-time synthesis of SQLite database records, inventory velocity, and customer accounts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchStats}
            disabled={isLoading}
            className="h-9 px-3 border border-border text-xs flex items-center gap-1.5 hover:bg-surface transition-colors"
            title="Refresh database metrics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <Link
            to="/admin/products/new"
            className="h-9 px-4 bg-foreground text-background text-xs uppercase tracking-wider font-medium flex items-center gap-1.5 hover:bg-black/85 transition-colors"
          >
            <span>+ Add Product</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon
          return (
            <div
              key={idx}
              className="bg-background border border-border p-5 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between text-muted">
                <span className="text-[11px] font-medium uppercase tracking-wider">
                  {kpi.title}
                </span>
                <Icon className={`w-4 h-4 ${kpi.highlight ? 'text-amber-600' : 'text-foreground'}`} />
              </div>
              <div className="mt-3">
                <span className="text-2xl font-semibold text-foreground tracking-tight">
                  {kpi.value}
                </span>
                <p
                  className={`text-[11px] mt-1 ${
                    kpi.highlight ? 'text-amber-700 font-medium' : 'text-muted'
                  }`}
                >
                  {kpi.sub}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Database Inventory & Orders Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Recent Orders Table */}
        <div className="lg:col-span-8 bg-background border border-border p-6">
          <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-foreground">
                Recent Store Orders
              </h3>
              <p className="text-[11px] text-muted mt-0.5">
                {stats ? `${stats.totalOrders} total confirmed client orders` : 'Loading orders...'}
              </p>
            </div>
            <Link to="/admin/orders" className="text-xs text-muted hover:text-foreground underline">
              View All Orders &rarr;
            </Link>
          </div>

          {stats && stats.recentOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-muted uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 font-medium">Order ID</th>
                    <th className="py-2.5 font-medium">Customer</th>
                    <th className="py-2.5 font-medium">Date</th>
                    <th className="py-2.5 font-medium">Amount</th>
                    <th className="py-2.5 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {stats.recentOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-surface/50 transition-colors">
                      <td className="py-3 font-mono font-medium">{ord.orderNumber}</td>
                      <td className="py-3">
                        <span className="font-medium text-foreground block">{ord.customer.name}</span>
                        <span className="text-[10px] text-muted">{ord.customer.email}</span>
                      </td>
                      <td className="py-3 text-muted">{ord.date}</td>
                      <td className="py-3 font-semibold">{formatCurrency(ord.total)}</td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 text-[9px] font-semibold tracking-wider uppercase border bg-zinc-100 text-zinc-800 border-zinc-200">
                          {ord.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-muted">
              No customer orders have been recorded in the database yet.
            </div>
          )}
        </div>

        {/* Low Stock Watchlist */}
        <div className="lg:col-span-4 bg-background border border-border p-6">
          <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-foreground">
                Low Stock Priority
              </h3>
              <p className="text-[11px] text-muted mt-0.5">Items with stock &le; 3 units</p>
            </div>
            <Link to="/admin/products" className="text-xs text-muted hover:text-foreground underline">
              All Products &rarr;
            </Link>
          </div>

          {stats && stats.lowStockItems && stats.lowStockItems.length > 0 ? (
            <div className="divide-y divide-border">
              {stats.lowStockItems.map((p) => {
                const img = p.images && p.images.length > 0 ? p.images[0] : ''
                return (
                  <div key={p.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5 truncate">
                      {img && (
                        <img src={img} alt={p.name} className="w-9 h-11 object-cover border border-border shrink-0" />
                      )}
                      <div className="truncate">
                        <p className="font-medium text-foreground truncate">{p.name}</p>
                        <p className="text-[10px] text-muted font-mono">{p.sku}</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`text-xs font-bold ${
                          p.stock === 0 ? 'text-rose-600' : 'text-amber-700'
                        }`}
                      >
                        {p.stock === 0 ? '0 Units' : `${p.stock} Left`}
                      </span>
                      <Link
                        to={`/admin/products/${p.id}`}
                        className="block text-[10px] text-muted hover:text-foreground underline"
                      >
                        Adjust
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-muted">
              All active products have adequate stock levels.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
