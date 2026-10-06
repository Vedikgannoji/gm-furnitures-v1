import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Edit, Trash2, Eye, RefreshCw, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Product } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { useToast } from '@/context/ToastContext'
import { useAuth } from '@/context/AuthContext'
import { API_BASE } from '@/lib/api'

export const AdminProductsPage: React.FC = () => {
  const { showToast } = useToast()
  const { token } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [deleteModalProduct, setDeleteModalProduct] = useState<Product | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchProducts = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const res = await fetch(`${API_BASE}/api/admin/products`, {
        cache: 'no-store',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to retrieve products from database.')
      }

      const data = await res.json()
      setProducts(data)
    } catch (err: any) {
      console.error('Fetch admin products error:', err)
      setError(err.message || 'Unable to connect to database.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [token])

  const categories = useMemo(() => {
    const set = new Set<string>()
    products.forEach((p) => {
      if (p.category) set.add(p.category)
    })
    return Array.from(set)
  }, [products])

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()))
      const matchCat = categoryFilter === 'all' || p.category === categoryFilter
      const currentStockStatus = p.stockStatus || (p.stock === 0 ? 'out_of_stock' : p.stock <= 3 ? 'low_stock' : 'in_stock')
      const matchStatus = statusFilter === 'all' || currentStockStatus === statusFilter
      return matchSearch && matchCat && matchStatus
    })
  }, [products, searchQuery, categoryFilter, statusFilter])

  const handleDeleteConfirm = async () => {
    if (!deleteModalProduct) return
    try {
      setIsDeleting(true)
      const res = await fetch(`${API_BASE}/api/admin/products/${deleteModalProduct.id}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to delete product from database.')
      }

      showToast('Product Removed', `"${deleteModalProduct.name}" deleted from database.`, 'info')
      setProducts((prev) => prev.filter((p) => p.id !== deleteModalProduct.id))
      setDeleteModalProduct(null)
    } catch (err: any) {
      showToast('Delete Failed', err.message || 'Could not delete product.', 'error')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-border gap-4">
        <div>
          <span className="editorial-badge text-muted">Catalog Operations</span>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight mt-1">
            Furniture Product Registry
          </h1>
          <p className="text-xs text-muted mt-0.5">
            Manage SKUs, specifications, prices, and published statuses directly in PostgreSQL.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="md"
            onClick={fetchProducts}
            isLoading={isLoading}
            className="flex items-center gap-1.5"
            title="Refresh database records"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync</span>
          </Button>

          <Link to="/admin/products/new">
            <Button variant="primary" size="md" className="flex items-center gap-1.5">
              <Plus className="w-4 h-4" />
              <span>Add New Product</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
          <Button variant="outline" size="sm" onClick={fetchProducts}>
            Retry
          </Button>
        </div>
      )}

      {/* Filter / Search Bar */}
      <div className="bg-background border border-border p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="Search by piece title or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 bg-surface pl-8 pr-3 text-xs border border-border focus:border-foreground focus:outline-none"
          />
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-3 text-muted" />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Category filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-9 px-3 bg-surface border border-border text-xs focus:border-foreground focus:outline-none cursor-pointer"
          >
            <option value="all">All Categories ({products.length})</option>
            {categories.map((c) => (
              <option key={c} value={c} className="capitalize">
                {c.replace(/-/g, ' ')}
              </option>
            ))}
          </select>

          {/* Stock filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 px-3 bg-surface border border-border text-xs focus:border-foreground focus:outline-none cursor-pointer"
          >
            <option value="all">All Availability Statuses</option>
            <option value="in_stock">In Stock</option>
            <option value="low_stock">Low Stock</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>
        </div>
      </div>

      {/* Product Table */}
      <div className="bg-background border border-border overflow-x-auto">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="w-6 h-6 border-2 border-foreground border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <span className="text-xs text-muted">Retrieving products from SQLite database...</span>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-12 text-center text-xs text-muted">
            No products match the selected criteria.
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border bg-surface text-muted uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4 font-semibold">Piece</th>
                <th className="py-3 px-4 font-semibold">SKU</th>
                <th className="py-3 px-4 font-semibold">Category</th>
                <th className="py-3 px-4 font-semibold">Price</th>
                <th className="py-3 px-4 font-semibold">Stock</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredProducts.map((p) => {
                const stockStatus =
                  p.stockStatus || (p.stock === 0 ? 'out_of_stock' : p.stock <= 3 ? 'low_stock' : 'in_stock')
                const displayImg =
                  p.images && p.images.length > 0
                    ? p.images[0]
                    : 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80'

                return (
                  <tr key={p.id} className="hover:bg-surface/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={displayImg}
                          alt={p.name}
                          className="w-10 h-12 object-cover border border-border shrink-0 bg-surface"
                        />
                        <div className="truncate max-w-xs">
                          <Link
                            to={`/admin/products/${p.id}`}
                            className="font-medium text-foreground hover:underline truncate block"
                          >
                            {p.name}
                          </Link>
                          <span className="text-[11px] text-muted truncate block">
                            {p.material || 'Solid Hardwood'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-medium">{p.sku}</td>
                    <td className="py-3 px-4 capitalize text-muted">{p.category}</td>
                    <td className="py-3 px-4 font-semibold">{formatCurrency(p.price)}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`font-semibold ${
                          p.stock === 0
                            ? 'text-rose-600'
                            : p.stock <= 3
                            ? 'text-amber-700'
                            : 'text-foreground'
                        }`}
                      >
                        {p.stock} units
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
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/products/${p.slug}`}
                          target="_blank"
                          className="p-1 text-muted hover:text-foreground transition-colors"
                          title="Preview on live storefront"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                        <Link
                          to={`/admin/products/${p.id}`}
                          className="p-1 text-muted hover:text-foreground transition-colors"
                          title="Edit specifications"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => setDeleteModalProduct(p)}
                          className="p-1 text-muted hover:text-rose-600 transition-colors"
                          title="Delete piece"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deleteModalProduct)}
        onClose={() => !isDeleting && setDeleteModalProduct(null)}
        title="Confirm Product Deletion"
        description="Are you sure you wish to delete this design permanently from the database?"
      >
        {deleteModalProduct && (
          <div className="space-y-4 pt-2">
            <p className="text-xs text-muted">
              You are about to remove <span className="font-semibold text-foreground">{deleteModalProduct.name}</span> ({deleteModalProduct.sku}) permanently from the PostgreSQL database.
            </p>
            <div className="flex justify-end gap-3 pt-3 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                disabled={isDeleting}
                onClick={() => setDeleteModalProduct(null)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                isLoading={isDeleting}
                onClick={handleDeleteConfirm}
                className="bg-rose-600 text-white hover:bg-rose-700 border-rose-600"
              >
                Confirm Delete
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
