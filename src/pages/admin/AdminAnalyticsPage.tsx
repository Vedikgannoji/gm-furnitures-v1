import React, { useState, useEffect, useCallback } from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from 'recharts'
import { BarChart2, RefreshCw, AlertCircle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'

interface AnalyticsData {
  totalOrders: number
  totalRevenue: number
  avgOrderValue: number
  totalCustomers: number
  repeatRatio: number
  monthlyRevenue: Array<{ month: string; revenue: number; orders: number }>
  categorySales: Array<{ category: string; value: number }>
  topProducts: Array<{ name: string; sku: string; image: string; revenue: number; units: number }>
}

const PIE_COLORS = ['#18181b', '#3f3f46', '#71717a', '#a1a1aa', '#d4d4d8']

// Default 6-month window: last 6 calendar months
function defaultDateRange() {
  const to = new Date()
  const from = new Date()
  from.setMonth(from.getMonth() - 6)
  return {
    from: from.toISOString().split('T')[0],
    to: to.toISOString().split('T')[0],
  }
}

export const AdminAnalyticsPage: React.FC = () => {
  const { token } = useAuth()
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState(defaultDateRange)

  const fetchAnalytics = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const params = new URLSearchParams({ from: dateRange.from, to: dateRange.to })
      const res = await fetch(`/api/admin/analytics?${params}`, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || 'Failed to load analytics.')
      }
      setData(await res.json())
    } catch (err: any) {
      setError(err.message || 'Unable to compute analytics.')
    } finally {
      setIsLoading(false)
    }
  }, [token, dateRange])

  useEffect(() => { fetchAnalytics() }, [fetchAnalytics])

  const hasOrders = (data?.totalOrders ?? 0) > 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-border gap-4">
        <div>
          <span className="editorial-badge text-muted">Intelligence & Economics</span>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight mt-1">
            Store Business Analytics
          </h1>
          <p className="text-xs text-muted mt-0.5">
            All metrics calculated from real database records. No estimates or projections.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs flex-wrap">
          <div className="flex items-center gap-1.5 border border-border bg-background px-2 py-1.5">
            <label className="text-[10px] text-muted uppercase tracking-wider">From</label>
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange((prev) => ({ ...prev, from: e.target.value }))}
              className="bg-transparent text-xs focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-1.5 border border-border bg-background px-2 py-1.5">
            <label className="text-[10px] text-muted uppercase tracking-wider">To</label>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange((prev) => ({ ...prev, to: e.target.value }))}
              className="bg-transparent text-xs focus:outline-none"
            />
          </div>
          <button
            onClick={fetchAnalytics}
            disabled={isLoading}
            className="h-9 px-3 border border-border text-xs flex items-center gap-1.5 hover:bg-surface transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Apply</span>
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-3">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
          <button onClick={fetchAnalytics} className="underline ml-auto">Retry</button>
        </div>
      )}

      {/* Loading skeleton */}
      {isLoading ? (
        <div className="p-16 text-center">
          <div className="w-6 h-6 border-2 border-foreground border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <span className="text-xs text-muted">Computing analytics from database...</span>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-background border border-border p-5">
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted">Total Revenue</span>
              <p className="text-2xl font-semibold text-foreground mt-2">
                {data ? formatCurrency(data.totalRevenue) : '₹0'}
              </p>
              <span className="text-xs text-muted mt-1 inline-block">
                {data?.totalOrders ?? 0} order{(data?.totalOrders ?? 0) !== 1 ? 's' : ''} in period
              </span>
            </div>

            <div className="bg-background border border-border p-5">
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted">Average Order Value</span>
              <p className="text-2xl font-semibold text-foreground mt-2">
                {data && data.totalOrders > 0 ? formatCurrency(data.avgOrderValue) : '—'}
              </p>
              <span className="text-xs text-muted mt-1 inline-block">
                {(data?.totalOrders ?? 0) > 0 ? 'From real completed orders' : 'No orders yet'}
              </span>
            </div>

            <div className="bg-background border border-border p-5">
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted">Registered Customers</span>
              <p className="text-2xl font-semibold text-foreground mt-2">
                {data?.totalCustomers ?? 0}
              </p>
              <span className="text-xs text-muted mt-1 inline-block">Active accounts (all time)</span>
            </div>

            <div className="bg-background border border-border p-5">
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted">Repeat Client Ratio</span>
              <p className="text-2xl font-semibold text-foreground mt-2">
                {data && data.totalOrders > 0 ? `${data.repeatRatio}%` : '—'}
              </p>
              <span className="text-xs text-muted mt-1 inline-block">
                {(data?.totalOrders ?? 0) > 0 ? 'Customers with 2+ orders' : 'Insufficient data'}
              </span>
            </div>
          </div>

          {/* No-data banner */}
          {!hasOrders && (
            <div className="bg-surface border border-border p-8 text-center space-y-2">
              <BarChart2 className="w-10 h-10 text-border mx-auto" />
              <p className="text-sm font-medium text-foreground">No Sales Data Yet</p>
              <p className="text-xs text-muted max-w-sm mx-auto">
                Revenue charts, category breakdowns, and product performance will appear here once real
                orders are recorded. All metrics are calculated exclusively from actual database records.
              </p>
            </div>
          )}

          {/* Revenue chart — only when orders exist */}
          {hasOrders && data && data.monthlyRevenue.length > 0 && (
            <div className="bg-background border border-border p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 pb-2 border-b border-border">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-foreground">
                    Monthly Revenue & Order Volume
                  </h3>
                  <p className="text-[11px] text-muted mt-0.5">Actual revenue from confirmed orders</p>
                </div>
                <span className="text-xs font-mono font-semibold text-foreground mt-2 sm:mt-0">
                  {data.monthlyRevenue.length} month{data.monthlyRevenue.length !== 1 ? 's' : ''} of data
                </span>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.monthlyRevenue}>
                    <CartesianGrid stroke="#f0f0f0" strokeDasharray="3 3" />
                    <XAxis dataKey="month" stroke="#888888" fontSize={11} tickLine={false} />
                    <YAxis
                      stroke="#888888"
                      fontSize={10}
                      tickLine={false}
                      tickFormatter={(val) =>
                        val >= 100000 ? `₹${(val / 100000).toFixed(0)}L` : `₹${val.toLocaleString('en-IN')}`
                      }
                    />
                    <Tooltip
                      formatter={(val) => [formatCurrency(Number(val ?? 0)), 'Revenue']}
                      contentStyle={{ backgroundColor: '#111', color: '#fff', border: 'none', fontSize: '11px' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#18181b"
                      strokeWidth={2.5}
                      dot={{ fill: '#18181b', r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Category + Top Products — only when orders exist */}
          {hasOrders && data && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Category Breakdown */}
              <div className="lg:col-span-5 bg-background border border-border p-6">
                <div className="mb-6 pb-2 border-b border-border">
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-foreground">
                    Sales Distribution by Category
                  </h3>
                  <p className="text-[11px] text-muted mt-0.5">From actual order items</p>
                </div>

                {data.categorySales.length === 0 ? (
                  <p className="text-xs text-muted py-8 text-center">No category sales data yet.</p>
                ) : (
                  <>
                    <div className="h-52 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={data.categorySales}
                            dataKey="value"
                            nameKey="category"
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={80}
                            paddingAngle={2}
                          >
                            {data.categorySales.map((_, i) => (
                              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(val) => [formatCurrency(Number(val ?? 0)), 'Revenue']}
                            contentStyle={{ backgroundColor: '#111', color: '#fff', border: 'none', fontSize: '11px' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-2 pt-4 border-t border-border text-xs">
                      {data.categorySales.map((c, i) => (
                        <div key={i} className="flex justify-between items-center">
                          <span className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                            <span className="text-muted capitalize">{c.category.replace(/-/g, ' ')}</span>
                          </span>
                          <span className="font-semibold text-foreground">{formatCurrency(c.value)}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Top Products by Revenue */}
              <div className="lg:col-span-7 bg-background border border-border p-6">
                <div className="mb-4 pb-2 border-b border-border">
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-foreground">
                    Top Performing Designs
                  </h3>
                  <p className="text-[11px] text-muted mt-0.5">Ranked by actual revenue from orders</p>
                </div>

                {data.topProducts.length === 0 ? (
                  <p className="text-xs text-muted py-8 text-center">No product sales data yet.</p>
                ) : (
                  <div className="divide-y divide-border">
                    {data.topProducts.map((p, idx) => (
                      <div key={idx} className="py-3 flex items-center justify-between gap-4 text-xs">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-muted text-[11px] w-4">{idx + 1}</span>
                          {p.image ? (
                            <img src={p.image} alt={p.name} className="w-9 h-11 object-cover border border-border shrink-0" />
                          ) : (
                            <div className="w-9 h-11 border border-border shrink-0 bg-surface" />
                          )}
                          <div>
                            <span className="font-medium text-foreground block">{p.name}</span>
                            <span className="text-[10px] text-muted font-mono">{p.sku}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-semibold text-foreground block">{formatCurrency(p.revenue)}</span>
                          <span className="text-[11px] text-muted">{p.units} unit{p.units !== 1 ? 's' : ''} sold</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
