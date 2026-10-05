import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Search, Users, RefreshCw } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'

interface RealCustomer {
  id: string
  name: string
  email: string
  provider: string
  joinedDate: string
  totalOrders: number
  totalSpent: number
  lastOrderDate: string | null
}

export const AdminCustomersPage: React.FC = () => {
  const { token } = useAuth()
  const [customers, setCustomers] = useState<RealCustomer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const fetchCustomers = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const res = await fetch('/api/admin/customers', {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || 'Failed to load customers.')
      }
      setCustomers(await res.json())
    } catch (err: any) {
      setError(err.message || 'Unable to connect to database.')
    } finally {
      setIsLoading(false)
    }
  }, [token])

  useEffect(() => { fetchCustomers() }, [fetchCustomers])

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase()
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q)
    )
  }, [customers, searchQuery])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-border gap-4">
        <div>
          <span className="editorial-badge text-muted">Client CRM</span>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight mt-1">
            Registered Clients & Architects
          </h1>
          <p className="text-xs text-muted mt-0.5">
            Live from the users table. Order counts and spend calculated from real order records.
          </p>
        </div>
        <button
          onClick={fetchCustomers}
          disabled={isLoading}
          className="h-9 px-3 border border-border text-xs flex items-center gap-1.5 hover:bg-surface transition-colors self-start"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-background border border-border p-4 flex items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 bg-surface pl-8 pr-3 text-xs border border-border focus:border-foreground focus:outline-none"
          />
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-3 text-muted" />
        </div>
        {!isLoading && (
          <span className="text-xs text-muted shrink-0">
            {filtered.length} client{filtered.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchCustomers} className="underline ml-4">Retry</button>
        </div>
      )}

      {/* Table */}
      <div className="bg-background border border-border overflow-x-auto">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="w-6 h-6 border-2 border-foreground border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <span className="text-xs text-muted">Loading customers from database...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <Users className="w-10 h-10 text-border mx-auto" />
            <p className="text-sm font-medium text-foreground">
              {customers.length === 0 ? 'No Customers Yet' : 'No matching customers'}
            </p>
            <p className="text-xs text-muted max-w-xs mx-auto">
              {customers.length === 0
                ? 'Customers will appear here after they register or place an order.'
                : 'Try a different search term.'}
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border bg-surface text-muted uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4 font-semibold">Client Name</th>
                <th className="py-3 px-4 font-semibold">Contact Email</th>
                <th className="py-3 px-4 font-semibold">Auth Provider</th>
                <th className="py-3 px-4 font-semibold text-center">Orders</th>
                <th className="py-3 px-4 font-semibold">Lifetime Spend</th>
                <th className="py-3 px-4 font-semibold">Last Order</th>
                <th className="py-3 px-4 font-semibold">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-surface/50 transition-colors">
                  <td className="py-3.5 px-4 font-medium text-foreground">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-surface border border-border flex items-center justify-center font-semibold text-[11px] shrink-0">
                        {c.name.slice(0, 2).toUpperCase()}
                      </div>
                      <span>{c.name}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-muted font-mono text-[11px]">{c.email}</td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 text-[9px] font-semibold tracking-wider uppercase border border-border bg-surface text-muted capitalize">
                      {c.provider}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center font-semibold">{c.totalOrders}</td>
                  <td className="py-3.5 px-4 font-semibold text-foreground">
                    {c.totalSpent > 0 ? formatCurrency(c.totalSpent) : <span className="text-muted font-normal">—</span>}
                  </td>
                  <td className="py-3.5 px-4 text-muted">
                    {c.lastOrderDate || <span className="italic">No orders</span>}
                  </td>
                  <td className="py-3.5 px-4 text-muted">{c.joinedDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
