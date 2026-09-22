import React, { useState } from 'react'
import { Plus, Edit3, Trash2, FolderTree, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { mockCategories } from '@/data/mockData'
import { Category } from '@/types'
import { useToast } from '@/context/ToastContext'

export const AdminCategoriesPage: React.FC = () => {
  const { showToast } = useToast()
  const [categories, setCategories] = useState<Category[]>(mockCategories)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    image: '',
  })

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

  const handleDelete = (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id))
    showToast('Category Removed', 'Category was removed from active navigation.', 'info')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingCategory) {
      setCategories((prev) =>
        prev.map((c) =>
          c.id === editingCategory.id ? { ...c, ...formData } : c
        )
      )
      showToast('Category Updated', `"${formData.name}" was modified.`, 'success')
    } else {
      const newCat: Category = {
        id: `cat-${Date.now()}`,
        name: formData.name,
        slug: formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-'),
        description: formData.description,
        image: formData.image || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=80',
        itemCount: 0,
      }
      setCategories((prev) => [...prev, newCat])
      showToast('Category Created', `New category "${formData.name}" created.`, 'success')
    }
    setIsModalOpen(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-border gap-4">
        <div>
          <span className="editorial-badge text-muted">Taxonomy</span>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight mt-1">
            Furniture Categories
          </h1>
          <p className="text-xs text-muted mt-0.5">
            Configure architectural categories, cover images, and editorial descriptions.
          </p>
        </div>

        <Button variant="primary" size="md" onClick={openAdd} className="flex items-center gap-1.5">
          <Plus className="w-4 h-4" />
          <span>Add Category</span>
        </Button>
      </div>

      {/* Grid of categories */}
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
                  {cat.itemCount} Designs
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
                  onClick={() => handleDelete(cat.id)}
                  className="p-1 text-muted hover:text-rose-600 transition-colors"
                  title="Remove category"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Category Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCategory ? 'Edit Category' : 'Create Furniture Category'}
        description="Configure taxonomy parameters and storefront presentation."
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
                  slug: e.target.value.toLowerCase().replace(/\s+/g, '-'),
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
              Image Banner URL
            </label>
            <input
              type="url"
              value={formData.image}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              className="w-full h-10 bg-background border border-border px-3 text-xs focus:border-foreground focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wider text-muted mb-1">
              Editorial Description
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-background border border-border p-3 text-xs focus:border-foreground focus:outline-none"
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
            <Button type="submit" variant="primary" size="sm">
              Save Category
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
