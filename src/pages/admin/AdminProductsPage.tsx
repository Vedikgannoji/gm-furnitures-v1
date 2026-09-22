import React, { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Edit, Trash2, Eye, Filter, CheckCircle2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { mockProducts, mockCategories } from '@/data/mockData'
import { Product } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { useToast } from '@/context/ToastContext'

export const AdminProductsPage: React.FC = () => {
  const { showToast } = useToast()
  const [products, setProducts] = useState<Product[]>(mockProducts)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [deleteModalProduct, setDeleteModalProduct] = useState<Product | null>(null)

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase())
      const matchCat = categoryFilter === 'all' || p.category === categoryFilter
      const matchStatus = statusFilter === 'all' || p.stockStatus === statusFilter
      return matchSearch && matchCat && matchStatus
    })
  }, [products, searchQuery, categoryFilter, statusFilter])

  const handleDeleteConfirm = () => {
    if (deleteModalProduct) {
      setProducts((prev) => prev.filter((p) => p.id !== deleteModalProduct.id))
      showToast('Product Removed', `${deleteModalProduct.name} was deleted from catalog.`, 'info')
      setDeleteModalProduct(null)
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
            Manage SKUs, joinery specifications, price points, and published statuses.
          </p>
        </div>

        <Link to="/admin/products/new">
          <Button variant="primary" size="md" className="flex items-center gap-1.5">
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </Button>
        </Link>
      </div>

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
            {mockCategories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
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
            {filteredProducts.map((p) => (
              <tr key={p.id} className="hover:bg-surface/50 transition-colors">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={p.images[0]}
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
                        {p.material}
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
            ))}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deleteModalProduct)}
        onClose={() => setDeleteModalProduct(null)}
        title="Confirm Product Deletion"
        description="Are you sure you wish to remove this design from the active collection?"
      >
        {deleteModalProduct && (
          <div className="space-y-4 pt-2">
            <p className="text-xs text-muted">
              You are about to remove <span className="font-semibold text-foreground">{deleteModalProduct.name}</span> ({deleteModalProduct.sku}). This action is simulated in Phase 1.
            </p>
            <div className="flex justify-end gap-3 pt-3 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteModalProduct(null)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
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
