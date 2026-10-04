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
  verifyGoogleToken,
  AuthenticatedRequest,
} from './auth'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({ origin: true, credentials: true }))
app.use(express.json())

// Initialize DB schema & seed products
initDatabase()

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
    const userRow = db.prepare('SELECT id, name, email, password_hash, provider, avatar_url FROM users WHERE email = ?').get(normalizedEmail) as any

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

    let userRow = db.prepare('SELECT id, name, email, provider, avatar_url FROM users WHERE email = ?').get(normalizedEmail) as any

    if (!userRow) {
      // Create new user linked to Google
      const userId = `usr_${crypto.randomUUID()}`
      db.prepare(`
        INSERT INTO users (id, name, email, provider, provider_id, avatar_url, created_at, updated_at)
        VALUES (?, ?, ?, 'google', ?, ?, ?, ?)
      `).run(userId, googlePayload.name, normalizedEmail, googlePayload.sub, googlePayload.picture || null, now, now)

      userRow = {
        id: userId,
        name: googlePayload.name,
        email: normalizedEmail,
        provider: 'google',
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

// Start Express Server
app.listen(PORT, () => {
  console.log(`[GM Furniture API Server] Running on http://localhost:${PORT}`)
})
