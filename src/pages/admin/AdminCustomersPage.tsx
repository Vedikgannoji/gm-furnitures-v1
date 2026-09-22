import React, { useState, useMemo } from 'react'
import { Search, Users, Mail, Phone, ShoppingBag, Eye } from 'lucide-react'
import { mockCustomers } from '@/data/mockData'
import { Customer } from '@/types'
import { formatCurrency } from '@/lib/utils'

export const AdminCustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const q = searchQuery.toLowerCase()
      return (
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q)
      )
    })
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
            Client order frequency, cumulative spending, and primary delivery locations.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-background border border-border p-4 flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Search by client name, email, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 bg-surface pl-8 pr-3 text-xs border border-border focus:border-foreground focus:outline-none"
          />
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-3 text-muted" />
        </div>
        <span className="text-xs text-muted">
          Showing {filteredCustomers.length} clients
        </span>
      </div>

      {/* Table */}
      <div className="bg-background border border-border overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-border bg-surface text-muted uppercase text-[10px] tracking-wider">
              <th className="py-3 px-4 font-semibold">Client Name</th>
              <th className="py-3 px-4 font-semibold">Contact Email</th>
              <th className="py-3 px-4 font-semibold">Phone</th>
              <th className="py-3 px-4 font-semibold text-center">Orders</th>
              <th className="py-3 px-4 font-semibold">Lifetime Spend</th>
              <th className="py-3 px-4 font-semibold">Last Commission</th>
              <th className="py-3 px-4 font-semibold text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredCustomers.map((c) => (
              <tr key={c.id} className="hover:bg-surface/50 transition-colors">
                <td className="py-3.5 px-4 font-medium text-foreground">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-surface border border-border flex items-center justify-center font-semibold text-[11px]">
                      {c.name.slice(0, 2).toUpperCase()}
                    </div>
                    <span>{c.name}</span>
                  </div>
                </td>
                <td className="py-3.5 px-4 text-muted font-mono text-[11px]">{c.email}</td>
                <td className="py-3.5 px-4 text-muted">{c.phone}</td>
                <td className="py-3.5 px-4 text-center font-semibold">{c.totalOrders}</td>
                <td className="py-3.5 px-4 font-semibold text-foreground">
                  {formatCurrency(c.totalSpent)}
                </td>
                <td className="py-3.5 px-4 text-muted">{c.lastOrderDate}</td>
                <td className="py-3.5 px-4 text-right">
                  <span className="px-2 py-0.5 text-[9px] font-semibold tracking-wider uppercase bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Active
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
