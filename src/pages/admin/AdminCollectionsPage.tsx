import React, { useState } from 'react'
import { Plus, Edit3, Trash2, Layers, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { mockCollections } from '@/data/mockData'
import { Collection } from '@/types'
import { useToast } from '@/context/ToastContext'

export const AdminCollectionsPage: React.FC = () => {
  const { showToast } = useToast()
  const [collections, setCollections] = useState<Collection[]>(mockCollections)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    tagline: '',
    description: '',
    image: '',
  })

  const openAdd = () => {
    setEditingCollection(null)
    setFormData({ name: '', slug: '', tagline: '', description: '', image: '' })
    setIsModalOpen(true)
  }

  const openEdit = (col: Collection) => {
    setEditingCollection(col)
    setFormData({
      name: col.name,
      slug: col.slug,
      tagline: col.tagline,
      description: col.description,
      image: col.image,
    })
    setIsModalOpen(true)
  }

  const handleDelete = (id: string) => {
    setCollections((prev) => prev.filter((c) => c.id !== id))
    showToast('Collection Removed', 'Collection capsule removed.', 'info')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingCollection) {
      setCollections((prev) =>
        prev.map((c) =>
          c.id === editingCollection.id ? { ...c, ...formData } : c
        )
      )
      showToast('Collection Updated', `"${formData.name}" updated.`, 'success')
    } else {
      const newCol: Collection = {
        id: `col-${Date.now()}`,
        name: formData.name,
        slug: formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-'),
        tagline: formData.tagline,
        description: formData.description,
        image: formData.image || 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1400&q=80',
        productCount: 0,
      }
      setCollections((prev) => [...prev, newCol])
      showToast('Collection Created', `New design capsule "${formData.name}" added.`, 'success')
    }
    setIsModalOpen(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-border gap-4">
        <div>
          <span className="editorial-badge text-muted">Capsules</span>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight mt-1">
            Design Collections
          </h1>
          <p className="text-xs text-muted mt-0.5">
            Manage thematic design capsules, editorial taglines, and featured compositions.
          </p>
        </div>

        <Button variant="primary" size="md" onClick={openAdd} className="flex items-center gap-1.5">
          <Plus className="w-4 h-4" />
          <span>Add Collection</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {collections.map((col) => (
          <div
            key={col.id}
            className="bg-background border border-border flex flex-col justify-between overflow-hidden"
          >
            <div>
              <div className="relative aspect-[16/9] w-full bg-surface overflow-hidden">
                <img src={col.image} alt={col.name} className="w-full h-full object-cover" />
                <span className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/80 text-white text-[10px] uppercase font-mono">
                  {col.productCount} Pieces
                </span>
              </div>

              <div className="p-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-foreground">{col.name}</h3>
                  <Link
                    to={`/collections/${col.slug}`}
                    target="_blank"
                    className="text-muted hover:text-foreground p-1"
                    title="View live storefront collection"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted mt-1">
                  "{col.tagline}"
                </p>
                <p className="text-xs text-muted mt-2 line-clamp-2 leading-relaxed">
                  {col.description}
                </p>
              </div>
            </div>

            <div className="p-4 pt-0 border-t border-border mt-auto flex items-center justify-between text-xs">
              <span className="font-mono text-[11px] text-muted">/{col.slug}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => openEdit(col)}
                  className="p-1 text-muted hover:text-foreground transition-colors"
                  title="Edit collection"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(col.id)}
                  className="p-1 text-muted hover:text-rose-600 transition-colors"
                  title="Remove collection"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCollection ? 'Edit Collection' : 'Create Design Collection'}
        description="Configure editorial branding and capsule narrative."
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs pt-2">
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wider text-muted mb-1">
              Collection Name
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
              Tagline
            </label>
            <input
              type="text"
              required
              value={formData.tagline}
              onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
              className="w-full h-10 bg-background border border-border px-3 text-xs focus:border-foreground focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wider text-muted mb-1">
              Cover Image URL
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
              Capsule Description
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
              Save Collection
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
