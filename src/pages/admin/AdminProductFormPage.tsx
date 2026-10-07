import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, Plus, Trash2, Image, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Category, Room, Collection } from '@/types'
import { useToast } from '@/context/ToastContext'
import { useAuth } from '@/context/AuthContext'
import { invalidateProductsCache } from '@/hooks/useProducts'

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
  const [imageInputError, setImageInputError] = useState<string | null>(null)

  // Dynamic taxonomy lists from PostgreSQL
  const [categories, setCategories] = useState<Category[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [collections, setCollections] = useState<Collection[]>([])
  const [isLoadingTaxonomy, setIsLoadingTaxonomy] = useState(true)

  // Form state
  const [form, setForm] = useState({
    name: '',
    slug: '',
    sku: `GM-${Math.floor(100 + Math.random() * 900)}`,
    category: '',
    collection: '',
    room: '',
    featured: false,
    newArrival: false,
    price: 85000,
    mrp: 98000,
    discount: 13,
    description: '',
    shortDescription: '',
    material: 'Solid Teak Wood',
    finish: 'Natural Matte Finish',
    width: '',
    depth: '',
    height: '',
    weight: '',
    dimensionsUnspecified: false,
    stock: 5,
    threshold: 3,
    status: 'published',
    images: [
      'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=80',
    ],
    newImageUrl: '',
    colors: [
      { name: 'Natural Teak', hex: '#D8C3A5' },
      { name: 'Walnut Stain', hex: '#232323' },
    ],
    metaTitle: '',
    metaDescription: '',
  })

  // Load dynamic taxonomy from PostgreSQL
  useEffect(() => {
    let isMounted = true
    async function fetchTaxonomy() {
      setIsLoadingTaxonomy(true)
      try {
        const [catRes, roomRes, colRes] = await Promise.all([
          fetch('/api/categories'),
          fetch('/api/rooms'),
          fetch('/api/collections'),
        ])
        if (isMounted) {
          if (catRes.ok) {
            const catData = await catRes.json()
            setCategories(catData)
            if (!form.category && catData.length > 0) {
              setForm((prev) => ({ ...prev, category: prev.category || catData[0].slug }))
            }
          }
          if (roomRes.ok) {
            const roomData = await roomRes.json()
            setRooms(roomData)
          }
          if (colRes.ok) {
            const colData = await colRes.json()
            setCollections(colData)
          }
        }
      } catch (err) {
        console.error('Failed to load categories/rooms/collections:', err)
      } finally {
        if (isMounted) {
          setIsLoadingTaxonomy(false)
        }
      }
    }
    fetchTaxonomy()
    return () => {
      isMounted = false
    }
  }, [])

  // Load product from PostgreSQL when in edit mode
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
          const dimsUnspecified = Boolean(p.dimensions?.unspecified)
          setForm({
            name: p.name || '',
            slug: p.slug || '',
            sku: p.sku || '',
            category: p.category || '',
            collection: p.collection || '',
            room: p.room || '',
            featured: Boolean(p.featured),
            newArrival: Boolean(p.newArrival),
            price: p.price || 0,
            mrp: p.mrp || 0,
            discount: p.discount || 0,
            description: p.description || '',
            shortDescription: p.shortDescription || '',
            material: p.material || '',
            finish: p.finish || '',
            width: dimsUnspecified ? '' : (p.dimensions?.width || ''),
            depth: dimsUnspecified ? '' : (p.dimensions?.depth || ''),
            height: dimsUnspecified ? '' : (p.dimensions?.height || ''),
            weight: dimsUnspecified ? '' : (p.dimensions?.weight || ''),
            dimensionsUnspecified: dimsUnspecified,
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
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setForm((prev) => ({ ...prev, [name]: checked }))
      return
    }

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
    setImageInputError(null)
    const raw = form.newImageUrl.trim()

    if (!raw) {
      setImageInputError('Please paste an image URL before clicking Add Image.')
      return
    }

    let normalised = raw
    if (!/^https?:\/\//i.test(raw)) {
      normalised = `https://${raw}`
    }

    try {
      new URL(normalised)
    } catch {
      setImageInputError("That doesn't look like a valid URL. Please include the full address (e.g. https://…).")
      return
    }

    if (form.images.includes(normalised)) {
      setImageInputError('This image URL is already in the gallery.')
      return
    }

    setForm((prev) => ({
      ...prev,
      images: [...prev.images, normalised],
      newImageUrl: '',
    }))
    showToast('Image Added', 'Image URL added to the gallery.', 'info')
  }

  const handleImageInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddImage()
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
      featured: Boolean(form.featured),
      newArrival: Boolean(form.newArrival),
      price: Number(form.price),
      mrp: Number(form.mrp),
      discount: Number(form.discount),
      description: form.description.trim(),
      shortDescription: form.shortDescription.trim() || form.description.trim().slice(0, 150),
      images: validImages,
      colors: form.colors,
      dimensions: {
        ...(form.dimensionsUnspecified
          ? { unspecified: true, width: null, depth: null, height: null, weight: null }
          : {
              unspecified: false,
              width: form.width,
              depth: form.depth,
              height: form.height,
              weight: form.weight,
            }),
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
        throw new Error(data.error || 'Failed to save product in database.')
      }

      invalidateProductsCache()
      showToast(
        isEdit ? 'Product Updated' : 'Product Created',
        `"${payload.name}" successfully saved in database.`,
        'success'
      )
      navigate('/admin/products')
    } catch (err: any) {
      console.error('Save product error:', err)
      setErrorMessage(err.message || 'Database operation failed. Please verify input data.')
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

      invalidateProductsCache()
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
    { id: 'specs', label: '4. Dimensions & Material' },
    { id: 'variants', label: '5. Finishes' },
    { id: 'inventory', label: '6. Stock & Visibility' },
    { id: 'seo', label: '7. SEO' },
  ] as const

  if (isLoadingProduct || isLoadingTaxonomy) {
    return (
      <div className="p-16 text-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted mx-auto mb-3" />
        <span className="text-xs text-muted">Loading product and taxonomy options...</span>
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
            {isEdit ? `Edit "${form.name || 'Product'}"` : 'Add New Product'}
          </h1>
          <p className="text-xs text-muted mt-0.5">
            Configure product details, category, room, collection, prices, and stock.
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
              <span>Delete Product</span>
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
            <span>Save Product</span>
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
              Basic Product Information
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
                  placeholder="e.g. Solid Teak 6-Seater Dining Table"
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
                  placeholder="GM-DIN-001"
                  className="w-full h-10 bg-surface border border-border px-3 text-xs font-mono focus:border-foreground focus:outline-none"
                />
              </div>
            </div>

            {/* DYNAMIC CATEGORY, COLLECTION, ROOM SELECTORS FROM POSTGRESQL */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-muted mb-1">
                  Category * (from database)
                </label>
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  required
                  className="w-full h-10 bg-surface border border-border px-3 text-xs focus:border-foreground focus:outline-none cursor-pointer"
                >
                  <option value="">-- Select Category --</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {categories.length === 0 && (
                  <p className="text-[10px] text-amber-600 mt-1">
                    No categories found. Please add one under Categories.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-muted mb-1">
                  Collection (from database)
                </label>
                <select
                  name="collection"
                  value={form.collection}
                  onChange={handleChange}
                  className="w-full h-10 bg-surface border border-border px-3 text-xs focus:border-foreground focus:outline-none cursor-pointer"
                >
                  <option value="">-- None / Select Collection --</option>
                  {collections.map((c) => (
                    <option key={c.id} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-muted mb-1">
                  Room (from database)
                </label>
                <select
                  name="room"
                  value={form.room}
                  onChange={handleChange}
                  className="w-full h-10 bg-surface border border-border px-3 text-xs focus:border-foreground focus:outline-none cursor-pointer"
                >
                  <option value="">-- None / Select Room --</option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.slug}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* PRODUCT VISIBILITY FLAGS */}
            <div className="p-4 bg-surface border border-border rounded space-y-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground block">
                Product Display Flags
              </span>
              <div className="flex flex-wrap gap-6">
                <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    name="featured"
                    checked={form.featured}
                    onChange={handleChange}
                    className="w-4 h-4 accent-foreground"
                  />
                  <span className="text-xs text-foreground font-medium">Featured Product</span>
                  <span className="text-[10px] text-muted">(Appears in storefront Featured sections)</span>
                </label>

                <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    name="newArrival"
                    checked={form.newArrival}
                    onChange={handleChange}
                    className="w-4 h-4 accent-foreground"
                  />
                  <span className="text-xs text-foreground font-medium">New Arrival</span>
                  <span className="text-[10px] text-muted">(Badged as New Arrival on catalog)</span>
                </label>
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
                  placeholder="solid-teak-6-seater-dining-table"
                  className="w-full h-10 bg-surface border border-border px-3 text-xs font-mono focus:border-foreground focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-muted mb-1">
                  Short Description
                </label>
                <input
                  type="text"
                  name="shortDescription"
                  value={form.shortDescription}
                  onChange={handleChange}
                  placeholder="Solid teak wood dining table with natural oil finish."
                  className="w-full h-10 bg-surface border border-border px-3 text-xs focus:border-foreground focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-muted mb-1">
                Full Product Description *
              </label>
              <textarea
                name="description"
                required
                rows={5}
                value={form.description}
                onChange={handleChange}
                placeholder="Comprehensive material details, craft techniques, and specifications..."
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
                  Selling Price (₹) *
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
                  MRP / Original Price (₹) *
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
              Product Images Gallery
            </h3>

            {/* URL input row */}
            <div className="space-y-1.5">
              <div className="flex gap-2">
                <input
                  type="text"
                  name="newImageUrl"
                  value={form.newImageUrl}
                  onChange={(e) => {
                    handleChange(e)
                    setImageInputError(null)
                  }}
                  onKeyDown={handleImageInputKeyDown}
                  placeholder="Paste high-resolution image URL (https://…)"
                  className={`flex-1 h-10 bg-surface border px-3 text-xs focus:outline-none transition-colors ${
                    imageInputError ? 'border-red-400 focus:border-red-500' : 'border-border focus:border-foreground'
                  }`}
                  autoComplete="off"
                  spellCheck={false}
                />
                <Button type="button" variant="outline" size="sm" onClick={handleAddImage}>
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Add Image
                </Button>
              </div>
              {imageInputError && (
                <p className="text-[11px] text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {imageInputError}
                </p>
              )}
              <p className="text-[10px] text-muted">
                Tip: Press <kbd className="px-1 py-0.5 bg-surface border border-border rounded text-[9px]">Enter</kbd> or click Add Image.
              </p>
            </div>

            {form.images.length === 0 ? (
              <div className="border border-dashed border-border rounded p-10 text-center text-muted">
                <Image className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-[11px]">No images yet. Paste a URL above and click Add Image.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                {form.images.map((imgUrl, idx) => (
                  <div key={idx} className="relative border border-border aspect-[3/4] bg-surface overflow-hidden group">
                    <img
                      src={imgUrl}
                      alt={`Product image ${idx + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.currentTarget
                        target.style.display = 'none'
                        const parent = target.parentElement
                        if (parent && !parent.querySelector('.img-error-msg')) {
                          const msg = document.createElement('div')
                          msg.className = 'img-error-msg absolute inset-0 flex flex-col items-center justify-center bg-surface text-muted text-[10px] text-center p-2 gap-1'
                          msg.innerHTML = '<span class="text-lg">🖼️</span><span>Image unavailable</span>'
                          parent.appendChild(msg)
                        }
                      }}
                    />
                    <div className="absolute top-1.5 right-1.5">
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="p-1.5 bg-rose-600 text-white rounded-full hover:bg-rose-700 transition-colors shadow-md"
                        title="Remove image"
                        aria-label={`Remove image ${idx + 1}`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[9px] px-1.5 py-0.5 text-center">
                      {idx === 0 ? 'Primary' : `#${idx + 1}`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: SPECS & DIMENSIONS */}
        {activeTab === 'specs' && (
          <div className="space-y-4 text-xs">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-foreground pb-2 border-b border-border">
              Dimensions & Specifications
            </h3>

            <label className="inline-flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.dimensionsUnspecified}
                onChange={(e) => {
                  const checked = e.target.checked
                  setForm((prev) => ({
                    ...prev,
                    dimensionsUnspecified: checked,
                    ...(checked ? { width: '', depth: '', height: '', weight: '' } : {}),
                  }))
                }}
                className="w-3.5 h-3.5 accent-foreground"
              />
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted">
                Dimensions unspecified
              </span>
              {form.dimensionsUnspecified && (
                <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 font-medium">
                  Storefront will display "Unspecified"
                </span>
              )}
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {(['width', 'depth', 'height', 'weight'] as const).map((dim) => (
                <div key={dim}>
                  <label className={`block text-[11px] font-medium uppercase tracking-wider mb-1 ${
                    form.dimensionsUnspecified ? 'text-border' : 'text-muted'
                  }`}>
                    {dim.charAt(0).toUpperCase() + dim.slice(1)}
                  </label>
                  {form.dimensionsUnspecified ? (
                    <div className="w-full h-10 bg-surface border border-border px-3 flex items-center text-xs text-border italic select-none cursor-not-allowed">
                      Unspecified
                    </div>
                  ) : (
                    <input
                      type="text"
                      name={dim}
                      value={form[dim]}
                      onChange={handleChange}
                      placeholder={dim === 'weight' ? '85 kg' : dim === 'height' ? '76 cm' : dim === 'depth' ? '100 cm' : '240 cm'}
                      className="w-full h-10 bg-surface border border-border px-3 text-xs focus:border-foreground focus:outline-none"
                    />
                  )}
                </div>
              ))}
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
                  placeholder="Solid Teak Wood"
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
                  placeholder="Natural Matte Finish"
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

        {/* TAB 6: INVENTORY & VISIBILITY */}
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
        description="Are you sure you wish to delete this product permanently from the database?"
      >
        <div className="space-y-4 pt-2">
          <p className="text-xs text-muted">
            You are about to remove <span className="font-semibold text-foreground">{form.name}</span> ({form.sku}) permanently from the PostgreSQL database. This action cannot be undone.
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
