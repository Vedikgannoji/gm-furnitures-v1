import React from 'react'
import { Link } from 'react-router-dom'
import {
  TrendingUp,
  ShoppingBag,
  Users,
  Package,
  AlertTriangle,
  ArrowUpRight,
  ArrowRight,
  ExternalLink,
} from 'lucide-react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { mockOrders, mockProducts, mockAnalyticsData } from '@/data/mockData'
import { formatCurrency } from '@/lib/utils'

export const AdminDashboardPage: React.FC = () => {
  const lowStockProducts = mockProducts.filter(
    (p) => p.stockStatus === 'low_stock' || p.stockStatus === 'out_of_stock'
  )

  const recentOrders = mockOrders.slice(0, 4)

  const kpis = [
    {
      title: 'Total Monthly Revenue',
      value: mockAnalyticsData.kpis.totalRevenue,
      change: mockAnalyticsData.kpis.revenueGrowth,
      icon: TrendingUp,
    },
    {
      title: 'Active Orders',
      value: mockAnalyticsData.kpis.totalOrders,
      change: mockAnalyticsData.kpis.orderGrowth,
      icon: ShoppingBag,
    },
    {
      title: 'Average Order Value (AOV)',
      value: mockAnalyticsData.kpis.averageOrderValue,
      change: mockAnalyticsData.kpis.aovGrowth,
      icon: Users,
    },
    {
      title: 'Low Stock Alerts',
      value: `${lowStockProducts.length} Items`,
      change: 'Priority replenishing required',
      icon: AlertTriangle,
      isAlert: true,
    },
  ]

  const pieColors = ['#111111', '#444444', '#777777', '#AAAAAA', '#DDDDDD']

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-border gap-4">
        <div>
          <span className="editorial-badge text-muted">Executive Oversight</span>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight mt-1">
            Store Performance & Atelier Metrics
          </h1>
          <p className="text-xs text-muted mt-0.5">
            Real-time synthesis of transactions, joinery queue status, and inventory valuation.
          </p>
        </div>

        <div className="flex items-center gap-3">
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
                <Icon className={`w-4 h-4 ${kpi.isAlert ? 'text-amber-600' : 'text-foreground'}`} />
              </div>
              <div className="mt-3">
                <span className="text-2xl font-semibold text-foreground tracking-tight">
                  {kpi.value}
                </span>
                <p
                  className={`text-[11px] mt-1 ${
                    kpi.isAlert ? 'text-amber-700 font-medium' : 'text-emerald-700 font-medium'
                  }`}
                >
                  {kpi.change}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Charts Section: Monochrome Recharts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Revenue Velocity Trend (Left) */}
        <div className="lg:col-span-8 bg-background border border-border p-6">
          <div className="flex items-center justify-between mb-6 pb-2 border-b border-border">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-foreground">
                Revenue Trajectory (Last 6 Months)
              </h3>
              <p className="text-[11px] text-muted mt-0.5">Monthly gross sales volume in INR</p>
            </div>
            <span className="text-xs font-mono font-semibold text-foreground">
              +27.4% MoM
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockAnalyticsData.monthlyRevenue}>
                <XAxis dataKey="month" stroke="#888888" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#888888"
                  fontSize={10}
                  tickLine={false}
                  tickFormatter={(val) => `₹${(val / 100000).toFixed(0)}L`}
                />
                <Tooltip
                  formatter={(val: number) => [formatCurrency(val), 'Revenue']}
                  contentStyle={{ backgroundColor: '#111', color: '#fff', border: 'none', fontSize: '11px' }}
                />
                <Bar dataKey="revenue" fill="#18181b" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Share (Right) */}
        <div className="lg:col-span-4 bg-background border border-border p-6 flex flex-col justify-between">
          <div>
            <div className="mb-4 pb-2 border-b border-border">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-foreground">
                Revenue by Category
              </h3>
              <p className="text-[11px] text-muted mt-0.5">Distribution across primary forms</p>
            </div>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={mockAnalyticsData.categorySales}
                    dataKey="percentage"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={3}
                  >
                    {mockAnalyticsData.categorySales.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: number) => [`${val}%`, 'Share']}
                    contentStyle={{ backgroundColor: '#111', color: '#fff', border: 'none', fontSize: '11px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-border text-xs">
            {mockAnalyticsData.categorySales.map((cat, i) => (
              <div key={i} className="flex justify-between items-center">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: pieColors[i] }} />
                  <span className="text-muted">{cat.category}</span>
                </span>
                <span className="font-semibold text-foreground">{cat.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Two Columns: Recent Orders + Low Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Recent Orders Table */}
        <div className="lg:col-span-8 bg-background border border-border p-6">
          <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-foreground">
              Recent Store Orders
            </h3>
            <Link to="/admin/orders" className="text-xs text-muted hover:text-foreground underline">
              View All Orders &rarr;
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-muted uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 font-medium">Order ID</th>
                  <th className="py-2.5 font-medium">Customer</th>
                  <th className="py-2.5 font-medium">Date</th>
                  <th className="py-2.5 font-medium">Amount</th>
                  <th className="py-2.5 font-medium">Status</th>
                  <th className="py-2.5 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-surface/50 transition-colors">
                    <td className="py-3 font-mono font-medium">{ord.orderNumber}</td>
                    <td className="py-3">{ord.customer.name}</td>
                    <td className="py-3 text-muted">{ord.date}</td>
                    <td className="py-3 font-semibold">{formatCurrency(ord.total)}</td>
                    <td className="py-3">
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
                    <td className="py-3 text-right">
                      <Link
                        to={`/admin/orders/${ord.id}`}
                        className="text-xs text-muted hover:text-foreground underline"
                      >
                        Manage
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Watchlist */}
        <div className="lg:col-span-4 bg-background border border-border p-6">
          <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-foreground">
              Low Stock Priority
            </h3>
            <Link to="/admin/inventory" className="text-xs text-muted hover:text-foreground underline">
              Inventory &rarr;
            </Link>
          </div>

          <div className="divide-y divide-border">
            {lowStockProducts.map((p) => (
              <div key={p.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5 truncate">
                  <img src={p.images[0]} alt={p.name} className="w-9 h-11 object-cover border border-border shrink-0" />
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
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
