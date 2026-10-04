import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, Plus, Trash2, Image, Layers, Check, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { mockCategories, mockCollections, mockRooms } from '@/data/mockData'
import { useToast } from '@/context/ToastContext'
import { useAuth } from '@/context/AuthContext'

export const AdminProductFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { token } = useAuth()

  const isEdit = Boolean(id && id !== 'new')
  const [isLoadingProduct, setIsLoadingProduct] = useState(isEdit)
  const [activeTab, setActiveTab] = useState<'basic' | 'pricing' | 'media' | 'specs' | 'variants' | 'inventory' | 'seo'>('basic')
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Form state
  const [form, setForm] = useState({
    name: '',
    slug: '',
    sku: `GM-${Math.floor(100 + Math.random() * 900)}`,
    category: 'sofas',
    collection: 'minimalist-line',
    room: 'living-room',
    price: 85000,
    mrp: 98000,
    discount: 13,
    description: '',
    shortDescription: '',
    material: 'Solid European White Oak',
    finish: 'Natural Matte Hardwax Oil',
    width: '180 cm',
    depth: '90 cm',
    height: '75 cm',
    weight: '45 kg',
    stock: 5,
    threshold: 3,
    status: 'published',
    images: [
      'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=80',
    ],
    newImageUrl: '',
    colors: [
      { name: 'Natural Oak', hex: '#D8C3A5' },
      { name: 'Smoked Black', hex: '#232323' },
    ],
    metaTitle: '',
    metaDescription: '',
  })

  // Load product from SQLite when in edit mode
  useEffect(() => {
    if (!isEdit || !id) return

    let isMounted = true
    async function loadProduct() {
      try {
        setIsLoadingProduct(true)
        setErrorMessage(null)
        const res = await fetch(`/api/admin/products/${id}`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        })

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}))
          throw new Error(errData.error || 'Product not found.')
        }

        const p = await res.json()
        if (isMounted) {
          setForm({
            name: p.name || '',
            slug: p.slug || '',
            sku: p.sku || '',
            category: p.category || 'sofas',
            collection: p.collection || 'minimalist-line',
            room: p.room || 'living-room',
            price: p.price || 0,
            mrp: p.mrp || 0,
            discount: p.discount || 0,
            description: p.description || '',
            shortDescription: p.shortDescription || '',
            material: p.material || '',
            finish: p.finish || '',
            width: p.dimensions?.width || '',
            depth: p.dimensions?.depth || '',
            height: p.dimensions?.height || '',
            weight: p.dimensions?.weight || '',
            stock: p.stock !== undefined ? p.stock : 5,
            threshold: 3,
            status: p.status || 'published',
            images: Array.isArray(p.images) && p.images.length > 0 ? p.images : [],
            newImageUrl: '',
            colors: Array.isArray(p.colors) && p.colors.length > 0 ? p.colors : [{ name: 'Default', hex: '#333333' }],
            metaTitle: p.name ? `${p.name} | GM Furniture` : '',
            metaDescription: p.description || '',
          })
        }
      } catch (err: any) {
        if (isMounted) {
          setErrorMessage(err.message || 'Failed to load product specifications.')
        }
      } finally {
        if (isMounted) {
          setIsLoadingProduct(false)
        }
      }
    }

    loadProduct()

    return () => {
      isMounted = false
    }
  }, [id, isEdit, token])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm((prev) => {
      const updated = {
        ...prev,
        [name]: value,
      }
      // Auto-generate slug from name if new
      if (name === 'name' && !isEdit) {
        updated.slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      }
      // Recalculate discount if price or mrp changes
      if (name === 'price' || name === 'mrp') {
        const p = name === 'price' ? Number(value) : Number(prev.price)
        const m = name === 'mrp' ? Number(value) : Number(prev.mrp)
        if (m > 0 && p > 0 && m >= p) {
          updated.discount = Math.round(((m - p) / m) * 100)
        }
      }
      return updated
    })
  }

  const handleAddImage = () => {
    if (form.newImageUrl.trim()) {
      setForm((prev) => ({
        ...prev,
        images: [...prev.images, prev.newImageUrl.trim()],
        newImageUrl: '',
      }))
      showToast('Image Appended', 'Image URL added to gallery preview.', 'info')
    }
  }

  const handleRemoveImage = (index: number) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    // Validation (Phase 9)
    if (!form.name.trim()) {
      setErrorMessage('Product name is required.')
      setActiveTab('basic')
      return
    }

    if (!form.sku.trim()) {
      setErrorMessage('SKU identifier is required.')
      setActiveTab('basic')
      return
    }

    if (!form.slug.trim()) {
      setErrorMessage('Valid URL slug is required.')
      setActiveTab('basic')
      return
    }

    if (!form.category.trim()) {
      setErrorMessage('Product category is required.')
      setActiveTab('basic')
      return
    }

    if (Number(form.price) <= 0) {
      setErrorMessage('Selling price must be greater than zero.')
      setActiveTab('pricing')
      return
    }

    if (Number(form.mrp) < Number(form.price)) {
      setErrorMessage('MRP must be greater than or equal to selling price.')
      setActiveTab('pricing')
      return
    }

    if (Number(form.stock) < 0) {
      setErrorMessage('Stock units cannot be negative.')
      setActiveTab('inventory')
      return
    }

    if (!form.description.trim()) {
      setErrorMessage('Product description is required.')
      setActiveTab('basic')
      return
    }

    if (!form.material.trim()) {
      setErrorMessage('Material specification is required.')
      setActiveTab('specs')
      return
    }

    if (!form.finish.trim()) {
      setErrorMessage('Finish specification is required.')
      setActiveTab('specs')
      return
    }

    const validImages = form.images.filter((img) => img && img.trim())
    if (validImages.length === 0) {
      setErrorMessage('At least one product image URL is required.')
      setActiveTab('media')
      return
    }

    setIsSaving(true)

    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      sku: form.sku.trim(),
      category: form.category,
      collection: form.collection,
      room: form.room,
      price: Number(form.price),
      mrp: Number(form.mrp),
      discount: Number(form.discount),
      description: form.description.trim(),
      shortDescription: form.shortDescription.trim() || form.description.trim().slice(0, 150),
      images: validImages,
      colors: form.colors,
      dimensions: {
        width: form.width,
        depth: form.depth,
        height: form.height,
        weight: form.weight,
      },
      material: form.material.trim(),
      finish: form.finish.trim(),
      stock: Number(form.stock),
      status: form.status,
    }

    try {
      const endpoint = isEdit ? `/api/admin/products/${id}` : '/api/admin/products'
      const method = isEdit ? 'PUT' : 'POST'

      const res = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save product in SQLite database.')
      }

      showToast(
        isEdit ? 'Product Specifications Updated' : 'Product Registered in SQLite',
        `"${payload.name}" successfully saved.`,
        'success'
      )
      navigate('/admin/products')
    } catch (err: any) {
      console.error('Save product error:', err)
      setErrorMessage(err.message || 'Database mutation failed. Please verify input data.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteProduct = async () => {
    if (!id || !isEdit) return
    try {
      setIsDeleting(true)
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete product.')
      }

      showToast('Product Removed', `Product was removed from the database.`, 'info')
      navigate('/admin/products')
    } catch (err: any) {
      showToast('Delete Failed', err.message || 'Could not delete product.', 'error')
    } finally {
      setIsDeleting(false)
      setShowDeleteModal(false)
    }
  }

  const tabs = [
    { id: 'basic', label: '1. Basic Info' },
    { id: 'pricing', label: '2. Pricing' },
    { id: 'media', label: '3. Media Gallery' },
    { id: 'specs', label: '4. Specs & Footprint' },
    { id: 'variants', label: '5. Finishes' },
    { id: 'inventory', label: '6. Stock Controls' },
    { id: 'seo', label: '7. SEO' },
  ] as const

  if (isLoadingProduct) {
    return (
      <div className="p-16 text-center">
        <div className="w-6 h-6 border-2 border-foreground border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <span className="text-xs text-muted">Retrieving product record from database...</span>
      </div>
    )
  }

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
            {isEdit ? `Edit "${form.name || 'Product'}"` : 'Register New Furniture Piece'}
          </h1>
          <p className="text-xs text-muted mt-0.5">
            Configure joinery parameters, finishes, price points, and database inventory.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isEdit && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteModal(true)}
              className="text-rose-600 hover:bg-rose-50 border-rose-200 flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Piece</span>
            </Button>
          )}

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

      {/* Error message banner */}
      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-3">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span className="font-medium">{errorMessage}</span>
        </div>
      )}

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
                  Product Name *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g. Atelier Solid Walnut Dining Table"
                  className="w-full h-10 bg-surface border border-border px-3 text-xs focus:border-foreground focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-muted mb-1">
                  SKU Identifier *
                </label>
                <input
                  type="text"
                  name="sku"
                  required
                  value={form.sku}
                  onChange={handleChange}
                  placeholder="GM-DIN-004"
                  className="w-full h-10 bg-surface border border-border px-3 text-xs font-mono focus:border-foreground focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-muted mb-1">
                  Category *
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
                  Collection
                </label>
                <select
                  name="collection"
                  value={form.collection}
                  onChange={handleChange}
                  className="w-full h-10 bg-surface border border-border px-3 text-xs focus:border-foreground focus:outline-none cursor-pointer"
                >
                  {mockCollections.map((c) => (
                    <option key={c.id} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-muted mb-1">
                  Target Room
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-muted mb-1">
                  URL Slug *
                </label>
                <input
                  type="text"
                  name="slug"
                  required
                  value={form.slug}
                  onChange={handleChange}
                  placeholder="atelier-solid-walnut-dining-table"
                  className="w-full h-10 bg-surface border border-border px-3 text-xs font-mono focus:border-foreground focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-muted mb-1">
                  Short Subtitle Description
                </label>
                <input
                  type="text"
                  name="shortDescription"
                  value={form.shortDescription}
                  onChange={handleChange}
                  placeholder="Solid American black walnut 8-seater dining table."
                  className="w-full h-10 bg-surface border border-border px-3 text-xs focus:border-foreground focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-muted mb-1">
                Full Architectural Description *
              </label>
              <textarea
                name="description"
                required
                rows={5}
                value={form.description}
                onChange={handleChange}
                placeholder="Comprehensive material narrative and functional notes..."
                className="w-full bg-surface border border-border p-3 text-xs focus:border-foreground focus:outline-none leading-relaxed"
              />
            </div>
          </div>
        )}

        {/* TAB 2: PRICING */}
        {activeTab === 'pricing' && (
          <div className="space-y-4 text-xs">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-foreground pb-2 border-b border-border">
              Pricing Structure
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-muted mb-1">
                  Selling Price (INR) *
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
                  MRP / Original Price (INR) *
                </label>
                <input
                  type="number"
                  name="mrp"
                  required
                  value={form.mrp}
                  onChange={handleChange}
                  className="w-full h-10 bg-surface border border-border px-3 text-xs focus:border-foreground focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-muted mb-1">
                  Calculated Discount (%)
                </label>
                <input
                  type="number"
                  name="discount"
                  value={form.discount}
                  onChange={handleChange}
                  className="w-full h-10 bg-surface border border-border px-3 text-xs focus:border-foreground focus:outline-none bg-surface/50 text-muted"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: MEDIA GALLERY */}
        {activeTab === 'media' && (
          <div className="space-y-4 text-xs">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-foreground pb-2 border-b border-border">
              Product Images Gallery (Saved to images_json)
            </h3>

            <div className="flex gap-2">
              <input
                type="url"
                name="newImageUrl"
                value={form.newImageUrl}
                onChange={handleChange}
                placeholder="Paste high-resolution image URL (e.g. Unsplash or CDN)..."
                className="flex-1 h-10 bg-surface border border-border px-3 text-xs focus:border-foreground focus:outline-none"
              />
              <Button type="button" variant="outline" size="sm" onClick={handleAddImage}>
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add Image
              </Button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
              {form.images.map((imgUrl, idx) => (
                <div key={idx} className="relative group border border-border aspect-[3/4] bg-surface overflow-hidden">
                  <img src={imgUrl} alt={`Product ${idx}`} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="p-1.5 bg-rose-600 text-white rounded-full hover:bg-rose-700 transition-colors"
                      title="Remove image"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5">
                    {idx === 0 ? 'Primary' : `#${idx + 1}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: SPECS & DIMENSIONS */}
        {activeTab === 'specs' && (
          <div className="space-y-4 text-xs">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-foreground pb-2 border-b border-border">
              Dimensions & Specifications
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
                  placeholder="240 cm"
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
                  placeholder="100 cm"
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
                  placeholder="76 cm"
                  className="w-full h-10 bg-surface border border-border px-3 text-xs focus:border-foreground focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-muted mb-1">
                  Weight
                </label>
                <input
                  type="text"
                  name="weight"
                  value={form.weight}
                  onChange={handleChange}
                  placeholder="85 kg"
                  className="w-full h-10 bg-surface border border-border px-3 text-xs focus:border-foreground focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-muted mb-1">
                  Primary Material *
                </label>
                <input
                  type="text"
                  name="material"
                  required
                  value={form.material}
                  onChange={handleChange}
                  placeholder="American Black Walnut"
                  className="w-full h-10 bg-surface border border-border px-3 text-xs focus:border-foreground focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-muted mb-1">
                  Surface Finish *
                </label>
                <input
                  type="text"
                  name="finish"
                  required
                  value={form.finish}
                  onChange={handleChange}
                  placeholder="Hand-Rubbed Natural Hardwax Oil"
                  className="w-full h-10 bg-surface border border-border px-3 text-xs focus:border-foreground focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: FINISHES / COLORS */}
        {activeTab === 'variants' && (
          <div className="space-y-4 text-xs">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-foreground pb-2 border-b border-border">
              Available Finishes & Palette
            </h3>

            <div className="space-y-3">
              {form.colors.map((color, index) => (
                <div key={index} className="flex items-center gap-3">
                  <span
                    className="w-7 h-7 rounded border border-border shrink-0 shadow-sm"
                    style={{ backgroundColor: color.hex }}
                  />
                  <input
                    type="text"
                    value={color.name}
                    onChange={(e) => {
                      const newColors = [...form.colors]
                      newColors[index].name = e.target.value
                      setForm((prev) => ({ ...prev, colors: newColors }))
                    }}
                    placeholder="Finish title"
                    className="h-9 bg-surface border border-border px-3 text-xs flex-1"
                  />
                  <input
                    type="text"
                    value={color.hex}
                    onChange={(e) => {
                      const newColors = [...form.colors]
                      newColors[index].hex = e.target.value
                      setForm((prev) => ({ ...prev, colors: newColors }))
                    }}
                    placeholder="#HEX"
                    className="h-9 bg-surface border border-border px-3 text-xs font-mono w-28"
                  />
                  {form.colors.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        setForm((prev) => ({
                          ...prev,
                          colors: prev.colors.filter((_, i) => i !== index),
                        }))
                      }}
                      className="p-2 text-muted hover:text-rose-600 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setForm((prev) => ({
                    ...prev,
                    colors: [...prev.colors, { name: 'New Finish', hex: '#555555' }],
                  }))
                }}
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add Finish Variant
              </Button>
            </div>
          </div>
        )}

        {/* TAB 6: INVENTORY */}
        {activeTab === 'inventory' && (
          <div className="space-y-4 text-xs">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-foreground pb-2 border-b border-border">
              Stock & Availability Parameters
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-muted mb-1">
                  Units in Stock *
                </label>
                <input
                  type="number"
                  name="stock"
                  required
                  min={0}
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
                placeholder="Product Title | GM Furniture"
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
                placeholder="Brief summary for search engine snippet..."
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

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => !isDeleting && setShowDeleteModal(false)}
        title="Confirm Product Deletion"
        description="Are you sure you wish to delete this product permanently from the SQLite database?"
      >
        <div className="space-y-4 pt-2">
          <p className="text-xs text-muted">
            You are about to remove <span className="font-semibold text-foreground">{form.name}</span> ({form.sku}) permanently from the database. This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3 pt-3 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              disabled={isDeleting}
              onClick={() => setShowDeleteModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={isDeleting}
              onClick={handleDeleteProduct}
              className="bg-rose-600 text-white hover:bg-rose-700 border-rose-600"
            >
              Confirm Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
