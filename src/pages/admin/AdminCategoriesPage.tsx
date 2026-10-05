import React, { useState, useEffect } from 'react'
import { Plus, Edit3, Trash2, ExternalLink, Loader2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Category } from '@/types'
import { useToast } from '@/context/ToastContext'

export const AdminCategoriesPage: React.FC = () => {
  const { showToast } = useToast()
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    image: '',
  })

  const fetchCategories = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/categories')
      if (res.ok) {
        const data = await res.json()
        setCategories(data)
      } else {
        showToast('Error', 'Failed to load categories from database.', 'error')
      }
    } catch {
      showToast('Error', 'Network error loading categories.', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const openAdd = () => {
    setEditingCategory(null)
    setFormData({ name: '', slug: '', description: '', image: '' })
    setIsModalOpen(true)
  }

  const openEdit = (cat: Category) => {
    setEditingCategory(cat)
    setFormData({
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      image: cat.image,
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete the category "${name}"?`)) {
      return
    }

    try {
      const token = localStorage.getItem('gm_auth_token')
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (res.ok) {
        setCategories((prev) => prev.filter((c) => c.id !== id))
        showToast('Category Deleted', `Category "${name}" was permanently removed.`, 'info')
      } else {
        const err = await res.json()
        showToast('Delete Failed', err.message || 'Could not delete category.', 'error')
      }
    } catch {
      showToast('Error', 'Network error deleting category.', 'error')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    const token = localStorage.getItem('gm_auth_token')

    try {
      if (editingCategory) {
        const res = await fetch(`/api/admin/categories/${editingCategory.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        })
        if (res.ok) {
          const updated = await res.json()
          setCategories((prev) =>
            prev.map((c) => (c.id === editingCategory.id ? updated : c))
          )
          showToast('Category Updated', `Category "${formData.name}" saved.`, 'success')
          setIsModalOpen(false)
        } else {
          const err = await res.json()
          showToast('Update Failed', err.message || 'Could not update category.', 'error')
        }
      } else {
        const res = await fetch('/api/admin/categories', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        })
        if (res.ok) {
          const created = await res.json()
          setCategories((prev) => [...prev, created])
          showToast('Category Created', `New category "${formData.name}" added to database.`, 'success')
          setIsModalOpen(false)
        } else {
          const err = await res.json()
          showToast('Creation Failed', err.message || 'Could not create category.', 'error')
        }
      }
    } catch {
      showToast('Error', 'Network error saving category.', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-border gap-4">
        <div>
          <span className="editorial-badge text-muted">Categories</span>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight mt-1">
            Furniture Categories
          </h1>
          <p className="text-xs text-muted mt-0.5">
            Manage product categories, cover photos, and descriptions stored in PostgreSQL.
          </p>
        </div>

        <Button variant="primary" size="md" onClick={openAdd} className="flex items-center gap-1.5">
          <Plus className="w-4 h-4" />
          <span>Add Category</span>
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted" />
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-lg">
          <p className="text-sm font-medium text-foreground">No categories found in database</p>
          <p className="text-xs text-muted mt-1">Click "Add Category" above to create your first category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="bg-background border border-border flex flex-col justify-between overflow-hidden"
            >
              <div>
                <div className="relative aspect-[16/9] w-full bg-surface overflow-hidden">
                  <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
                  <span className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/80 text-white text-[10px] uppercase font-mono">
                    {cat.itemCount || 0} Products
                  </span>
                </div>

                <div className="p-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-foreground">{cat.name}</h3>
                    <Link
                      to={`/shop/${cat.slug}`}
                      target="_blank"
                      className="text-muted hover:text-foreground p-1"
                      title="View live category page"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                  <p className="text-xs text-muted mt-2 line-clamp-2 leading-relaxed">
                    {cat.description}
                  </p>
                </div>
              </div>

              <div className="p-4 pt-0 border-t border-border mt-auto flex items-center justify-between text-xs">
                <span className="font-mono text-[11px] text-muted">/{cat.slug}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEdit(cat)}
                    className="p-1 text-muted hover:text-foreground transition-colors"
                    title="Edit category"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(cat.id, cat.name)}
                    className="p-1 text-muted hover:text-rose-600 transition-colors"
                    title="Delete category"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Category Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCategory ? 'Edit Category' : 'Create Category'}
        description="Configure category settings and storefront presentation."
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs pt-2">
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wider text-muted mb-1">
              Category Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  name: e.target.value,
                  slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
                })
              }
              className="w-full h-10 bg-background border border-border px-3 text-xs focus:border-foreground focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wider text-muted mb-1">
              URL Slug
            </label>
            <input
              type="text"
              required
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              className="w-full h-10 bg-background border border-border px-3 text-xs font-mono focus:border-foreground focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wider text-muted mb-1">
              Banner Image URL
            </label>
            <input
              type="url"
              value={formData.image}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              className="w-full h-10 bg-background border border-border px-3 text-xs focus:border-foreground focus:outline-none"
              placeholder="https://images.unsplash.com/..."
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wider text-muted mb-1">
              Description
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-background border border-border p-3 text-xs focus:border-foreground focus:outline-none"
              placeholder="Brief description of this furniture category"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Category'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
