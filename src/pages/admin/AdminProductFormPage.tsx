import React, { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, Plus, Trash2, Image, Layers, Sparkles, Check } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { mockProducts, mockCategories, mockCollections, mockRooms } from '@/data/mockData'
import { Product } from '@/types'
import { useToast } from '@/context/ToastContext'

export const AdminProductFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { showToast } = useToast()

  const isEdit = Boolean(id && id !== 'new')
  const existingProduct = isEdit ? mockProducts.find((p) => p.id === id) : null

  const [activeTab, setActiveTab] = useState<'basic' | 'pricing' | 'media' | 'specs' | 'variants' | 'inventory' | 'seo'>('basic')
  const [isSaving, setIsSaving] = useState(false)

  // Form state
  const [form, setForm] = useState({
    name: existingProduct?.name || '',
    slug: existingProduct?.slug || '',
    sku: existingProduct?.sku || `GM-${Math.floor(100 + Math.random() * 900)}`,
    category: existingProduct?.category || 'sofas',
    collection: existingProduct?.collection || 'minimalist-line',
    room: existingProduct?.room || 'living-room',
    price: existingProduct?.price || 85000,
    mrp: existingProduct?.mrp || 98000,
    discount: existingProduct?.discount || 13,
    gstRate: 18,
    description: existingProduct?.description || '',
    material: existingProduct?.material || 'Solid European White Oak',
    finish: existingProduct?.finish || 'Natural Matte Hardwax Oil',
    width: existingProduct?.dimensions.width || '180 cm',
    depth: existingProduct?.dimensions.depth || '90 cm',
    height: existingProduct?.dimensions.height || '75 cm',
    weight: existingProduct?.dimensions.weight || '45 kg',
    stock: existingProduct?.stock !== undefined ? existingProduct.stock : 8,
    threshold: existingProduct?.threshold || 3,
    status: existingProduct?.status || 'published',
    images: existingProduct?.images || [
      'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1200&q=80',
    ],
    newImageUrl: '',
    colors: existingProduct?.colors || [
      { name: 'Natural Oak', hex: '#D8C3A5' },
      { name: 'Smoked Black', hex: '#232323' },
    ],
    metaTitle: existingProduct?.name ? `${existingProduct.name} | GM Atelier` : '',
    metaDescription: existingProduct?.description || '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: value,
      // Auto-generate slug from name if new
      ...(name === 'name' && !isEdit
        ? { slug: value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') }
        : {}),
    }))
  }

  const handleAddImage = () => {
    if (form.newImageUrl.trim()) {
      setForm((prev) => ({
        ...prev,
        images: [...prev.images, prev.newImageUrl.trim()],
        newImageUrl: '',
      }))
      showToast('Image URL Added', 'Image appended to gallery preview.', 'info')
    }
  }

  const handleRemoveImage = (index: number) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }))
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    setTimeout(() => {
      setIsSaving(false)
      showToast(
        isEdit ? 'Product Updated' : 'Product Registered',
        `"${form.name}" specifications committed to catalogue.`,
        'success'
      )
      navigate('/admin/products')
    }, 800)
  }

  const tabs = [
    { id: 'basic', label: '1. Basic Info' },
    { id: 'pricing', label: '2. Pricing & GST' },
    { id: 'media', label: '3. Media Gallery' },
    { id: 'specs', label: '4. Specs & Footprint' },
    { id: 'variants', label: '5. Finishes' },
    { id: 'inventory', label: '6. Stock Controls' },
    { id: 'seo', label: '7. SEO' },
  ] as const

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border gap-4">
        <div>
          <Link
            to="/admin/products"
            className="text-xs text-muted hover:text-foreground inline-flex items-center gap-1 mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Products</span>
          </Link>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">
            {isEdit ? `Edit "${existingProduct?.name}"` : 'Commission New Furniture Design'}
          </h1>
          <p className="text-xs text-muted mt-0.5">
            Configure joinery parameters, finishes, tax classifications, and stock alerts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/admin/products">
            <Button variant="outline" size="sm">
              Cancel
            </Button>
          </Link>
          <Button
            type="button"
            variant="primary"
            size="sm"
            isLoading={isSaving}
            onClick={handleSave}
            className="flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Specifications</span>
          </Button>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex border-b border-border gap-2 overflow-x-auto text-xs font-medium">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id)}
            className={`pb-3 px-3 transition-colors whitespace-nowrap ${
              activeTab === t.id
                ? 'border-b-2 border-foreground text-foreground font-semibold'
                : 'text-muted hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Form Content */}
      <form onSubmit={handleSave} className="bg-background border border-border p-6 sm:p-8 space-y-6">
        {/* TAB 1: BASIC INFORMATION */}
        {activeTab === 'basic' && (
          <div className="space-y-4 text-xs">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-foreground pb-2 border-b border-border">
              Basic Piece Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-muted mb-1">
                  Product Name
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g. Kanso Modular 3-Piece Sofa"
                  className="w-full h-10 bg-surface border border-border px-3 text-xs focus:border-foreground focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-muted mb-1">
                  SKU Identifier
                </label>
                <input
                  type="text"
                  name="sku"
                  required
                  value={form.sku}
                  onChange={handleChange}
                  placeholder="GM-SOF-001"
                  className="w-full h-10 bg-surface border border-border px-3 text-xs font-mono focus:border-foreground focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-muted mb-1">
                  Category
                </label>
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  className="w-full h-10 bg-surface border border-border px-3 text-xs focus:border-foreground focus:outline-none cursor-pointer"
                >
                  {mockCategories.map((c) => (
                    <option key={c.id} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-muted mb-1">
                  Collection Capsule
                </label>
                <select
                  name="collection"
                  value={form.collection}
                  onChange={handleChange}
                  className="w-full h-10 bg-surface border border-border px-3 text-xs focus:border-foreground focus:outline-none cursor-pointer"
                >
                  {mockCollections.map((col) => (
                    <option key={col.id} value={col.slug}>
                      {col.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-muted mb-1">
                  Primary Room Suite
                </label>
                <select
                  name="room"
                  value={form.room}
                  onChange={handleChange}
                  className="w-full h-10 bg-surface border border-border px-3 text-xs focus:border-foreground focus:outline-none cursor-pointer"
                >
                  {mockRooms.map((r) => (
                    <option key={r.id} value={r.slug}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-muted mb-1">
                Editorial Architectural Description
              </label>
              <textarea
                name="description"
                rows={4}
                value={form.description}
                onChange={handleChange}
                placeholder="Describe timber grain, internal suspensions, joinery geometry, and sensory ergonomics..."
                className="w-full bg-surface border border-border p-3 text-xs focus:border-foreground focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* TAB 2: PRICING & TAXES */}
        {activeTab === 'pricing' && (
          <div className="space-y-4 text-xs">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-foreground pb-2 border-b border-border">
              Commercial Pricing & Taxation
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-muted mb-1">
                  Net Selling Price (INR ₹)
                </label>
                <input
                  type="number"
                  name="price"
                  required
                  value={form.price}
                  onChange={handleChange}
                  className="w-full h-10 bg-surface border border-border px-3 text-xs focus:border-foreground focus:outline-none font-semibold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-muted mb-1">
                  MRP Reference (INR ₹)
                </label>
                <input
                  type="number"
                  name="mrp"
                  value={form.mrp}
                  onChange={handleChange}
                  className="w-full h-10 bg-surface border border-border px-3 text-xs focus:border-foreground focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-muted mb-1">
                  Statutory GST Slab (%)
                </label>
                <select
                  name="gstRate"
                  value={form.gstRate}
                  onChange={handleChange}
                  className="w-full h-10 bg-surface border border-border px-3 text-xs focus:border-foreground focus:outline-none"
                >
                  <option value={18}>18% (Standard Wooden Furniture HSN 9403)</option>
                  <option value={12}>12% (Concessional)</option>
                  <option value={28}>28% (Luxury)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: MEDIA GALLERY */}
        {activeTab === 'media' && (
          <div className="space-y-4 text-xs">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-foreground pb-2 border-b border-border">
              Showcase Imagery & Editorial Angles
            </h3>

            <div className="flex gap-2">
              <input
                type="url"
                value={form.newImageUrl}
                onChange={(e) => setForm({ ...form, newImageUrl: e.target.value })}
                placeholder="Enter Unsplash or asset image URL..."
                className="flex-1 h-10 bg-surface border border-border px-3 text-xs focus:border-foreground focus:outline-none"
              />
              <Button type="button" variant="secondary" size="md" onClick={handleAddImage}>
                Add Image URL
              </Button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
              {form.images.map((img, i) => (
                <div key={i} className="relative aspect-[4/5] bg-surface border border-border group overflow-hidden">
                  <img src={img} alt={`Preview ${i + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(i)}
                    className="absolute top-2 right-2 p-1.5 bg-black/75 text-white hover:bg-rose-600 rounded-full transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  {i === 0 && (
                    <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-foreground text-background text-[9px] font-semibold uppercase">
                      Primary
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: SPECIFICATIONS & DIMENSIONS */}
        {activeTab === 'specs' && (
          <div className="space-y-4 text-xs">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-foreground pb-2 border-b border-border">
              Physical Dimensions & Wood Species
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-muted mb-1">
                  Width
                </label>
                <input
                  type="text"
                  name="width"
                  value={form.width}
                  onChange={handleChange}
                  className="w-full h-10 bg-surface border border-border px-3 text-xs focus:border-foreground focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-muted mb-1">
                  Depth
                </label>
                <input
                  type="text"
                  name="depth"
                  value={form.depth}
                  onChange={handleChange}
                  className="w-full h-10 bg-surface border border-border px-3 text-xs focus:border-foreground focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-muted mb-1">
                  Height
                </label>
                <input
                  type="text"
                  name="height"
                  value={form.height}
                  onChange={handleChange}
                  className="w-full h-10 bg-surface border border-border px-3 text-xs focus:border-foreground focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-muted mb-1">
                  Crated Weight
                </label>
                <input
                  type="text"
                  name="weight"
                  value={form.weight}
                  onChange={handleChange}
                  className="w-full h-10 bg-surface border border-border px-3 text-xs focus:border-foreground focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-muted mb-1">
                  Primary Material
                </label>
                <input
                  type="text"
                  name="material"
                  value={form.material}
                  onChange={handleChange}
                  className="w-full h-10 bg-surface border border-border px-3 text-xs focus:border-foreground focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-muted mb-1">
                  Surface Finish / Coating
                </label>
                <input
                  type="text"
                  name="finish"
                  value={form.finish}
                  onChange={handleChange}
                  className="w-full h-10 bg-surface border border-border px-3 text-xs focus:border-foreground focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: VARIANTS */}
        {activeTab === 'variants' && (
          <div className="space-y-4 text-xs">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-foreground pb-2 border-b border-border">
              Finishes & Color Swatches
            </h3>

            <div className="space-y-3">
              {form.colors.map((c, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-surface border border-border">
                  <span className="w-5 h-5 rounded-full border border-black/20" style={{ backgroundColor: c.hex }} />
                  <span className="font-semibold text-foreground flex-1">{c.name}</span>
                  <span className="font-mono text-muted text-[11px]">{c.hex}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: INVENTORY */}
        {activeTab === 'inventory' && (
          <div className="space-y-4 text-xs">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-foreground pb-2 border-b border-border">
              Inventory & Replenishment Thresholds
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-muted mb-1">
                  Current Warehouse Stock
                </label>
                <input
                  type="number"
                  name="stock"
                  value={form.stock}
                  onChange={handleChange}
                  className="w-full h-10 bg-surface border border-border px-3 text-xs focus:border-foreground focus:outline-none font-semibold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-muted mb-1">
                  Low Stock Trigger Threshold
                </label>
                <input
                  type="number"
                  name="threshold"
                  value={form.threshold}
                  onChange={handleChange}
                  className="w-full h-10 bg-surface border border-border px-3 text-xs focus:border-foreground focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-muted mb-1">
                  Publication Status
                </label>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className="w-full h-10 bg-surface border border-border px-3 text-xs focus:border-foreground focus:outline-none cursor-pointer"
                >
                  <option value="published">Published (Store Active)</option>
                  <option value="draft">Draft (Private Preview)</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: SEO */}
        {activeTab === 'seo' && (
          <div className="space-y-4 text-xs">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-foreground pb-2 border-b border-border">
              Search Engine & Metadata Configuration
            </h3>

            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-muted mb-1">
                SEO Meta Title
              </label>
              <input
                type="text"
                name="metaTitle"
                value={form.metaTitle}
                onChange={handleChange}
                className="w-full h-10 bg-surface border border-border px-3 text-xs focus:border-foreground focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-muted mb-1">
                Meta Description
              </label>
              <textarea
                name="metaDescription"
                rows={3}
                value={form.metaDescription}
                onChange={handleChange}
                className="w-full bg-surface border border-border p-3 text-xs focus:border-foreground focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Footer Submit */}
        <div className="pt-6 border-t border-border flex justify-end gap-3">
          <Link to="/admin/products">
            <Button variant="outline" size="sm">
              Cancel
            </Button>
          </Link>
          <Button type="submit" variant="primary" size="sm" isLoading={isSaving}>
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  )
}
