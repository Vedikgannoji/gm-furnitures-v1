import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Plus, Tag, Trash2, Edit2, CheckCircle2, XCircle, RefreshCw, AlertCircle, Search } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { formatCurrency } from '@/lib/utils'
import { useToast } from '@/context/ToastContext'
import { useAuth } from '@/context/AuthContext'

interface Coupon {
  id: string
  code: string
  discountType: 'percent' | 'fixed'
  discountValue: number
  isActive: boolean
  createdAt: string
  updatedAt?: string
}

export const AdminCouponsPage: React.FC = () => {
  const { token } = useAuth()
  const { showToast } = useToast()

  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form Fields
  const [formData, setFormData] = useState<{
    code: string
    discountType: 'percent' | 'fixed'
    discountValue: string
    isActive: boolean
  }>({
    code: '',
    discountType: 'percent',
    discountValue: '',
    isActive: true,
  })

  // Delete Confirm State
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchCoupons = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const res = await fetch('/api/admin/coupons', {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || 'Failed to fetch coupons.')
      }
      const data = await res.json()
      setCoupons(data)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to connect to database.'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchCoupons()
  }, [fetchCoupons])

  const openAddModal = () => {
    setEditingCoupon(null)
    setFormData({
      code: '',
      discountType: 'percent',
      discountValue: '',
      isActive: true,
    })
    setIsModalOpen(true)
  }

  const openEditModal = (coupon: Coupon) => {
    setEditingCoupon(coupon)
    setFormData({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: String(coupon.discountValue),
      isActive: coupon.isActive,
    })
    setIsModalOpen(true)
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const cleanCode = formData.code.trim().toUpperCase()
    if (!cleanCode) {
      showToast('Validation Error', 'Coupon code is required.', 'error')
      return
    }

    const numValue = Number(formData.discountValue)
    if (isNaN(numValue) || numValue <= 0) {
      showToast('Validation Error', 'Discount value must be a positive number.', 'error')
      return
    }

    if (formData.discountType === 'percent' && numValue > 100) {
      showToast('Validation Error', 'Percentage discount cannot exceed 100%.', 'error')
      return
    }

    try {
      setIsSubmitting(true)
      if (editingCoupon) {
        // Edit existing coupon
        const res = await fetch(`/api/admin/coupons/${editingCoupon.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            code: cleanCode,
            discountType: formData.discountType,
            discountValue: numValue,
            isActive: formData.isActive,
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to update coupon.')

        showToast('Coupon Updated', `Coupon "${cleanCode}" saved successfully.`, 'success')
      } else {
        // Create new coupon
        const res = await fetch('/api/admin/coupons', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            code: cleanCode,
            discountType: formData.discountType,
            discountValue: numValue,
            isActive: formData.isActive,
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to create coupon.')

        showToast('Coupon Created', `Coupon "${cleanCode}" added successfully.`, 'success')
      }

      setIsModalOpen(false)
      fetchCoupons()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Operation failed.'
      showToast('Error', message, 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleStatus = async (coupon: Coupon) => {
    try {
      const nextActive = !coupon.isActive
      const res = await fetch(`/api/admin/coupons/${coupon.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ isActive: nextActive }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || 'Failed to update coupon status.')
      }
      setCoupons((prev) =>
        prev.map((c) => (c.id === coupon.id ? { ...c, isActive: nextActive } : c))
      )
      showToast(
        'Status Changed',
        `Coupon ${coupon.code} is now ${nextActive ? 'Active' : 'Disabled'}.`,
        'success'
      )
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to change status.'
      showToast('Error', message, 'error')
    }
  }

  const handleDelete = async (id: string, code: string) => {
    try {
      const res = await fetch(`/api/admin/coupons/${id}`, {
        method: 'DELETE',
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || 'Failed to delete coupon.')
      }
      setCoupons((prev) => prev.filter((c) => c.id !== id))
      setDeletingId(null)
      showToast('Coupon Deleted', `Coupon "${code}" has been removed.`, 'success')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Delete failed.'
      showToast('Error', message, 'error')
    }
  }

  const filteredCoupons = useMemo(() => {
    return coupons.filter((c) => {
      const q = searchQuery.toLowerCase().trim()
      return !q || c.code.toLowerCase().includes(q)
    })
  }, [coupons, searchQuery])

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-border gap-4">
        <div>
          <span className="editorial-badge text-muted">Promotional Management</span>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight mt-1">
            Coupons & Discounts
          </h1>
          <p className="text-xs text-muted mt-0.5">
            Configure percentage and fixed value checkout coupons backed by Neon PostgreSQL.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start">
          <button
            onClick={fetchCoupons}
            disabled={isLoading}
            className="h-9 px-3 border border-border text-xs flex items-center gap-1.5 hover:bg-surface transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <Button variant="primary" size="sm" onClick={openAddModal} className="flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" />
            <span>Add Coupon</span>
          </Button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-background border border-border p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Search by coupon code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 bg-surface pl-8 pr-3 text-xs border border-border focus:border-foreground focus:outline-none uppercase"
          />
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-3 text-muted" />
        </div>
        <span className="text-xs text-muted">
          Total Coupons: <strong className="text-foreground">{coupons.length}</strong>
        </span>
      </div>

      {/* Error alert */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={fetchCoupons} className="underline ml-4">Retry</button>
        </div>
      )}

      {/* Coupons Table */}
      <div className="bg-background border border-border overflow-x-auto shadow-sm">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="w-6 h-6 border-2 border-foreground border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <span className="text-xs text-muted">Loading coupons from database...</span>
          </div>
        ) : filteredCoupons.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <Tag className="w-10 h-10 text-border mx-auto" />
            <p className="text-sm font-medium text-foreground">
              {coupons.length === 0 ? 'No Coupons Created Yet' : 'No matching coupons'}
            </p>
            <p className="text-xs text-muted max-w-xs mx-auto">
              {coupons.length === 0
                ? 'Create a coupon like WELCOME10 (10%) or GM5000 (₹5,000) for your customers.'
                : 'Try adjusting your search query.'}
            </p>
            {coupons.length === 0 && (
              <Button variant="outline" size="sm" onClick={openAddModal}>
                Create First Coupon
              </Button>
            )}
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border bg-surface text-muted uppercase text-[10px] tracking-wider">
                <th className="py-3.5 px-4 font-semibold">Coupon Code</th>
                <th className="py-3.5 px-4 font-semibold">Discount Type</th>
                <th className="py-3.5 px-4 font-semibold">Discount Value</th>
                <th className="py-3.5 px-4 font-semibold">Status</th>
                <th className="py-3.5 px-4 font-semibold">Created Date</th>
                <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredCoupons.map((c) => (
                <tr key={c.id} className="hover:bg-surface/50 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-foreground tracking-wider">
                    {c.code}
                  </td>
                  <td className="py-3.5 px-4 uppercase tracking-wider text-[11px] font-medium text-muted">
                    {c.discountType === 'percent' ? 'Percentage' : 'Fixed Value'}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-foreground">
                    {c.discountType === 'percent' ? `${c.discountValue}% OFF` : `${formatCurrency(c.discountValue)} OFF`}
                  </td>
                  <td className="py-3.5 px-4">
                    <button
                      onClick={() => handleToggleStatus(c)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase border transition-colors cursor-pointer ${
                        c.isActive
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                          : 'bg-zinc-100 text-zinc-600 border-zinc-200 hover:bg-zinc-200'
                      }`}
                      title="Click to toggle status"
                    >
                      {c.isActive ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Active</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3 text-zinc-500" />
                          <span>Disabled</span>
                        </>
                      )}
                    </button>
                  </td>
                  <td className="py-3.5 px-4 text-muted">
                    {new Date(c.createdAt).toLocaleDateString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditModal(c)}
                        className="p-1 text-muted hover:text-foreground transition-colors"
                        title="Edit coupon"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingId(c.id)}
                        className="p-1 text-muted hover:text-rose-600 transition-colors"
                        title="Delete coupon"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCoupon ? `Edit Coupon: ${editingCoupon.code}` : 'Create New Coupon'}
        maxWidth="md"
      >
        <form onSubmit={handleFormSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wider text-muted mb-1">
              Coupon Code *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. WELCOME10 or GM5000"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              className="w-full h-10 bg-background border border-border px-3 font-mono font-semibold uppercase tracking-wider text-xs focus:border-foreground focus:outline-none"
            />
            <p className="text-[10px] text-muted mt-1">Codes will be automatically converted to uppercase.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-muted mb-1">
                Discount Type *
              </label>
              <select
                value={formData.discountType}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    discountType: e.target.value as 'percent' | 'fixed',
                  })
                }
                className="w-full h-10 bg-background border border-border px-3 text-xs focus:border-foreground focus:outline-none cursor-pointer"
              >
                <option value="percent">Percentage (%)</option>
                <option value="fixed">Fixed Value (₹)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-muted mb-1">
                Discount Value *
              </label>
              <input
                type="number"
                required
                min="1"
                max={formData.discountType === 'percent' ? '100' : undefined}
                step="any"
                placeholder={formData.discountType === 'percent' ? 'e.g. 10' : 'e.g. 5000'}
                value={formData.discountValue}
                onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                className="w-full h-10 bg-background border border-border px-3 text-xs focus:border-foreground focus:outline-none font-mono"
              />
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 accent-foreground"
              />
              <span className="text-xs text-foreground font-medium">Coupon is Active for Customers</span>
            </label>
            <p className="text-[10px] text-muted mt-0.5 ml-6">
              When enabled, customers can apply this coupon code at checkout.
            </p>
          </div>

          <div className="pt-4 border-t border-border flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
              {editingCoupon ? 'Save Changes' : 'Create Coupon'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <Modal
          isOpen={Boolean(deletingId)}
          onClose={() => setDeletingId(null)}
          title="Confirm Coupon Deletion"
          maxWidth="sm"
        >
          <div className="p-6 space-y-4 text-xs">
            <p className="text-foreground">
              Are you sure you want to delete this coupon? Historical orders that used this coupon will remain completely intact.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setDeletingId(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="bg-rose-700 hover:bg-rose-800 text-white"
                onClick={() => {
                  const target = coupons.find((c) => c.id === deletingId)
                  if (target) handleDelete(target.id, target.code)
                }}
              >
                Delete Coupon
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
