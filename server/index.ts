import express, { Request, Response } from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import crypto from 'node:crypto'
import { db, initDatabase } from './db'
import {
  hashPassword,
  comparePassword,
  signToken,
  verifyAuth,
  verifyAdmin,
  verifyGoogleToken,
  AuthenticatedRequest,
} from './auth'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Allow the Vercel frontend origin plus localhost for development.
// APP_URL should be set to your Vercel URL in Railway's environment variables,
// e.g. https://gmfurniture.vercel.app
const allowedOrigins = [
  process.env.APP_URL || 'https://gmfurniture.vercel.app',
  'https://gm-furnitures.vercel.app',
  'http://localhost:5173',
  'http://localhost:4173',
]

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true)
    if (allowedOrigins.some((o) => origin.startsWith(o))) {
      return callback(null, true)
    }
    return callback(null, true) // Permissive during early production — tighten after stable
  },
  credentials: true,
}))
app.use(express.json())

// Initialize DB schema & seed products
initDatabase()

// Health check (used by Railway / deployment platforms)
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// ==========================================
// 1. AUTHENTICATION ENDPOINTS
// ==========================================

// Register (Email + Password)
app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Please provide full name, email, and password.' })
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' })
    }

    const normalizedEmail = email.trim().toLowerCase()

    // Check if user already exists
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail) as { id: string } | undefined
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists.' })
    }

    const passwordHash = await hashPassword(password)
    const userId = `usr_${crypto.randomUUID()}`
    const now = new Date().toISOString()

    db.prepare(`
      INSERT INTO users (id, name, email, password_hash, provider, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'local', ?, ?)
    `).run(userId, name.trim(), normalizedEmail, passwordHash, now, now)

    const user = {
      id: userId,
      name: name.trim(),
      email: normalizedEmail,
      provider: 'local',
      role: 'customer',
    }

    const token = signToken(user)

    return res.status(201).json({
      user,
      token,
      message: 'Account created successfully.',
    })
  } catch (error: any) {
    console.error('Registration error:', error)
    return res.status(500).json({ error: 'Failed to create account. Please try again.' })
  }
})

// Login (Email + Password)
app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' })
    }

    const normalizedEmail = email.trim().toLowerCase()
    const userRow = db.prepare('SELECT id, name, email, password_hash, provider, role, avatar_url FROM users WHERE email = ?').get(normalizedEmail) as any

    if (!userRow || !userRow.password_hash) {
      return res.status(401).json({ error: 'Invalid email or password.' })
    }

    const isMatch = await comparePassword(password, userRow.password_hash)
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' })
    }

    const user = {
      id: userRow.id,
      name: userRow.name,
      email: userRow.email,
      provider: userRow.provider,
      role: userRow.role || 'customer',
      avatar_url: userRow.avatar_url,
    }

    const token = signToken(user)

    return res.json({
      user,
      token,
      message: 'Signed in successfully.',
    })
  } catch (error: any) {
    console.error('Login error:', error)
    return res.status(500).json({ error: 'Authentication failed. Please try again.' })
  }
})

// Google OAuth Login / Link
app.post('/api/auth/google', async (req: Request, res: Response) => {
  try {
    const { credential } = req.body

    if (!credential) {
      return res.status(400).json({ error: 'Google credential token is required.' })
    }

    const googlePayload = await verifyGoogleToken(credential)
    const normalizedEmail = googlePayload.email.trim().toLowerCase()
    const now = new Date().toISOString()

    let userRow = db.prepare('SELECT id, name, email, provider, role, avatar_url FROM users WHERE email = ?').get(normalizedEmail) as any

    if (!userRow) {
      // Create new user linked to Google
      const userId = `usr_${crypto.randomUUID()}`
      db.prepare(`
        INSERT INTO users (id, name, email, provider, provider_id, role, avatar_url, created_at, updated_at)
        VALUES (?, ?, ?, 'google', ?, 'customer', ?, ?, ?)
      `).run(userId, googlePayload.name, normalizedEmail, googlePayload.sub, googlePayload.picture || null, now, now)

      userRow = {
        id: userId,
        name: googlePayload.name,
        email: normalizedEmail,
        provider: 'google',
        role: 'customer',
        avatar_url: googlePayload.picture,
      }
    } else {
      // Update provider_id or avatar if available
      db.prepare(`
        UPDATE users
        SET provider_id = COALESCE(provider_id, ?),
            avatar_url = COALESCE(?, avatar_url),
            updated_at = ?
        WHERE id = ?
      `).run(googlePayload.sub, googlePayload.picture || null, now, userRow.id)
    }

    const user = {
      id: userRow.id,
      name: userRow.name,
      email: userRow.email,
      provider: userRow.provider,
      role: userRow.role || 'customer',
      avatar_url: userRow.avatar_url,
    }

    const token = signToken(user)

    return res.json({
      user,
      token,
      message: 'Google authentication successful.',
    })
  } catch (error: any) {
    console.error('Google auth error:', error)
    return res.status(400).json({ error: error.message || 'Google authentication failed.' })
  }
})

// Get Current Authenticated User Session
app.get('/api/auth/me', verifyAuth, (req: AuthenticatedRequest, res: Response) => {
  return res.json({ user: req.user })
})

// ==========================================
// 2. PRODUCT CATALOG ENDPOINTS (Canonical 4 Products)
// ==========================================

function formatProductRow(row: any) {
  return {
    ...row,
    featured: Boolean(row.featured),
    newArrival: Boolean(row.new_arrival),
    images: JSON.parse(row.images_json),
    colors: JSON.parse(row.colors_json),
    dimensions: JSON.parse(row.dimensions_json),
    specifications: JSON.parse(row.specifications_json),
    careInstructions: JSON.parse(row.care_instructions_json),
    leadTime: row.lead_time,
    shortDescription: row.short_description,
    reviewCount: row.review_count,
  }
}

// Get all products (with optional filters)
app.get('/api/products', (req: Request, res: Response) => {
  try {
    const { featured, newArrival } = req.query
    let query = "SELECT * FROM products WHERE status = 'published'"
    const params: any[] = []

    if (featured === 'true' || featured === '1') {
      query += ' AND featured = 1'
    }

    if (newArrival === 'true' || newArrival === '1') {
      query += ' AND new_arrival = 1'
    }

    query += ' ORDER BY created_at ASC'

    const rows = db.prepare(query).all(...params)
    const products = rows.map(formatProductRow)
    return res.json(products)
  } catch (error: any) {
    console.error('Fetch products error:', error)
    return res.status(500).json({ error: 'Failed to fetch products.' })
  }
})

// Get single product by slug or id
app.get('/api/products/:slugOrId', (req: Request, res: Response) => {
  try {
    const { slugOrId } = req.params
    const row = db.prepare('SELECT * FROM products WHERE slug = ? OR id = ?').get(slugOrId, slugOrId) as any

    if (!row) {
      return res.status(404).json({ error: 'Product not found.' })
    }

    return res.json(formatProductRow(row))
  } catch (error: any) {
    console.error('Fetch product detail error:', error)
    return res.status(500).json({ error: 'Failed to fetch product.' })
  }
})

// ==========================================
// 3. PERSISTENT CART ENDPOINTS (User-Scoped)
// ==========================================

// Get user's cart
app.get('/api/cart', verifyAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const rows = db.prepare(`
      SELECT 
        ci.id as cart_item_id,
        ci.quantity,
        ci.selected_color,
        p.*
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.user_id = ?
      ORDER BY ci.created_at DESC
    `).all(userId) as any[]

    const items = rows.map((r) => ({
      id: r.cart_item_id,
      product: formatProductRow(r),
      quantity: r.quantity,
      selectedColor: r.selected_color,
    }))

    return res.json(items)
  } catch (error: any) {
    console.error('Fetch cart error:', error)
    return res.status(500).json({ error: 'Failed to fetch cart.' })
  }
})

// Add item to user's cart
app.post('/api/cart', verifyAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const { productId, quantity = 1, selectedColor = 'Standard' } = req.body

    if (!productId) {
      return res.status(400).json({ error: 'productId is required.' })
    }

    // Check if product exists
    const product = db.prepare('SELECT id FROM products WHERE id = ?').get(productId)
    if (!product) {
      return res.status(404).json({ error: 'Product not found.' })
    }

    const now = new Date().toISOString()
    const existing = db.prepare(`
      SELECT id, quantity FROM cart_items
      WHERE user_id = ? AND product_id = ? AND selected_color = ?
    `).get(userId, productId, selectedColor) as { id: string; quantity: number } | undefined

    if (existing) {
      db.prepare(`
        UPDATE cart_items
        SET quantity = quantity + ?, updated_at = ?
        WHERE id = ?
      `).run(quantity, now, existing.id)
    } else {
      const cartItemId = `cart_${crypto.randomUUID()}`
      db.prepare(`
        INSERT INTO cart_items (id, user_id, product_id, quantity, selected_color, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(cartItemId, userId, productId, quantity, selectedColor, now, now)
    }

    return res.json({ success: true, message: 'Item added to cart.' })
  } catch (error: any) {
    console.error('Add cart item error:', error)
    return res.status(500).json({ error: 'Failed to update cart.' })
  }
})

// Update quantity
app.put('/api/cart/:id', verifyAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const { id } = req.params
    const { quantity } = req.body

    if (quantity <= 0) {
      db.prepare('DELETE FROM cart_items WHERE id = ? AND user_id = ?').run(id, userId)
    } else {
      const now = new Date().toISOString()
      db.prepare('UPDATE cart_items SET quantity = ?, updated_at = ? WHERE id = ? AND user_id = ?').run(quantity, now, id, userId)
    }

    return res.json({ success: true })
  } catch (error: any) {
    console.error('Update cart item error:', error)
    return res.status(500).json({ error: 'Failed to update cart item.' })
  }
})

// Remove item from cart
app.delete('/api/cart/:id', verifyAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const { id } = req.params
    db.prepare('DELETE FROM cart_items WHERE id = ? AND user_id = ?').run(id, userId)
    return res.json({ success: true })
  } catch (error: any) {
    console.error('Delete cart item error:', error)
    return res.status(500).json({ error: 'Failed to remove cart item.' })
  }
})

// Merge guest cart upon login
app.post('/api/cart/merge', verifyAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const { items } = req.body // array of { productId, quantity, selectedColor }

    if (Array.isArray(items)) {
      const now = new Date().toISOString()
      for (const item of items) {
        if (!item.productId) continue

        const existing = db.prepare(`
          SELECT id, quantity FROM cart_items
          WHERE user_id = ? AND product_id = ? AND selected_color = ?
        `).get(userId, item.productId, item.selectedColor || 'Standard') as { id: string; quantity: number } | undefined

        if (existing) {
          db.prepare(`
            UPDATE cart_items
            SET quantity = quantity + ?, updated_at = ?
            WHERE id = ?
          `).run(item.quantity || 1, now, existing.id)
        } else {
          const cartItemId = `cart_${crypto.randomUUID()}`
          db.prepare(`
            INSERT INTO cart_items (id, user_id, product_id, quantity, selected_color, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `).run(cartItemId, userId, item.productId, item.quantity || 1, item.selectedColor || 'Standard', now, now)
        }
      }
    }

    return res.json({ success: true, message: 'Cart merged successfully.' })
  } catch (error: any) {
    console.error('Merge cart error:', error)
    return res.status(500).json({ error: 'Failed to merge cart.' })
  }
})

// ==========================================
// 4. PERSISTENT WISHLIST ENDPOINTS (User-Scoped)
// ==========================================

// Get user's wishlist
app.get('/api/wishlist', verifyAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const rows = db.prepare(`
      SELECT p.*
      FROM wishlist_items wi
      JOIN products p ON wi.product_id = p.id
      WHERE wi.user_id = ?
      ORDER BY wi.created_at DESC
    `).all(userId) as any[]

    const products = rows.map(formatProductRow)
    return res.json(products)
  } catch (error: any) {
    console.error('Fetch wishlist error:', error)
    return res.status(500).json({ error: 'Failed to fetch wishlist.' })
  }
})

// Add to wishlist
app.post('/api/wishlist', verifyAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const { productId } = req.body

    if (!productId) {
      return res.status(400).json({ error: 'productId is required.' })
    }

    const id = `wish_${crypto.randomUUID()}`
    const now = new Date().toISOString()

    db.prepare(`
      INSERT OR IGNORE INTO wishlist_items (id, user_id, product_id, created_at)
      VALUES (?, ?, ?, ?)
    `).run(id, userId, productId, now)

    return res.json({ success: true })
  } catch (error: any) {
    console.error('Add wishlist error:', error)
    return res.status(500).json({ error: 'Failed to add to wishlist.' })
  }
})

// Remove from wishlist
app.delete('/api/wishlist/:productId', verifyAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const { productId } = req.params
    db.prepare('DELETE FROM wishlist_items WHERE user_id = ? AND product_id = ?').run(userId, productId)
    return res.json({ success: true })
  } catch (error: any) {
    console.error('Delete wishlist error:', error)
    return res.status(500).json({ error: 'Failed to remove from wishlist.' })
  }
})

// ==========================================
// 5. PERSISTENT ADDRESSES ENDPOINTS (User-Scoped)
// ==========================================

// Get user addresses
app.get('/api/addresses', verifyAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const addresses = db.prepare(`
      SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC
    `).all(userId) as any[]

    return res.json(addresses.map((a) => ({
      ...a,
      isDefault: Boolean(a.is_default),
      fullName: a.full_name,
      addressLine: a.address_line,
    })))
  } catch (error: any) {
    console.error('Fetch addresses error:', error)
    return res.status(500).json({ error: 'Failed to fetch addresses.' })
  }
})

// Add new address
app.post('/api/addresses', verifyAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const fullName = req.body.fullName || req.body.name
    const phone = req.body.phone
    const addressLine = req.body.addressLine || req.body.streetAddress || req.body.address
    const city = req.body.city
    const state = req.body.state
    const pincode = req.body.pincode || req.body.zip
    const isDefault = Boolean(req.body.isDefault)

    if (!fullName || !phone || !addressLine || !city || !state || !pincode) {
      return res.status(400).json({ error: 'All address fields are required.' })
    }

    const now = new Date().toISOString()
    const addressId = `addr_${crypto.randomUUID()}`

    if (isDefault) {
      db.prepare('UPDATE addresses SET is_default = 0 WHERE user_id = ?').run(userId)
    }

    db.prepare(`
      INSERT INTO addresses (id, user_id, full_name, phone, address_line, city, state, pincode, is_default, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(addressId, userId, fullName, phone, addressLine, city, state, pincode, isDefault ? 1 : 0, now, now)

    return res.status(201).json({ success: true, id: addressId })
  } catch (error: any) {
    console.error('Create address error:', error)
    return res.status(500).json({ error: 'Failed to save address.' })
  }
})

// Delete address
app.delete('/api/addresses/:id', verifyAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const { id } = req.params
    db.prepare('DELETE FROM addresses WHERE id = ? AND user_id = ?').run(id, userId)
    return res.json({ success: true })
  } catch (error: any) {
    console.error('Delete address error:', error)
    return res.status(500).json({ error: 'Failed to delete address.' })
  }
})

// ==========================================
// 6. PERSISTENT ORDERS ENDPOINTS (User-Scoped)
// ==========================================

// Get user orders
app.get('/api/orders', verifyAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const rows = db.prepare(`
      SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC
    `).all(userId) as any[]

    const orders = rows.map((r) => ({
      id: r.id,
      orderNumber: r.order_number,
      subtotal: r.subtotal,
      discount: r.discount,
      total: r.total,
      status: r.status,
      deliveryAddress: JSON.parse(r.delivery_address_json),
      items: JSON.parse(r.items_json),
      createdAt: r.created_at,
    }))

    return res.json(orders)
  } catch (error: any) {
    console.error('Fetch orders error:', error)
    return res.status(500).json({ error: 'Failed to fetch orders.' })
  }
})

// Create new order
app.post('/api/orders', verifyAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const { items, subtotal, discount = 0 } = req.body
    const deliveryAddress = req.body.deliveryAddress || req.body.shippingAddress
    const total = req.body.total || req.body.grandTotal || subtotal

    if (!items || !items.length || !deliveryAddress) {
      return res.status(400).json({ error: 'Order must contain items and a delivery address.' })
    }

    const orderId = `ord_${crypto.randomUUID()}`
    const orderNumber = `GM-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`
    const now = new Date().toISOString()

    db.prepare(`
      INSERT INTO orders (id, order_number, user_id, subtotal, discount, total, status, delivery_address_json, items_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 'confirmed', ?, ?, ?)
    `).run(
      orderId,
      orderNumber,
      userId,
      subtotal,
      discount,
      total,
      JSON.stringify(deliveryAddress),
      JSON.stringify(items),
      now
    )

    // Clear user's persistent cart upon successful order
    db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(userId)

    return res.status(201).json({
      success: true,
      order: {
        id: orderId,
        orderNumber,
        total,
        status: 'confirmed',
        createdAt: now,
      },
    })
  } catch (error: any) {
    console.error('Create order error:', error)
    return res.status(500).json({ error: 'Failed to create order.' })
  }
})

// ==========================================
// 6. ADMIN PRODUCT & METRICS ENDPOINTS (verifyAdmin protected)
// ==========================================

// GET /api/admin/products - List all products including drafts/archived
app.get('/api/admin/products', verifyAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const rows = db.prepare('SELECT * FROM products ORDER BY created_at DESC').all() as any[]
    const products = rows.map(formatProductRow)
    return res.json(products)
  } catch (error: any) {
    console.error('Admin fetch products error:', error)
    return res.status(500).json({ error: 'Failed to fetch products for administration.' })
  }
})

// GET /api/admin/products/:id - Single product by ID or Slug
app.get('/api/admin/products/:id', verifyAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params
    const row = db.prepare('SELECT * FROM products WHERE id = ? OR slug = ?').get(id, id) as any
    if (!row) {
      return res.status(404).json({ error: 'Product not found.' })
    }
    return res.json(formatProductRow(row))
  } catch (error: any) {
    console.error('Admin fetch single product error:', error)
    return res.status(500).json({ error: 'Failed to retrieve product details.' })
  }
})

// POST /api/admin/products - Create a new product
app.post('/api/admin/products', verifyAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      name,
      slug: rawSlug,
      sku: rawSku,
      category,
      collection,
      room,
      price,
      mrp,
      discount,
      description,
      shortDescription,
      images,
      colors,
      dimensions,
      material,
      finish,
      leadTime,
      warranty,
      specifications,
      careInstructions,
      status = 'published',
      featured = false,
      newArrival = false,
      stock = 5,
    } = req.body

    // --- Validation (Phase 9) ---
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Product name is required.' })
    }

    const sku = (rawSku && typeof rawSku === 'string') ? rawSku.trim().toUpperCase() : ''
    if (!sku) {
      return res.status(400).json({ error: 'Product SKU is required.' })
    }

    // Slug formatting & validation
    const slug = (rawSlug && typeof rawSlug === 'string' && rawSlug.trim())
      ? rawSlug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      : name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

    if (!slug) {
      return res.status(400).json({ error: 'Valid product slug is required.' })
    }

    if (!category || typeof category !== 'string' || !category.trim()) {
      return res.status(400).json({ error: 'Product category is required.' })
    }

    const numPrice = Number(price)
    if (isNaN(numPrice) || numPrice <= 0) {
      return res.status(400).json({ error: 'Price must be a valid positive number.' })
    }

    const numMrp = Number(mrp)
    if (isNaN(numMrp) || numMrp < numPrice) {
      return res.status(400).json({ error: 'MRP must be a valid number greater than or equal to the selling price.' })
    }

    const numStock = Number(stock)
    if (isNaN(numStock) || numStock < 0) {
      return res.status(400).json({ error: 'Stock units must be 0 or greater.' })
    }

    if (!description || typeof description !== 'string' || !description.trim()) {
      return res.status(400).json({ error: 'Product description is required.' })
    }

    if (!material || typeof material !== 'string' || !material.trim()) {
      return res.status(400).json({ error: 'Material specification is required.' })
    }

    if (!finish || typeof finish !== 'string' || !finish.trim()) {
      return res.status(400).json({ error: 'Finish specification is required.' })
    }

    // At least one image required
    const validImages = Array.isArray(images) ? images.filter((img: any) => typeof img === 'string' && img.trim()) : []
    if (validImages.length === 0) {
      return res.status(400).json({ error: 'At least one product image URL is required.' })
    }

    // Dimensions validation
    if (!dimensions || typeof dimensions !== 'object') {
      return res.status(400).json({ error: 'Product dimensions are required.' })
    }

    // Check SKU uniqueness
    const existingSku = db.prepare('SELECT id FROM products WHERE sku = ?').get(sku)
    if (existingSku) {
      return res.status(400).json({ error: `SKU "${sku}" is already assigned to another product.` })
    }

    // Check Slug uniqueness
    const existingSlug = db.prepare('SELECT id FROM products WHERE slug = ?').get(slug)
    if (existingSlug) {
      return res.status(400).json({ error: `URL slug "${slug}" is already in use by another product.` })
    }

    // Auto calculate discount if not given
    const calculatedDiscount = discount !== undefined && !isNaN(Number(discount))
      ? Number(discount)
      : Math.max(0, Math.round(((numMrp - numPrice) / numMrp) * 100))

    const id = `gm-prod-${Date.now().toString(36)}-${Math.floor(100 + Math.random() * 900)}`
    const now = new Date().toISOString()

    const colorsArr = Array.isArray(colors) && colors.length > 0 ? colors : [{ name: 'Default Finish', hex: '#333333' }]
    const specsArr = Array.isArray(specifications) ? specifications : []
    const careArr = Array.isArray(careInstructions) ? careInstructions : []

    db.prepare(`
      INSERT INTO products (
        id, slug, name, sku, category, collection, room,
        price, mrp, discount, description, short_description,
        images_json, colors_json, dimensions_json,
        material, finish, lead_time, warranty,
        specifications_json, care_instructions_json,
        status, featured, new_arrival, rating, review_count, stock,
        created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?
      )
    `).run(
      id,
      slug,
      name.trim(),
      sku,
      category.trim(),
      collection ? collection.trim() : null,
      room ? room.trim() : null,
      Math.round(numPrice),
      Math.round(numMrp),
      calculatedDiscount,
      description.trim(),
      shortDescription ? shortDescription.trim() : description.trim().slice(0, 150),
      JSON.stringify(validImages),
      JSON.stringify(colorsArr),
      JSON.stringify(dimensions),
      material.trim(),
      finish.trim(),
      leadTime || '2-4 Weeks White-Glove Delivery',
      warranty || '5-Year Structural Warranty',
      JSON.stringify(specsArr),
      JSON.stringify(careArr),
      status || 'published',
      featured ? 1 : 0,
      newArrival ? 1 : 0,
      5.0,
      0,
      Math.floor(numStock),
      now,
      now
    )

    const createdRow = db.prepare('SELECT * FROM products WHERE id = ?').get(id)
    return res.status(201).json({
      success: true,
      product: formatProductRow(createdRow),
      message: 'Product created successfully.',
    })
  } catch (error: any) {
    console.error('Admin create product error:', error)
    return res.status(500).json({ error: error.message || 'Failed to create product.' })
  }
})

// PUT /api/admin/products/:id - Update product
app.put('/api/admin/products/:id', verifyAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params

    const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(id) as any
    if (!existing) {
      return res.status(404).json({ error: 'Product not found.' })
    }

    const {
      name,
      slug: rawSlug,
      sku: rawSku,
      category,
      collection,
      room,
      price,
      mrp,
      discount,
      description,
      shortDescription,
      images,
      colors,
      dimensions,
      material,
      finish,
      leadTime,
      warranty,
      specifications,
      careInstructions,
      status,
      featured,
      newArrival,
      stock,
    } = req.body

    // --- Validation (Phase 9) ---
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Product name is required.' })
    }

    const sku = (rawSku && typeof rawSku === 'string') ? rawSku.trim().toUpperCase() : ''
    if (!sku) {
      return res.status(400).json({ error: 'Product SKU is required.' })
    }

    const slug = (rawSlug && typeof rawSlug === 'string' && rawSlug.trim())
      ? rawSlug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      : name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

    if (!slug) {
      return res.status(400).json({ error: 'Valid product slug is required.' })
    }

    if (!category || typeof category !== 'string' || !category.trim()) {
      return res.status(400).json({ error: 'Product category is required.' })
    }

    const numPrice = Number(price)
    if (isNaN(numPrice) || numPrice <= 0) {
      return res.status(400).json({ error: 'Price must be a valid positive number.' })
    }

    const numMrp = Number(mrp)
    if (isNaN(numMrp) || numMrp < numPrice) {
      return res.status(400).json({ error: 'MRP must be a valid number greater than or equal to selling price.' })
    }

    const numStock = Number(stock)
    if (isNaN(numStock) || numStock < 0) {
      return res.status(400).json({ error: 'Stock units must be 0 or greater.' })
    }

    if (!description || typeof description !== 'string' || !description.trim()) {
      return res.status(400).json({ error: 'Product description is required.' })
    }

    if (!material || typeof material !== 'string' || !material.trim()) {
      return res.status(400).json({ error: 'Material specification is required.' })
    }

    if (!finish || typeof finish !== 'string' || !finish.trim()) {
      return res.status(400).json({ error: 'Finish specification is required.' })
    }

    const validImages = Array.isArray(images) ? images.filter((img: any) => typeof img === 'string' && img.trim()) : []
    if (validImages.length === 0) {
      return res.status(400).json({ error: 'At least one product image URL is required.' })
    }

    if (!dimensions || typeof dimensions !== 'object') {
      return res.status(400).json({ error: 'Product dimensions are required.' })
    }

    // Check SKU uniqueness (exclude current product)
    const existingSku = db.prepare('SELECT id FROM products WHERE sku = ? AND id != ?').get(sku, id)
    if (existingSku) {
      return res.status(400).json({ error: `SKU "${sku}" is already assigned to another product.` })
    }

    // Check Slug uniqueness (exclude current product)
    const existingSlug = db.prepare('SELECT id FROM products WHERE slug = ? AND id != ?').get(slug, id)
    if (existingSlug) {
      return res.status(400).json({ error: `URL slug "${slug}" is already in use by another product.` })
    }

    const calculatedDiscount = discount !== undefined && !isNaN(Number(discount))
      ? Number(discount)
      : Math.max(0, Math.round(((numMrp - numPrice) / numMrp) * 100))

    const now = new Date().toISOString()
    const colorsArr = Array.isArray(colors) ? colors : JSON.parse(existing.colors_json || '[]')
    const specsArr = Array.isArray(specifications) ? specifications : JSON.parse(existing.specifications_json || '[]')
    const careArr = Array.isArray(careInstructions) ? careInstructions : JSON.parse(existing.care_instructions_json || '[]')

    db.prepare(`
      UPDATE products
      SET slug = ?,
          name = ?,
          sku = ?,
          category = ?,
          collection = ?,
          room = ?,
          price = ?,
          mrp = ?,
          discount = ?,
          description = ?,
          short_description = ?,
          images_json = ?,
          colors_json = ?,
          dimensions_json = ?,
          material = ?,
          finish = ?,
          lead_time = ?,
          warranty = ?,
          specifications_json = ?,
          care_instructions_json = ?,
          status = ?,
          featured = ?,
          new_arrival = ?,
          stock = ?,
          updated_at = ?
      WHERE id = ?
    `).run(
      slug,
      name.trim(),
      sku,
      category.trim(),
      collection ? collection.trim() : null,
      room ? room.trim() : null,
      Math.round(numPrice),
      Math.round(numMrp),
      calculatedDiscount,
      description.trim(),
      shortDescription ? shortDescription.trim() : description.trim().slice(0, 150),
      JSON.stringify(validImages),
      JSON.stringify(colorsArr),
      JSON.stringify(dimensions),
      material.trim(),
      finish.trim(),
      leadTime || existing.lead_time,
      warranty || existing.warranty,
      JSON.stringify(specsArr),
      JSON.stringify(careArr),
      status || existing.status,
      featured !== undefined ? (featured ? 1 : 0) : existing.featured,
      newArrival !== undefined ? (newArrival ? 1 : 0) : existing.new_arrival,
      Math.floor(numStock),
      now,
      id
    )

    const updatedRow = db.prepare('SELECT * FROM products WHERE id = ?').get(id)
    return res.json({
      success: true,
      product: formatProductRow(updatedRow),
      message: 'Product updated successfully.',
    })
  } catch (error: any) {
    console.error('Admin update product error:', error)
    return res.status(500).json({ error: error.message || 'Failed to update product.' })
  }
})

// DELETE /api/admin/products/:id - Delete product
app.delete('/api/admin/products/:id', verifyAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params
    const existing = db.prepare('SELECT id, name FROM products WHERE id = ?').get(id) as any
    if (!existing) {
      return res.status(404).json({ error: 'Product not found.' })
    }

    // Cascade delete cart and wishlist references
    db.prepare('DELETE FROM cart_items WHERE product_id = ?').run(id)
    db.prepare('DELETE FROM wishlist_items WHERE product_id = ?').run(id)

    db.prepare('DELETE FROM products WHERE id = ?').run(id)

    return res.json({
      success: true,
      message: `Product "${existing.name}" successfully deleted.`,
    })
  } catch (error: any) {
    console.error('Admin delete product error:', error)
    return res.status(500).json({ error: 'Failed to delete product.' })
  }
})

// GET /api/admin/stats - Real Dashboard Metrics (Phase 10)
app.get('/api/admin/stats', verifyAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const totalProducts = (db.prepare('SELECT COUNT(*) as count FROM products').get() as any).count
    const publishedProducts = (db.prepare("SELECT COUNT(*) as count FROM products WHERE status = 'published'").get() as any).count
    const draftProducts = (db.prepare("SELECT COUNT(*) as count FROM products WHERE status != 'published'").get() as any).count
    const lowStockProducts = (db.prepare('SELECT COUNT(*) as count FROM products WHERE stock <= 3').get() as any).count
    const totalCustomers = (db.prepare("SELECT COUNT(*) as count FROM users WHERE role != 'admin'").get() as any).count
    const totalOrders = (db.prepare('SELECT COUNT(*) as count FROM orders').get() as any).count

    // Total revenue from all confirmed orders
    const revenueRow = db.prepare('SELECT SUM(total) as revenue FROM orders').get() as any
    const totalRevenue = revenueRow?.revenue || 0

    // Recent orders (up to 5)
    const recentOrderRows = db.prepare(`
      SELECT o.id, o.order_number, o.total, o.status, o.created_at, u.name as customer_name, u.email as customer_email
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
      LIMIT 5
    `).all() as any[]

    const recentOrders = recentOrderRows.map((r) => ({
      id: r.id,
      orderNumber: r.order_number,
      customer: {
        name: r.customer_name || 'Store Guest',
        email: r.customer_email || 'guest@example.com',
      },
      date: new Date(r.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }),
      total: r.total,
      status: r.status,
    }))

    // Low stock items list (for dashboard display)
    const lowStockRows = db.prepare(`
      SELECT * FROM products WHERE stock <= 3 ORDER BY stock ASC LIMIT 6
    `).all() as any[]

    const lowStockItems = lowStockRows.map(formatProductRow)

    return res.json({
      totalProducts,
      publishedProducts,
      draftProducts,
      lowStockProducts,
      totalCustomers,
      totalOrders,
      totalRevenue,
      recentOrders,
      lowStockItems,
    })
  } catch (error: any) {
    console.error('Admin stats error:', error)
    return res.status(500).json({ error: 'Failed to fetch dashboard metrics.' })
  }
})

// ==========================================
// 7. ADMIN ORDERS ENDPOINTS (verifyAdmin protected)
// ==========================================

// GET /api/admin/orders — all orders with customer info
app.get('/api/admin/orders', verifyAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const rows = db.prepare(`
      SELECT
        o.id, o.order_number, o.subtotal, o.discount, o.total,
        o.status, o.delivery_address_json, o.items_json, o.created_at,
        u.id as user_id, u.name as customer_name, u.email as customer_email
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
    `).all() as any[]

    const orders = rows.map((r) => ({
      id: r.id,
      orderNumber: r.order_number,
      date: new Date(r.created_at).toLocaleDateString('en-IN', {
        month: 'short', day: 'numeric', year: 'numeric',
      }),
      createdAt: r.created_at,
      customer: {
        id: r.user_id || '',
        name: r.customer_name || 'Guest',
        email: r.customer_email || '',
      },
      items: JSON.parse(r.items_json || '[]'),
      subtotal: r.subtotal,
      discount: r.discount,
      total: r.total,
      status: r.status,
      deliveryAddress: JSON.parse(r.delivery_address_json || '{}'),
    }))

    return res.json(orders)
  } catch (error: any) {
    console.error('Admin fetch orders error:', error)
    return res.status(500).json({ error: 'Failed to fetch orders.' })
  }
})

// GET /api/admin/orders/:id — single order detail
app.get('/api/admin/orders/:id', verifyAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params
    const r = db.prepare(`
      SELECT
        o.id, o.order_number, o.subtotal, o.discount, o.total,
        o.status, o.delivery_address_json, o.items_json, o.created_at,
        u.id as user_id, u.name as customer_name, u.email as customer_email
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.id = ?
    `).get(id) as any

    if (!r) {
      return res.status(404).json({ error: 'Order not found.' })
    }

    return res.json({
      id: r.id,
      orderNumber: r.order_number,
      date: new Date(r.created_at).toLocaleDateString('en-IN', {
        month: 'short', day: 'numeric', year: 'numeric',
      }),
      createdAt: r.created_at,
      customer: {
        id: r.user_id || '',
        name: r.customer_name || 'Guest',
        email: r.customer_email || '',
      },
      items: JSON.parse(r.items_json || '[]'),
      subtotal: r.subtotal,
      discount: r.discount,
      total: r.total,
      status: r.status,
      deliveryAddress: JSON.parse(r.delivery_address_json || '{}'),
    })
  } catch (error: any) {
    console.error('Admin fetch order detail error:', error)
    return res.status(500).json({ error: 'Failed to fetch order.' })
  }
})

// PATCH /api/admin/orders/:id/status — update order fulfillment status
app.patch('/api/admin/orders/:id/status', verifyAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params
    const { status } = req.body

    const allowed = ['confirmed', 'processing', 'shipped', 'delivered', 'cancelled']
    if (!status || !allowed.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${allowed.join(', ')}` })
    }

    const existing = db.prepare('SELECT id FROM orders WHERE id = ?').get(id)
    if (!existing) {
      return res.status(404).json({ error: 'Order not found.' })
    }

    db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, id)
    return res.json({ success: true, status })
  } catch (error: any) {
    console.error('Admin update order status error:', error)
    return res.status(500).json({ error: 'Failed to update order status.' })
  }
})

// ==========================================
// 8. ADMIN CUSTOMERS ENDPOINT (verifyAdmin protected)
// ==========================================

// GET /api/admin/customers — all non-admin users with order aggregates
app.get('/api/admin/customers', verifyAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const users = db.prepare(`
      SELECT id, name, email, provider, created_at
      FROM users
      WHERE role != 'admin'
      ORDER BY created_at DESC
    `).all() as any[]

    const customers = users.map((u) => {
      const orderAgg = db.prepare(`
        SELECT COUNT(*) as total_orders, COALESCE(SUM(total), 0) as total_spent,
               MAX(created_at) as last_order_date
        FROM orders WHERE user_id = ?
      `).get(u.id) as any

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        provider: u.provider,
        joinedDate: new Date(u.created_at).toLocaleDateString('en-IN', {
          month: 'short', day: 'numeric', year: 'numeric',
        }),
        totalOrders: orderAgg?.total_orders || 0,
        totalSpent: orderAgg?.total_spent || 0,
        lastOrderDate: orderAgg?.last_order_date
          ? new Date(orderAgg.last_order_date).toLocaleDateString('en-IN', {
              month: 'short', day: 'numeric', year: 'numeric',
            })
          : null,
      }
    })

    return res.json(customers)
  } catch (error: any) {
    console.error('Admin fetch customers error:', error)
    return res.status(500).json({ error: 'Failed to fetch customers.' })
  }
})

// ==========================================
// 9. ADMIN ANALYTICS ENDPOINT (verifyAdmin protected)
// ==========================================

// GET /api/admin/analytics?from=YYYY-MM-DD&to=YYYY-MM-DD
app.get('/api/admin/analytics', verifyAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { from, to } = req.query as { from?: string; to?: string }

    // Build date filter — default to all time
    let dateFilter = ''
    const params: any[] = []
    if (from) {
      dateFilter += ' AND o.created_at >= ?'
      params.push(from)
    }
    if (to) {
      // Include the full `to` day by going to midnight of the next day
      dateFilter += ' AND o.created_at < ?'
      const toDate = new Date(to)
      toDate.setDate(toDate.getDate() + 1)
      params.push(toDate.toISOString().split('T')[0])
    }

    // KPI totals
    const kpiRow = db.prepare(`
      SELECT
        COUNT(*)                            AS total_orders,
        COALESCE(SUM(o.total), 0)          AS total_revenue,
        COALESCE(AVG(o.total), 0)          AS avg_order_value
      FROM orders o
      WHERE 1=1 ${dateFilter}
    `).get(...params) as any

    const totalOrders: number  = kpiRow?.total_orders  || 0
    const totalRevenue: number = kpiRow?.total_revenue || 0
    const avgOrderValue: number = kpiRow?.avg_order_value || 0

    // Total customers (registered non-admin users, not date-filtered — it's a cumulative metric)
    const totalCustomers: number = (db.prepare(
      "SELECT COUNT(*) as c FROM users WHERE role != 'admin'"
    ).get() as any).c || 0

    // Repeat customer ratio: customers with >1 order / customers with ≥1 order
    const repeatRow = db.prepare(`
      SELECT
        COUNT(CASE WHEN order_count > 1 THEN 1 END) AS repeat_customers,
        COUNT(*) AS customers_with_orders
      FROM (
        SELECT user_id, COUNT(*) AS order_count FROM orders GROUP BY user_id
      )
    `).get() as any
    const repeatRatio = repeatRow?.customers_with_orders > 0
      ? Math.round((repeatRow.repeat_customers / repeatRow.customers_with_orders) * 100)
      : 0

    // Monthly revenue breakdown (last 6 months within range)
    const monthlyRows = db.prepare(`
      SELECT
        strftime('%b', o.created_at) AS month,
        strftime('%Y-%m', o.created_at) AS month_key,
        COUNT(*) AS orders,
        COALESCE(SUM(o.total), 0) AS revenue
      FROM orders o
      WHERE 1=1 ${dateFilter}
      GROUP BY month_key
      ORDER BY month_key ASC
      LIMIT 12
    `).all(...params) as any[]

    // Category sales from order items (items_json is an array of {productId, name, sku, price, quantity})
    const allOrders = db.prepare(`
      SELECT o.items_json, o.total
      FROM orders o
      WHERE 1=1 ${dateFilter}
    `).all(...params) as any[]

    const categoryMap: Record<string, number> = {}
    const productMap: Record<string, { name: string; sku: string; image: string; revenue: number; units: number }> = {}

    for (const order of allOrders) {
      let items: any[] = []
      try { items = JSON.parse(order.items_json || '[]') } catch {}

      for (const item of items) {
        const lineTotal = (item.price || 0) * (item.quantity || 1)

        // Look up the product's category from the products table
        const prod = db.prepare('SELECT category, images_json FROM products WHERE id = ? OR sku = ?')
          .get(item.productId || '', item.sku || '') as any

        const category = prod?.category || 'other'
        categoryMap[category] = (categoryMap[category] || 0) + lineTotal

        // Product performance
        const key = item.productId || item.sku || item.name
        if (!productMap[key]) {
          let firstImg = ''
          try { firstImg = prod ? JSON.parse(prod.images_json || '[]')[0] || '' : '' } catch {}
          productMap[key] = { name: item.name || '', sku: item.sku || '', image: firstImg, revenue: 0, units: 0 }
        }
        productMap[key].revenue += lineTotal
        productMap[key].units   += item.quantity || 1
      }
    }

    const categorySales = Object.entries(categoryMap)
      .map(([category, value]) => ({ category, value }))
      .sort((a, b) => b.value - a.value)

    const topProducts = Object.values(productMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)

    return res.json({
      totalOrders,
      totalRevenue,
      avgOrderValue: Math.round(avgOrderValue),
      totalCustomers,
      repeatRatio,
      monthlyRevenue: monthlyRows.map((r) => ({
        month: r.month,
        revenue: r.revenue,
        orders: r.orders,
      })),
      categorySales,
      topProducts,
    })
  } catch (error: any) {
    console.error('Admin analytics error:', error)
    return res.status(500).json({ error: 'Failed to compute analytics.' })
  }
})

// ==========================================
// 10. ADMIN STOCK PATCH (verifyAdmin protected)
// ==========================================

// PATCH /api/admin/products/:id/stock — increment or decrement stock by delta
app.patch('/api/admin/products/:id/stock', verifyAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params
    const { delta } = req.body   // +1 or -1

    if (delta === undefined || typeof delta !== 'number') {
      return res.status(400).json({ error: 'delta (number) is required.' })
    }

    const existing = db.prepare('SELECT id, stock FROM products WHERE id = ?').get(id) as any
    if (!existing) {
      return res.status(404).json({ error: 'Product not found.' })
    }

    const newStock = Math.max(0, existing.stock + delta)
    db.prepare('UPDATE products SET stock = ?, updated_at = ? WHERE id = ?')
      .run(newStock, new Date().toISOString(), id)

    return res.json({ success: true, stock: newStock })
  } catch (error: any) {
    console.error('Admin stock patch error:', error)
    return res.status(500).json({ error: 'Failed to update stock.' })
  }
})

// Start Express Server
app.listen(PORT, () => {
  console.log(`[GM Furniture API Server] Running on http://localhost:${PORT}`)
})
