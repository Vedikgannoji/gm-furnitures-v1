import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Plus, Minus, Search, Boxes, RefreshCw } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Product } from '@/types'
import { useToast } from '@/context/ToastContext'
import { useAuth } from '@/context/AuthContext'
import { API_BASE } from '@/lib/api'

export const AdminInventoryPage: React.FC = () => {
  const { showToast } = useToast()
  const { token } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  // Track in-flight stock patches to disable steppers during request
  const [patchingIds, setPatchingIds] = useState<Set<string>>(new Set())

  const fetchProducts = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const res = await fetch(`${API_BASE}/api/admin/products`, {
        cache: 'no-store',
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || 'Failed to load products.')
      }
      const data = await res.json()
      setProducts(data)
    } catch (err: any) {
      setError(err.message || 'Unable to connect to database.')
    } finally {
      setIsLoading(false)
    }
  }, [token])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  const handleAdjustStock = async (productId: string, delta: number) => {
    setPatchingIds((prev) => new Set(prev).add(productId))
    try {
      const res = await fetch(`${API_BASE}/api/admin/products/${productId}/stock`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ delta }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Stock update failed.')

      setProducts((prev) =>
        prev.map((p) => {
          if (p.id !== productId) return p
          const newStock: number = data.stock
          const threshold = p.threshold ?? 3
          const stockStatus =
            newStock === 0 ? 'out_of_stock' : newStock <= threshold ? 'low_stock' : 'in_stock'
          showToast('Stock Updated', `${p.name} → ${newStock} units.`, 'info')
          return { ...p, stock: newStock, stockStatus }
        })
      )
    } catch (err: any) {
      showToast('Update Failed', err.message, 'error')
    } finally {
      setPatchingIds((prev) => {
        const next = new Set(prev)
        next.delete(productId)
        return next
      })
    }
  }

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const threshold = p.threshold ?? 3
      const stockStatus =
        p.stock === 0 ? 'out_of_stock' : p.stock <= threshold ? 'low_stock' : 'in_stock'
      const matchSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase())
      const matchStatus = statusFilter === 'all' || stockStatus === statusFilter
      return matchSearch && matchStatus
    })
  }, [products, searchQuery, statusFilter])

  // KPI calculations from real product data
  const totalUnits = products.reduce((sum, p) => sum + p.stock, 0)
  const lowStockCount = products.filter((p) => {
    const t = p.threshold ?? 3
    return p.stock > 0 && p.stock <= t
  }).length
  const outOfStockCount = products.filter((p) => p.stock === 0).length

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
            Live stock from the products database. Use +/− to adjust; changes persist immediately.
          </p>
        </div>
        <button
          onClick={fetchProducts}
          disabled={isLoading}
          className="h-9 px-3 border border-border text-xs flex items-center gap-1.5 hover:bg-surface transition-colors self-start"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* KPI cards — always show real counts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-background border border-border p-4">
          <span className="text-[10px] text-muted uppercase tracking-wider block">Total Finished Units</span>
          <span className="text-2xl font-semibold text-foreground mt-1 block">{totalUnits} Units</span>
          <span className="text-[11px] text-muted mt-1 block">
            Across {products.length} registered SKU{products.length !== 1 ? 's' : ''}
          </span>
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

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchProducts} className="underline ml-4">Retry</button>
        </div>
      )}

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
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 px-3 bg-surface border border-border text-xs focus:border-foreground focus:outline-none cursor-pointer w-full sm:w-auto"
        >
          <option value="all">All Inventory States</option>
          <option value="in_stock">In Stock</option>
          <option value="low_stock">Low Stock Alerts</option>
          <option value="out_of_stock">Out of Stock</option>
        </select>
      </div>

      {/* Inventory Table */}
      <div className="bg-background border border-border overflow-x-auto">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="w-6 h-6 border-2 border-foreground border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <span className="text-xs text-muted">Loading inventory from database...</span>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <Boxes className="w-10 h-10 text-border mx-auto" />
            <p className="text-sm font-medium text-foreground">
              {products.length === 0 ? 'No Products Yet' : 'No matching products'}
            </p>
            <p className="text-xs text-muted max-w-xs mx-auto">
              {products.length === 0
                ? 'Add products from the Products section to begin managing stock.'
                : 'Adjust your search or filter to find products.'}
            </p>
            {products.length === 0 && (
              <Link
                to="/admin/products/new"
                className="inline-block mt-2 text-xs font-medium text-foreground underline"
              >
                Add First Product →
              </Link>
            )}
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border bg-surface text-muted uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4 font-semibold">Furniture Piece</th>
                <th className="py-3 px-4 font-semibold">SKU</th>
                <th className="py-3 px-4 font-semibold text-center">Threshold</th>
                <th className="py-3 px-4 font-semibold text-center">Current Stock</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Quick Adjust</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredProducts.map((p) => {
                const threshold = p.threshold ?? 3
                const stockStatus =
                  p.stock === 0 ? 'out_of_stock' : p.stock <= threshold ? 'low_stock' : 'in_stock'
                const isPatching = patchingIds.has(p.id)
                const displayImg = p.images?.[0] || ''

                return (
                  <tr key={p.id} className="hover:bg-surface/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {displayImg ? (
                          <img
                            src={displayImg}
                            alt={p.name}
                            className="w-9 h-11 object-cover border border-border shrink-0 bg-surface"
                          />
                        ) : (
                          <div className="w-9 h-11 bg-surface border border-border shrink-0" />
                        )}
                        <div>
                          <span className="font-medium text-foreground block">{p.name}</span>
                          <span className="text-[11px] text-muted capitalize">{p.category}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-medium">{p.sku}</td>
                    <td className="py-3 px-4 text-center text-muted font-mono">{threshold}</td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`font-bold font-mono text-sm ${
                          p.stock === 0 ? 'text-rose-600' : p.stock <= threshold ? 'text-amber-700' : 'text-foreground'
                        }`}
                      >
                        {p.stock}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 text-[9px] font-semibold tracking-wider uppercase border ${
                          stockStatus === 'in_stock'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : stockStatus === 'low_stock'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-rose-50 text-rose-800 border-rose-200'
                        }`}
                      >
                        {stockStatus.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center border border-border bg-background">
                        <button
                          onClick={() => handleAdjustStock(p.id, -1)}
                          disabled={isPatching || p.stock === 0}
                          className="w-7 h-7 flex items-center justify-center hover:bg-surface text-muted hover:text-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          title="Decrement stock"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center text-xs font-mono font-semibold">
                          {isPatching ? '…' : p.stock}
                        </span>
                        <button
                          onClick={() => handleAdjustStock(p.id, +1)}
                          disabled={isPatching}
                          className="w-7 h-7 flex items-center justify-center hover:bg-surface text-muted hover:text-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          title="Increment stock"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
