import React from 'react'
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
  CartesianGrid,
} from 'recharts'
import { TrendingUp, Users, ShoppingBag, Target, ArrowUpRight } from 'lucide-react'
import { mockAnalyticsData, mockProducts } from '@/data/mockData'
import { formatCurrency } from '@/lib/utils'

export const AdminAnalyticsPage: React.FC = () => {
  const pieColors = ['#18181b', '#3f3f46', '#71717a', '#a1a1aa', '#d4d4d8']

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-border gap-4">
        <div>
          <span className="editorial-badge text-muted">Intelligence & Economics</span>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight mt-1">
            Atelier Business Analytics
          </h1>
          <p className="text-xs text-muted mt-0.5">
            Holistic metrics tracking revenue volume, client acquisition, and category performance.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-3 py-1.5 bg-background border border-border font-medium">
            Oct 2025 – Mar 2026
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-background border border-border p-5">
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted">
            Total Revenue (Period)
          </span>
          <p className="text-2xl font-semibold text-foreground mt-2">₹2,42,00,000</p>
          <span className="text-emerald-700 text-xs font-medium mt-1 inline-block">
            +32.8% vs previous 6 months
          </span>
        </div>

        <div className="bg-background border border-border p-5">
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted">
            Average Order Value (AOV)
          </span>
          <p className="text-2xl font-semibold text-foreground mt-2">
            {mockAnalyticsData.kpis.averageOrderValue}
          </p>
          <span className="text-emerald-700 text-xs font-medium mt-1 inline-block">
            +7.8% optimization
          </span>
        </div>

        <div className="bg-background border border-border p-5">
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted">
            Storefront Conversion Rate
          </span>
          <p className="text-2xl font-semibold text-foreground mt-2">
            {mockAnalyticsData.kpis.conversionRate}
          </p>
          <span className="text-emerald-700 text-xs font-medium mt-1 inline-block">
            Top 5% of luxury furniture
          </span>
        </div>

        <div className="bg-background border border-border p-5">
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted">
            Repeat Client Ratio
          </span>
          <p className="text-2xl font-semibold text-foreground mt-2">42.4%</p>
          <span className="text-muted text-xs mt-1 inline-block">Architects & Studio partners</span>
        </div>
      </div>

      {/* Full Width Revenue & Order Trends */}
      <div className="bg-background border border-border p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 pb-2 border-b border-border">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-foreground">
              Monthly Revenue & Order Volume
            </h3>
            <p className="text-[11px] text-muted mt-0.5">
              Dual metrics showing transaction volume and total revenue growth
            </p>
          </div>
          <span className="text-xs font-mono font-semibold text-foreground mt-2 sm:mt-0">
            6-Month Aggregate
          </span>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={mockAnalyticsData.monthlyRevenue}>
              <CartesianGrid stroke="#f0f0f0" strokeDasharray="3 3" />
              <XAxis dataKey="month" stroke="#888888" fontSize={11} tickLine={false} />
              <YAxis
                stroke="#888888"
                fontSize={10}
                tickLine={false}
                tickFormatter={(val) => `₹${(val / 100000).toFixed(0)}L`}
              />
              <Tooltip
                formatter={(val: number) => [formatCurrency(val), 'Gross Revenue']}
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

      {/* Two Columns: Category Breakdown + Top Performing Pieces */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Category Contribution */}
        <div className="lg:col-span-5 bg-background border border-border p-6">
          <div className="mb-6 pb-2 border-b border-border">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-foreground">
              Sales Distribution by Category
            </h3>
            <p className="text-[11px] text-muted mt-0.5">Contribution to atelier top-line</p>
          </div>

          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={mockAnalyticsData.categorySales}
                  dataKey="value"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                >
                  {mockAnalyticsData.categorySales.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: number) => [formatCurrency(val), 'Volume']}
                  contentStyle={{ backgroundColor: '#111', color: '#fff', border: 'none', fontSize: '11px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 pt-4 border-t border-border text-xs">
            {mockAnalyticsData.categorySales.map((c, i) => (
              <div key={i} className="flex justify-between items-center">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: pieColors[i] }} />
                  <span className="text-muted">{c.category}</span>
                </span>
                <span className="font-semibold text-foreground">{formatCurrency(c.value)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Performing Designs */}
        <div className="lg:col-span-7 bg-background border border-border p-6">
          <div className="mb-4 pb-2 border-b border-border">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-foreground">
              Top Velocity Architectural Designs
            </h3>
            <p className="text-[11px] text-muted mt-0.5">Ranked by revenue contribution</p>
          </div>

          <div className="divide-y divide-border">
            {mockProducts.slice(0, 5).map((p, idx) => (
              <div key={p.id} className="py-3 flex items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-muted text-[11px] w-4">{idx + 1}</span>
                  <img src={p.images[0]} alt={p.name} className="w-9 h-11 object-cover border border-border shrink-0" />
                  <div>
                    <span className="font-medium text-foreground block">{p.name}</span>
                    <span className="text-[10px] text-muted font-mono">{p.sku}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-semibold text-foreground block">
                    {formatCurrency(p.price * (p.reviewCount + 10))}
                  </span>
                  <span className="text-[11px] text-muted">{p.reviewCount + 10} orders completed</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
