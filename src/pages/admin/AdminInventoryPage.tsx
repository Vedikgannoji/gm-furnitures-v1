import React, { useState, useMemo } from 'react'
import { Plus, Minus, Search, AlertTriangle, Boxes, CheckCircle2, RotateCcw } from 'lucide-react'
import { mockProducts } from '@/data/mockData'
import { Product } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { useToast } from '@/context/ToastContext'

export const AdminInventoryPage: React.FC = () => {
  const { showToast } = useToast()
  const [products, setProducts] = useState<Product[]>(mockProducts)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const handleAdjustStock = (productId: string, delta: number) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          const newStock = Math.max(0, p.stock + delta)
          let newStatus = p.stockStatus
          if (newStock === 0) newStatus = 'out_of_stock'
          else if (newStock <= (p.threshold || 3)) newStatus = 'low_stock'
          else newStatus = 'in_stock'

          showToast('Stock Adjusted', `${p.name} updated to ${newStock} units.`, 'info')
          return {
            ...p,
            stock: newStock,
            stockStatus: newStatus,
          }
        }
        return p
      })
    )
  }

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase())
      const matchStatus = statusFilter === 'all' || p.stockStatus === statusFilter
      return matchSearch && matchStatus
    })
  }, [products, searchQuery, statusFilter])

  const totalUnits = products.reduce((sum, p) => sum + p.stock, 0)
  const lowStockCount = products.filter((p) => p.stockStatus === 'low_stock').length
  const outOfStockCount = products.filter((p) => p.stockStatus === 'out_of_stock').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-border gap-4">
        <div>
          <span className="editorial-badge text-muted">Warehouse Log</span>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight mt-1">
            Inventory & Stock Controls
          </h1>
          <p className="text-xs text-muted mt-0.5">
            Monitor real-time warehouse inventory, manage threshold triggers, and adjust allocations.
          </p>
        </div>
      </div>

      {/* Mini KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-background border border-border p-4">
          <span className="text-[10px] text-muted uppercase tracking-wider block">Total Finished Units</span>
          <span className="text-2xl font-semibold text-foreground mt-1 block">{totalUnits} Units</span>
          <span className="text-[11px] text-muted mt-1 block">Across {products.length} registered SKUs</span>
        </div>

        <div className="bg-background border border-border p-4">
          <span className="text-[10px] text-amber-700 uppercase tracking-wider block font-medium">Low Stock Warning</span>
          <span className="text-2xl font-semibold text-amber-700 mt-1 block">{lowStockCount} SKUs</span>
          <span className="text-[11px] text-muted mt-1 block">Below designated safety threshold</span>
        </div>

        <div className="bg-background border border-border p-4">
          <span className="text-[10px] text-rose-600 uppercase tracking-wider block font-medium">Depleted / Out of Stock</span>
          <span className="text-2xl font-semibold text-rose-600 mt-1 block">{outOfStockCount} SKUs</span>
          <span className="text-[11px] text-muted mt-1 block">Backorder / Made-to-order mode</span>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-background border border-border p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Search piece or SKU identifier..."
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
            <option value="all">All Inventory States</option>
            <option value="in_stock">In Stock Normal</option>
            <option value="low_stock">Low Stock Alerts</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-background border border-border overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-border bg-surface text-muted uppercase text-[10px] tracking-wider">
              <th className="py-3 px-4 font-semibold">Furniture Piece</th>
              <th className="py-3 px-4 font-semibold">SKU</th>
              <th className="py-3 px-4 font-semibold text-center">Threshold</th>
              <th className="py-3 px-4 font-semibold text-center">Current Stock</th>
              <th className="py-3 px-4 font-semibold">Status</th>
              <th className="py-3 px-4 font-semibold text-right">Quick Stock Stepper</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredProducts.map((p) => (
              <tr key={p.id} className="hover:bg-surface/50 transition-colors">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <img src={p.images[0]} alt={p.name} className="w-9 h-11 object-cover border border-border shrink-0" />
                    <div>
                      <span className="font-medium text-foreground block">{p.name}</span>
                      <span className="text-[11px] text-muted capitalize">{p.category}</span>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4 font-mono font-medium">{p.sku}</td>
                <td className="py-3 px-4 text-center text-muted font-mono">{p.threshold || 3}</td>
                <td className="py-3 px-4 text-center">
                  <span
                    className={`font-bold font-mono text-sm ${
                      p.stock === 0
                        ? 'text-rose-600'
                        : p.stock <= (p.threshold || 3)
                        ? 'text-amber-700'
                        : 'text-foreground'
                    }`}
                  >
                    {p.stock}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span
                    className={`px-2 py-0.5 text-[9px] font-semibold tracking-wider uppercase border ${
                      p.stockStatus === 'in_stock'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : p.stockStatus === 'low_stock'
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-rose-50 text-rose-800 border-rose-200'
                    }`}
                  >
                    {p.stockStatus.replace('_', ' ')}
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="inline-flex items-center border border-border bg-background">
                    <button
                      onClick={() => handleAdjustStock(p.id, -1)}
                      className="w-7 h-7 flex items-center justify-center hover:bg-surface text-muted hover:text-foreground transition-colors"
                      title="Decrement stock unit"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-8 text-center text-xs font-mono font-semibold">
                      {p.stock}
                    </span>
                    <button
                      onClick={() => handleAdjustStock(p.id, +1)}
                      className="w-7 h-7 flex items-center justify-center hover:bg-surface text-muted hover:text-foreground transition-colors"
                      title="Increment stock unit"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
