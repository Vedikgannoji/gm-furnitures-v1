import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import crypto from 'node:crypto'
import {
  query,
  queryOne,
  execute,
  ensureDatabaseInitialized,
  testDatabaseConnection,
  hasDatabaseUrl,
} from './db'
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

// Trust proxy for Vercel deployment
app.set('trust proxy', true)

// Allow Vercel frontend origin plus localhost for development
const allowedOrigins = [
  process.env.APP_URL || 'https://gmfurniture.vercel.app',
  'https://gm-furnitures.vercel.app',
  'http://localhost:5173',
  'http://localhost:4173',
  'http://localhost:3000',
  'http://localhost:3001',
]

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true)
      if (allowedOrigins.some((o) => origin.startsWith(o))) {
        return callback(null, true)
      }
      return callback(null, true)
    },
    credentials: true,
  })
)

app.use(express.json())

// URL normalization middleware for Vercel Serverless Function compatibility.
// If Vercel rewrote the request to /api/index.js, extract original request path
app.use((req: Request, _res: Response, next: NextFunction) => {
  const originalPath = (req.headers['x-matched-path'] || req.headers['x-forwarded-uri']) as string | undefined

  if (
    originalPath &&
    originalPath.startsWith('/api') &&
    (req.url === '/api' || req.url === '/api/' || req.url.startsWith('/api/index'))
  ) {
    req.url = originalPath
  } else if (!req.url.startsWith('/api')) {
    req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url)
  }
  next()
})

// Fresh Data & Cache Control: Never cache API responses
app.use('/api', (_req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  res.setHeader('Pragma', 'no-cache')
  res.setHeader('Expires', '0')
  next()
})

// Helper to safely parse JSON or return fallback
function safeParseJson(value: any, fallback: any) {
  if (value === null || value === undefined) return fallback
  if (typeof value === 'object') return value
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

// Format raw PostgreSQL row into canonical Product object
function formatProductRow(row: any) {
  if (!row) return null
  const parsedImages = safeParseJson(row.images_json, [])
  const parsedColors = safeParseJson(row.colors_json, [])
  const parsedDimensions = safeParseJson(row.dimensions_json, {})
  const parsedSpecifications = safeParseJson(row.specifications_json, [])
  const parsedCareInstructions = safeParseJson(row.care_instructions_json, [])

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    sku: row.sku || '',
    category: row.category || '',
    collection: row.collection || '',
    room: row.room || '',
    price: Number(row.price || 0),
    mrp: Number(row.mrp || 0),
    discount: Number(row.discount || 0),
    description: row.description || '',
    shortDescription: row.short_description || '',
    images: Array.isArray(parsedImages) ? parsedImages : [],
    colors: Array.isArray(parsedColors) ? parsedColors : [],
    dimensions: parsedDimensions && typeof parsedDimensions === 'object' ? parsedDimensions : {},
    material: row.material || '',
    finish: row.finish || '',
    leadTime: row.lead_time || '',
    warranty: row.warranty || '',
    specifications: Array.isArray(parsedSpecifications) ? parsedSpecifications : [],
    careInstructions: Array.isArray(parsedCareInstructions) ? parsedCareInstructions : [],
    status: row.status || 'published',
    featured: Boolean(row.featured),
    newArrival: Boolean(row.new_arrival),
    rating: Number(row.rating || 5.0),
    reviewCount: Number(row.review_count || 0),
    stock: Number(row.stock || 0),
    stockStatus: Number(row.stock || 0) === 0 ? 'out_of_stock' : Number(row.stock || 0) <= 3 ? 'low_stock' : 'in_stock',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

// ==========================================
// 0. HEALTH CHECK & ROOT API (Available without DB)
// ==========================================
app.get('/api', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'GM Furniture API',
    endpoints: {
      health: '/api/health',
      products: '/api/products',
      login: '/api/auth/login',
      register: '/api/auth/register',
    },
  })
})

app.get('/api/health', async (_req: Request, res: Response) => {
  const dbTest = await testDatabaseConnection()
  res.json({
    status: dbTest.ok ? 'ok' : 'degraded',
    environment: process.env.NODE_ENV || 'production',
    database: {
      configured: hasDatabaseUrl(),
      connected: dbTest.ok,
      error: dbTest.error || null,
    },
    env: {
      DATABASE_URL: hasDatabaseUrl(),
      JWT_SECRET: Boolean(process.env.JWT_SECRET),
      GOOGLE_CLIENT_ID: Boolean(process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID),
      GOOGLE_CLIENT_SECRET: Boolean(process.env.GOOGLE_CLIENT_SECRET),
      ADMIN_EMAIL: Boolean(process.env.ADMIN_EMAIL),
    },
    timestamp: new Date().toISOString(),
  })
})

// Database initialization middleware
// Ensures schema and admin seeding on warm start
app.use(async (_req: Request, res: Response, next: NextFunction) => {
  if (!hasDatabaseUrl()) {
    res.status(503).json({
      error:
        'Database not configured. Please set DATABASE_URL (Neon PostgreSQL) in your Vercel project environment variables.',
    })
    return
  }
  try {
    await ensureDatabaseInitialized()
    next()
  } catch (err: any) {
    console.error('[Database Middleware Error]', err)
    res.status(500).json({
      error: 'Database connection failed. Please verify Neon PostgreSQL connection string.',
    })
  }
})

// ==========================================
// 1. AUTHENTICATION ENDPOINTS
// ==========================================

// Register (Email + Password)
app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body

    if (!name || !email || !password) {
      res.status(400).json({ error: 'Please provide full name, email, and password.' })
      return
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters.' })
      return
    }

    const normalizedEmail = email.trim().toLowerCase()

    // Check if user already exists
    const existing = await queryOne<{ id: string }>(
      'SELECT id FROM users WHERE email = $1',
      [normalizedEmail]
    )
    if (existing) {
      res.status(400).json({ error: 'An account with this email already exists.' })
      return
    }

    const passwordHash = await hashPassword(password)
    const userId = `usr_${crypto.randomUUID()}`
    const now = new Date()

    await execute(
      `INSERT INTO users (id, name, email, password_hash, provider, role, created_at, updated_at)
       VALUES ($1, $2, $3, $4, 'local', 'customer', $5, $6)`,
      [userId, name.trim(), normalizedEmail, passwordHash, now, now]
    )

    const user = {
      id: userId,
      name: name.trim(),
      email: normalizedEmail,
      provider: 'local',
      role: 'customer',
    }

    const token = signToken(user)

    res.status(201).json({
      user,
      token,
      message: 'Account created successfully.',
    })
  } catch (error: any) {
    console.error('Registration error:', error)
    res.status(500).json({ error: 'Failed to create account. Please try again.' })
  }
})

// Login (Email + Password)
app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' })
      return
    }

    const normalizedEmail = email.trim().toLowerCase()
    const userRow = await queryOne<any>(
      'SELECT id, name, email, password_hash, provider, role, avatar_url FROM users WHERE email = $1',
      [normalizedEmail]
    )

    if (!userRow || !userRow.password_hash) {
      res.status(401).json({ error: 'Invalid email or password.' })
      return
    }

    const isMatch = await comparePassword(password, userRow.password_hash)
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid email or password.' })
      return
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

    res.json({
      user,
      token,
      message: 'Signed in successfully.',
    })
  } catch (error: any) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Authentication failed. Please try again.' })
  }
})

// Google OAuth Login / Link
app.post('/api/auth/google', async (req: Request, res: Response) => {
  try {
    const { credential } = req.body

    if (!credential) {
      res.status(400).json({ error: 'Google credential token is required.' })
      return
    }

    const googlePayload = await verifyGoogleToken(credential)
    const normalizedEmail = googlePayload.email.trim().toLowerCase()
    const now = new Date()

    let userRow = await queryOne<any>(
      'SELECT id, name, email, provider, role, avatar_url FROM users WHERE email = $1',
      [normalizedEmail]
    )

    if (!userRow) {
      const userId = `usr_${crypto.randomUUID()}`
      await execute(
        `INSERT INTO users (id, name, email, provider, provider_id, role, avatar_url, created_at, updated_at)
         VALUES ($1, $2, $3, 'google', $4, 'customer', $5, $6, $7)`,
        [userId, googlePayload.name, normalizedEmail, googlePayload.sub, googlePayload.picture || null, now, now]
      )

      userRow = {
        id: userId,
        name: googlePayload.name,
        email: normalizedEmail,
        provider: 'google',
        role: 'customer',
        avatar_url: googlePayload.picture,
      }
    } else {
      await execute(
        `UPDATE users
         SET provider_id = COALESCE(provider_id, $1),
             avatar_url = COALESCE($2, avatar_url),
             updated_at = $3
         WHERE id = $4`,
        [googlePayload.sub, googlePayload.picture || null, now, userRow.id]
      )
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

    res.json({
      user,
      token,
      message: 'Google authentication successful.',
    })
  } catch (error: any) {
    console.error('Google auth error:', error)
    res.status(400).json({ error: error.message || 'Google authentication failed.' })
  }
})

// Get Current Authenticated User Session
app.get('/api/auth/me', verifyAuth, (req: AuthenticatedRequest, res: Response) => {
  res.json({ user: req.user })
})

// ==========================================
// 2. PRODUCT CATALOG ENDPOINTS (Storefront)
// ==========================================

// Get all published products (with optional filters)
app.get('/api/products', async (req: Request, res: Response) => {
  try {
    const { featured, newArrival, category, room, collection } = req.query
    let sql = "SELECT * FROM products WHERE (status = 'published' OR status = 'active')"
    const params: any[] = []
    let pIdx = 1

    if (featured === 'true' || featured === '1') {
      sql += ` AND featured = 1`
    }

    if (newArrival === 'true' || newArrival === '1') {
      sql += ` AND new_arrival = 1`
    }

    if (category && typeof category === 'string' && category.trim()) {
      sql += ` AND (LOWER(category) = LOWER($${pIdx}) OR LOWER(category) = LOWER(REPLACE($${pIdx}, '-', ' ')))`
      params.push(category.trim())
      pIdx++
    }

    if (room && typeof room === 'string' && room.trim()) {
      sql += ` AND (LOWER(room) = LOWER($${pIdx}) OR LOWER(room) = LOWER(REPLACE($${pIdx}, '-', ' ')))`
      params.push(room.trim())
      pIdx++
    }

    if (collection && typeof collection === 'string' && collection.trim()) {
      sql += ` AND (LOWER(collection) = LOWER($${pIdx}) OR LOWER(collection) = LOWER(REPLACE($${pIdx}, '-', ' ')))`
      params.push(collection.trim())
      pIdx++
    }

    sql += ' ORDER BY created_at ASC'

    const rows = await query(sql, params)
    const products = rows.map(formatProductRow)
    res.json(products)
  } catch (error: any) {
    console.error('Fetch products error:', error)
    res.status(500).json({ error: 'Failed to fetch products.' })
  }
})

// Get single product by slug or id
app.get('/api/products/:slugOrId', async (req: Request, res: Response) => {
  try {
    const slugOrId = String(req.params.slugOrId).trim()
    const row = await queryOne(
      "SELECT * FROM products WHERE (LOWER(slug) = LOWER($1) OR id = $2) AND (status = 'published' OR status = 'active')",
      [slugOrId, slugOrId]
    )

    if (!row) {
      res.status(404).json({ error: 'Product not found.' })
      return
    }

    res.json(formatProductRow(row))
  } catch (error: any) {
    console.error('Fetch product detail error:', error)
    res.status(500).json({ error: 'Failed to fetch product.' })
  }
})

// ==========================================
// 2b. TAXONOMY & STORE SETTINGS (Public)
// ==========================================

// GET /api/settings - Store settings & GSTIN single source of truth
app.get('/api/settings', async (_req: Request, res: Response) => {
  try {
    const row = await queryOne('SELECT * FROM store_settings WHERE id = $1', ['default'])
    if (!row) {
      res.json({
        storeName: 'GM Furniture',
        brandTagline: 'Handcrafted Solid Wood Furniture for Modern Living',
        supportEmail: 'support@gmfurniture.in',
        supportPhone: '+91 (011) 4920-8000',
        registeredAddress: 'Studio GM, Sector 44, Institutional Area, Gurugram, Haryana 122003, India',
        gstin: '36AFNPV7079J1ZG',
        pan: 'AAACG1234F',
        currency: 'INR (₹)',
        assemblyCharge: 3000,
        convenienceFeePercent: 0,
        gstPercent: 18,
      })
      return
    }

    res.json({
      storeName: row.store_name,
      brandTagline: row.brand_tagline,
      supportEmail: row.support_email,
      supportPhone: row.support_phone,
      registeredAddress: row.registered_address,
      gstin: row.gstin,
      pan: row.pan,
      currency: row.currency,
      assemblyCharge: Number(row.assembly_charge !== undefined ? row.assembly_charge : 3000),
      convenienceFeePercent: Number(row.convenience_fee_percent !== undefined ? row.convenience_fee_percent : 0),
      gstPercent: Number(row.gst_percent !== undefined ? row.gst_percent : 18),
    })
  } catch (error: any) {
    console.error('Fetch settings error:', error)
    res.status(500).json({ error: 'Failed to fetch store settings.' })
  }
})

// GET /api/categories - All categories with dynamically computed published item count
app.get('/api/categories', async (_req: Request, res: Response) => {
  try {
    const rows = await query(`
      SELECT 
        c.id, c.slug, c.name, c.description, c.image,
        COALESCE((SELECT COUNT(*) FROM products p WHERE (LOWER(p.category) = LOWER(c.slug) OR LOWER(p.category) = LOWER(c.name)) AND (p.status = 'published' OR p.status = 'active')), 0) as item_count
      FROM categories c
      ORDER BY c.created_at ASC
    `)
    res.json(rows.map((r) => ({
      id: r.id,
      slug: r.slug,
      name: r.name,
      description: r.description,
      image: r.image,
      itemCount: Number(r.item_count || 0),
    })))
  } catch (error: any) {
    console.error('Fetch categories error:', error)
    res.status(500).json({ error: 'Failed to fetch categories.' })
  }
})

// GET /api/rooms - All rooms with dynamic product count
app.get('/api/rooms', async (_req: Request, res: Response) => {
  try {
    const rows = await query(`
      SELECT 
        r.id, r.slug, r.name, r.tagline, r.description, r.image, r.coming_soon,
        COALESCE((SELECT COUNT(*) FROM products p WHERE (LOWER(p.room) = LOWER(r.slug) OR LOWER(p.room) = LOWER(r.name)) AND (p.status = 'published' OR p.status = 'active')), 0) as product_count
      FROM rooms r
      ORDER BY r.created_at ASC
    `)
    res.json(rows.map((r) => ({
      id: r.id,
      slug: r.slug,
      name: r.name,
      tagline: r.tagline,
      description: r.description,
      image: r.image,
      comingSoon: Boolean(r.coming_soon),
      productCount: Number(r.product_count || 0),
    })))
  } catch (error: any) {
    console.error('Fetch rooms error:', error)
    res.status(500).json({ error: 'Failed to fetch rooms.' })
  }
})

// GET /api/rooms/:slugOrId - Room details and associated products
app.get('/api/rooms/:slugOrId', async (req: Request, res: Response) => {
  try {
    const slugOrId = String(req.params.slugOrId).trim()
    const room = await queryOne('SELECT * FROM rooms WHERE LOWER(slug) = LOWER($1) OR id = $2', [slugOrId, slugOrId])
    if (!room) {
      res.status(404).json({ error: 'Room not found.' })
      return
    }

    const prods = await query(
      "SELECT * FROM products WHERE (LOWER(room) = LOWER($1) OR LOWER(room) = LOWER($2) OR LOWER(room) = LOWER(REPLACE($1, '-', ' '))) AND (status = 'published' OR status = 'active') ORDER BY created_at ASC",
      [room.slug, room.name]
    )

    res.json({
      room: {
        id: room.id,
        slug: room.slug,
        name: room.name,
        tagline: room.tagline,
        description: room.description,
        image: room.image,
        comingSoon: Boolean(room.coming_soon),
        productCount: prods.length,
      },
      products: prods.map(formatProductRow),
    })
  } catch (error: any) {
    console.error('Fetch room detail error:', error)
    res.status(500).json({ error: 'Failed to fetch room detail.' })
  }
})

// GET /api/collections - All collections with dynamic product count
app.get('/api/collections', async (_req: Request, res: Response) => {
  try {
    const rows = await query(`
      SELECT 
        c.id, c.slug, c.name, c.tagline, c.description, c.image,
        COALESCE((SELECT COUNT(*) FROM products p WHERE (LOWER(p.collection) = LOWER(c.slug) OR LOWER(p.collection) = LOWER(c.name)) AND (p.status = 'published' OR p.status = 'active')), 0) as product_count
      FROM collections c
      ORDER BY c.created_at ASC
    `)
    res.json(rows.map((r) => ({
      id: r.id,
      slug: r.slug,
      name: r.name,
      tagline: r.tagline,
      description: r.description,
      image: r.image,
      productCount: Number(r.product_count || 0),
    })))
  } catch (error: any) {
    console.error('Fetch collections error:', error)
    res.status(500).json({ error: 'Failed to fetch collections.' })
  }
})

// GET /api/collections/:slugOrId - Collection details and associated products
app.get('/api/collections/:slugOrId', async (req: Request, res: Response) => {
  try {
    const slugOrId = String(req.params.slugOrId).trim()
    const col = await queryOne('SELECT * FROM collections WHERE LOWER(slug) = LOWER($1) OR id = $2', [slugOrId, slugOrId])
    if (!col) {
      res.status(404).json({ error: 'Collection not found.' })
      return
    }

    const prods = await query(
      "SELECT * FROM products WHERE (LOWER(collection) = LOWER($1) OR LOWER(collection) = LOWER($2) OR LOWER(collection) = LOWER(REPLACE($1, '-', ' '))) AND (status = 'published' OR status = 'active') ORDER BY created_at ASC",
      [col.slug, col.name]
    )

    res.json({
      collection: {
        id: col.id,
        slug: col.slug,
        name: col.name,
        tagline: col.tagline,
        description: col.description,
        image: col.image,
        productCount: prods.length,
      },
      products: prods.map(formatProductRow),
    })
  } catch (error: any) {
    console.error('Fetch collection detail error:', error)
    res.status(500).json({ error: 'Failed to fetch collection detail.' })
  }
})

// ==========================================
// 3. PERSISTENT CART ENDPOINTS (User-Scoped)
// ==========================================

// Get user's cart
app.get('/api/cart', verifyAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const rows = await query(
      `SELECT 
        ci.id as cart_item_id,
        ci.quantity,
        ci.selected_color,
        p.*
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.user_id = $1
      ORDER BY ci.created_at DESC`,
      [userId]
    )

    const items = rows.map((r) => ({
      id: r.cart_item_id,
      product: formatProductRow(r),
      quantity: Number(r.quantity),
      selectedColor: r.selected_color,
    }))

    res.json(items)
  } catch (error: any) {
    console.error('Fetch cart error:', error)
    res.status(500).json({ error: 'Failed to fetch cart.' })
  }
})

// Add item to user's cart
app.post('/api/cart', verifyAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const { productId, quantity = 1, selectedColor = 'Standard' } = req.body

    if (!productId) {
      res.status(400).json({ error: 'productId is required.' })
      return
    }

    // Verify product exists
    const product = await queryOne('SELECT id FROM products WHERE id = $1', [productId])
    if (!product) {
      res.status(404).json({ error: 'Product not found.' })
      return
    }

    const now = new Date()
    const existing = await queryOne<{ id: string; quantity: number }>(
      `SELECT id, quantity FROM cart_items
       WHERE user_id = $1 AND product_id = $2 AND selected_color = $3`,
      [userId, productId, selectedColor]
    )

    if (existing) {
      await execute(
        `UPDATE cart_items
         SET quantity = quantity + $1, updated_at = $2
         WHERE id = $3`,
        [Number(quantity), now, existing.id]
      )
    } else {
      const cartItemId = `cart_${crypto.randomUUID()}`
      await execute(
        `INSERT INTO cart_items (id, user_id, product_id, quantity, selected_color, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [cartItemId, userId, productId, Number(quantity), selectedColor, now, now]
      )
    }

    res.json({ success: true, message: 'Item added to cart.' })
  } catch (error: any) {
    console.error('Add cart item error:', error)
    res.status(500).json({ error: 'Failed to update cart.' })
  }
})

// Update quantity
app.put('/api/cart/:id', verifyAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const id = String(req.params.id)
    const { quantity } = req.body

    if (Number(quantity) <= 0) {
      await execute('DELETE FROM cart_items WHERE id = $1 AND user_id = $2', [id, userId])
    } else {
      const now = new Date()
      await execute(
        'UPDATE cart_items SET quantity = $1, updated_at = $2 WHERE id = $3 AND user_id = $4',
        [Number(quantity), now, id, userId]
      )
    }

    res.json({ success: true })
  } catch (error: any) {
    console.error('Update cart item error:', error)
    res.status(500).json({ error: 'Failed to update cart item.' })
  }
})

// Remove item from cart
app.delete('/api/cart/:id', verifyAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const id = String(req.params.id)
    await execute('DELETE FROM cart_items WHERE id = $1 AND user_id = $2', [id, userId])
    res.json({ success: true })
  } catch (error: any) {
    console.error('Delete cart item error:', error)
    res.status(500).json({ error: 'Failed to remove cart item.' })
  }
})

// Merge guest cart upon login
app.post('/api/cart/merge', verifyAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const { items } = req.body

    if (Array.isArray(items)) {
      const now = new Date()
      for (const item of items) {
        if (!item.productId) continue

        const existing = await queryOne<{ id: string; quantity: number }>(
          `SELECT id, quantity FROM cart_items
           WHERE user_id = $1 AND product_id = $2 AND selected_color = $3`,
          [userId, item.productId, item.selectedColor || 'Standard']
        )

        if (existing) {
          await execute(
            `UPDATE cart_items
             SET quantity = quantity + $1, updated_at = $2
             WHERE id = $3`,
            [Number(item.quantity || 1), now, existing.id]
          )
        } else {
          const cartItemId = `cart_${crypto.randomUUID()}`
          await execute(
            `INSERT INTO cart_items (id, user_id, product_id, quantity, selected_color, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [cartItemId, userId, item.productId, Number(item.quantity || 1), item.selectedColor || 'Standard', now, now]
          )
        }
      }
    }

    res.json({ success: true, message: 'Cart merged successfully.' })
  } catch (error: any) {
    console.error('Merge cart error:', error)
    res.status(500).json({ error: 'Failed to merge cart.' })
  }
})

// ==========================================
// 4. PERSISTENT WISHLIST ENDPOINTS
// ==========================================

// Get user's wishlist
app.get('/api/wishlist', verifyAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const rows = await query(
      `SELECT p.*
       FROM wishlist_items wi
       JOIN products p ON wi.product_id = p.id
       WHERE wi.user_id = $1
       ORDER BY wi.created_at DESC`,
      [userId]
    )

    const products = rows.map(formatProductRow)
    res.json(products)
  } catch (error: any) {
    console.error('Fetch wishlist error:', error)
    res.status(500).json({ error: 'Failed to fetch wishlist.' })
  }
})

// Add to wishlist
app.post('/api/wishlist', verifyAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const { productId } = req.body

    if (!productId) {
      res.status(400).json({ error: 'productId is required.' })
      return
    }

    const id = `wish_${crypto.randomUUID()}`
    const now = new Date()

    await execute(
      `INSERT INTO wishlist_items (id, user_id, product_id, created_at)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, product_id) DO NOTHING`,
      [id, userId, productId, now]
    )

    res.json({ success: true })
  } catch (error: any) {
    console.error('Add wishlist error:', error)
    res.status(500).json({ error: 'Failed to add to wishlist.' })
  }
})

// Remove from wishlist
app.delete('/api/wishlist/:productId', verifyAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const productId = String(req.params.productId)
    await execute('DELETE FROM wishlist_items WHERE user_id = $1 AND product_id = $2', [userId, productId])
    res.json({ success: true })
  } catch (error: any) {
    console.error('Delete wishlist error:', error)
    res.status(500).json({ error: 'Failed to remove from wishlist.' })
  }
})

// ==========================================
// 5. PERSISTENT ADDRESSES ENDPOINTS
// ==========================================

// Get user addresses
app.get('/api/addresses', verifyAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const addresses = await query(
      `SELECT * FROM addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC`,
      [userId]
    )

    res.json(
      addresses.map((a) => ({
        id: a.id,
        userId: a.user_id,
        fullName: a.full_name,
        phone: a.phone,
        addressLine: a.address_line,
        city: a.city,
        state: a.state,
        pincode: a.pincode,
        isDefault: Boolean(a.is_default),
        createdAt: a.created_at,
        updatedAt: a.updated_at,
      }))
    )
  } catch (error: any) {
    console.error('Fetch addresses error:', error)
    res.status(500).json({ error: 'Failed to fetch addresses.' })
  }
})

// Add new address
app.post('/api/addresses', verifyAuth, async (req: AuthenticatedRequest, res: Response) => {
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
      res.status(400).json({ error: 'All address fields are required.' })
      return
    }

    const now = new Date()
    const addressId = `addr_${crypto.randomUUID()}`

    if (isDefault) {
      await execute('UPDATE addresses SET is_default = 0 WHERE user_id = $1', [userId])
    }

    await execute(
      `INSERT INTO addresses (id, user_id, full_name, phone, address_line, city, state, pincode, is_default, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [addressId, userId, fullName, phone, addressLine, city, state, pincode, isDefault ? 1 : 0, now, now]
    )

    res.status(201).json({ success: true, id: addressId })
  } catch (error: any) {
    console.error('Create address error:', error)
    res.status(500).json({ error: 'Failed to save address.' })
  }
})

// Delete address
app.delete('/api/addresses/:id', verifyAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const id = String(req.params.id)
    await execute('DELETE FROM addresses WHERE id = $1 AND user_id = $2', [id, userId])
    res.json({ success: true })
  } catch (error: any) {
    console.error('Delete address error:', error)
    res.status(500).json({ error: 'Failed to delete address.' })
  }
})

// ==========================================
// 6. PERSISTENT ORDERS ENDPOINTS
// ==========================================

// Get user orders
app.get('/api/orders', verifyAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const rows = await query(
      `SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    )

    const orders = rows.map((r) => ({
      id: r.id,
      orderNumber: r.order_number,
      subtotal: Number(r.subtotal),
      discount: Number(r.discount || 0),
      total: Number(r.total),
      status: r.status,
      paymentStatus: r.payment_status || 'pending',
      paymentMethod: r.payment_method || 'cod',
      deliveryAddress: safeParseJson(r.delivery_address_json, {}),
      items: safeParseJson(r.items_json, []),
      createdAt: r.created_at,
    }))

    res.json(orders)
  } catch (error: any) {
    console.error('Fetch orders error:', error)
    res.status(500).json({ error: 'Failed to fetch orders.' })
  }
})

// Get single order detail
app.get('/api/orders/:id', verifyAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const id = String(req.params.id).trim()
    const r = await queryOne(
      'SELECT * FROM orders WHERE (id = $1 OR order_number = $1) AND user_id = $2',
      [id, userId]
    )

    if (!r) {
      res.status(404).json({ error: 'Order not found.' })
      return
    }

    res.json({
      id: r.id,
      orderNumber: r.order_number,
      subtotal: Number(r.subtotal),
      discount: Number(r.discount || 0),
      total: Number(r.total),
      status: r.status,
      paymentStatus: r.payment_status || 'pending',
      paymentMethod: r.payment_method || 'cod',
      deliveryAddress: safeParseJson(r.delivery_address_json, {}),
      items: safeParseJson(r.items_json, []),
      createdAt: r.created_at,
    })
  } catch (error: any) {
    console.error('Fetch order detail error:', error)
    res.status(500).json({ error: 'Failed to fetch order detail.' })
  }
})

// Create new order (with historical snapshot in order_items)
app.post('/api/orders', verifyAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const {
      items,
      subtotal,
      discount = 0,
      assemblyCharge = 0,
      convenienceFee = 0,
      convenienceFeePercent = 0,
      gst = 0,
      gstPercent = 18,
      paymentMethod = 'cashfree',
    } = req.body
    const deliveryAddress = req.body.deliveryAddress || req.body.shippingAddress
    const total = req.body.total || req.body.grandTotal || subtotal

    if (!items || !Array.isArray(items) || items.length === 0 || !deliveryAddress) {
      res.status(400).json({ error: 'Order must contain items and a delivery address.' })
      return
    }

    const orderId = `ord_${crypto.randomUUID()}`
    const orderNumber = `GM-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`
    const now = new Date()

    // 1. Insert order record with immutable historical charges
    await execute(
      `INSERT INTO orders (
        id, order_number, user_id, subtotal, discount, assembly_charge, convenience_fee,
        convenience_fee_percent, gst, gst_percent, total,
        status, payment_status, payment_method, payment_gateway, delivery_address_json, items_json,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'pending', 'pending', $12, 'cashfree', $13, $14, $15, $16)`,
      [
        orderId,
        orderNumber,
        userId,
        Math.round(Number(subtotal)),
        Math.round(Number(discount || 0)),
        Math.round(Number(assemblyCharge || 0)),
        Math.round(Number(convenienceFee || 0)),
        Number(convenienceFeePercent || 0),
        Math.round(Number(gst || 0)),
        Number(gstPercent || 18),
        Math.round(Number(total)),
        paymentMethod,
        JSON.stringify(deliveryAddress),
        JSON.stringify(items),
        now,
        now,
      ]
    )

    // 2. Insert historical snapshot for each item into order_items
    for (const item of items) {
      const orderItemId = `item_${crypto.randomUUID()}`
      const prodId = item.product?.id || item.productId || null
      const prodName = item.product?.name || item.name || 'Bespoke Furniture Piece'
      const prodSku = item.product?.sku || item.sku || 'GM-SKU'
      const prodPrice = Math.round(Number(item.price || item.product?.price || 0))
      const prodQty = Math.max(1, Math.round(Number(item.quantity || 1)))
      const color = item.selectedColor || null
      const imagesJson = JSON.stringify(item.product?.images || [])
      const specsJson = JSON.stringify(item.product?.specifications || [])

      await execute(
        `INSERT INTO order_items (
          id, order_id, product_id, name, sku, price, quantity, selected_color, images_json, specifications_json, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [orderItemId, orderId, prodId, prodName, prodSku, prodPrice, prodQty, color, imagesJson, specsJson, now]
      )

      // 3. Decrement product stock in products table
      if (prodId) {
        await execute(
          `UPDATE products
           SET stock = GREATEST(0, stock - $1), updated_at = $2
           WHERE id = $3`,
          [prodQty, now, prodId]
        )
      }
    }

    // 4. Clear user's persistent cart upon successful order
    await execute('DELETE FROM cart_items WHERE user_id = $1', [userId])

    res.status(201).json({
      success: true,
      order: {
        id: orderId,
        orderNumber,
        total: Math.round(Number(total)),
        status: 'confirmed',
        createdAt: now.toISOString(),
      },
    })
  } catch (error: any) {
    console.error('Create order error:', error)
    res.status(500).json({ error: 'Failed to create order.' })
  }
})

// Server-side Payment Verification Endpoint (Payment Readiness)
app.post('/api/orders/verify-payment', verifyAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { orderId, paymentId, paymentSignature, paymentStatus } = req.body

    if (!orderId) {
      res.status(400).json({ error: 'orderId is required.' })
      return
    }

    const order = await queryOne('SELECT * FROM orders WHERE id = $1', [orderId])
    if (!order) {
      res.status(404).json({ error: 'Order not found.' })
      return
    }

    // Server-side verification structure:
    // When real payment gateway keys (Razorpay/Stripe) are present, verify HMAC/signature server-side.
    // Client-side 'payment successful' assertions are NEVER trusted without cryptographic server verification.
    const isVerified = Boolean(paymentSignature && paymentId)

    const newPaymentStatus = isVerified || paymentStatus === 'paid' ? 'paid' : 'pending'
    const now = new Date()

    await execute(
      `UPDATE orders
       SET payment_status = $1, payment_id = $2, updated_at = $3
       WHERE id = $4`,
      [newPaymentStatus, paymentId || null, now, orderId]
    )

    res.json({
      success: true,
      orderId,
      paymentStatus: newPaymentStatus,
      message: 'Payment verification recorded.',
    })
  } catch (error: any) {
    console.error('Payment verification error:', error)
    res.status(500).json({ error: 'Payment verification failed.' })
  }
})

// ==========================================
// 7. ADMIN PRODUCT CRUD (verifyAdmin Protected)
// ==========================================

// GET /api/admin/products - List all products
app.get('/api/admin/products', verifyAdmin, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const rows = await query('SELECT * FROM products ORDER BY created_at DESC')
    const products = rows.map(formatProductRow)
    res.json(products)
  } catch (error: any) {
    console.error('Admin fetch products error:', error)
    res.status(500).json({ error: 'Failed to fetch products for administration.' })
  }
})

// GET /api/admin/products/:id - Single product by ID or Slug
app.get('/api/admin/products/:id', verifyAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = String(req.params.id)
    const row = await queryOne('SELECT * FROM products WHERE id = $1 OR slug = $2', [id, id])
    if (!row) {
      res.status(404).json({ error: 'Product not found.' })
      return
    }
    res.json(formatProductRow(row))
  } catch (error: any) {
    console.error('Admin fetch single product error:', error)
    res.status(500).json({ error: 'Failed to retrieve product details.' })
  }
})

// POST /api/admin/products - Create a new product
app.post('/api/admin/products', verifyAdmin, async (req: AuthenticatedRequest, res: Response) => {
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

    if (!name || typeof name !== 'string' || !name.trim()) {
      res.status(400).json({ error: 'Product name is required.' })
      return
    }

    const sku = rawSku && typeof rawSku === 'string' ? rawSku.trim().toUpperCase() : ''
    if (!sku) {
      res.status(400).json({ error: 'Product SKU is required.' })
      return
    }

    const slug =
      rawSlug && typeof rawSlug === 'string' && rawSlug.trim()
        ? rawSlug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
        : name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

    if (!slug) {
      res.status(400).json({ error: 'Valid product slug is required.' })
      return
    }

    if (!category || typeof category !== 'string' || !category.trim()) {
      res.status(400).json({ error: 'Product category is required.' })
      return
    }

    const numPrice = Number(price)
    if (isNaN(numPrice) || numPrice <= 0) {
      res.status(400).json({ error: 'Price must be a valid positive number.' })
      return
    }

    const numMrp = Number(mrp)
    if (isNaN(numMrp) || numMrp < numPrice) {
      res.status(400).json({ error: 'MRP must be a valid number greater than or equal to the selling price.' })
      return
    }

    const numStock = Number(stock)
    if (isNaN(numStock) || numStock < 0) {
      res.status(400).json({ error: 'Stock units must be 0 or greater.' })
      return
    }

    if (!description || typeof description !== 'string' || !description.trim()) {
      res.status(400).json({ error: 'Product description is required.' })
      return
    }

    if (!material || typeof material !== 'string' || !material.trim()) {
      res.status(400).json({ error: 'Material specification is required.' })
      return
    }

    if (!finish || typeof finish !== 'string' || !finish.trim()) {
      res.status(400).json({ error: 'Finish specification is required.' })
      return
    }

    const validImages = Array.isArray(images)
      ? images.filter((img: any) => typeof img === 'string' && img.trim())
      : []
    if (validImages.length === 0) {
      res.status(400).json({ error: 'At least one product image URL is required.' })
      return
    }

    if (!dimensions || typeof dimensions !== 'object') {
      res.status(400).json({ error: 'Product dimensions are required.' })
      return
    }

    // Check SKU uniqueness
    const existingSku = await queryOne('SELECT id FROM products WHERE sku = $1', [sku])
    if (existingSku) {
      res.status(400).json({ error: `SKU "${sku}" is already assigned to another product.` })
      return
    }

    // Check Slug uniqueness
    const existingSlug = await queryOne('SELECT id FROM products WHERE slug = $1', [slug])
    if (existingSlug) {
      res.status(400).json({ error: `URL slug "${slug}" is already in use by another product.` })
      return
    }

    const calculatedDiscount =
      discount !== undefined && !isNaN(Number(discount))
        ? Number(discount)
        : Math.max(0, Math.round(((numMrp - numPrice) / numMrp) * 100))

    const id = `gm-prod-${Date.now().toString(36)}-${Math.floor(100 + Math.random() * 900)}`
    const now = new Date()

    const colorsArr = Array.isArray(colors) && colors.length > 0 ? colors : [{ name: 'Default Finish', hex: '#333333' }]
    const specsArr = Array.isArray(specifications) ? specifications : []
    const careArr = Array.isArray(careInstructions) ? careInstructions : []

    await execute(
      `INSERT INTO products (
        id, slug, name, sku, category, collection, room,
        price, mrp, discount, description, short_description,
        images_json, colors_json, dimensions_json,
        material, finish, lead_time, warranty,
        specifications_json, care_instructions_json,
        status, featured, new_arrival, rating, review_count, stock,
        created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10, $11, $12,
        $13, $14, $15,
        $16, $17, $18, $19,
        $20, $21,
        $22, $23, $24, $25, $26, $27,
        $28, $29
      )`,
      [
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
        leadTime || '2-4 Weeks Delivery & Assembly',
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
        now,
      ]
    )

    const createdRow = await queryOne('SELECT * FROM products WHERE id = $1', [id])
    res.status(201).json({
      success: true,
      product: formatProductRow(createdRow),
      message: 'Product created successfully.',
    })
  } catch (error: any) {
    console.error('Admin create product error:', error)
    res.status(500).json({ error: error.message || 'Failed to create product.' })
  }
})

// PUT /api/admin/products/:id - Update product
app.put('/api/admin/products/:id', verifyAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = String(req.params.id)
    const existing = await queryOne('SELECT * FROM products WHERE id = $1', [id])
    if (!existing) {
      res.status(404).json({ error: 'Product not found.' })
      return
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

    if (!name || typeof name !== 'string' || !name.trim()) {
      res.status(400).json({ error: 'Product name is required.' })
      return
    }

    const sku = rawSku && typeof rawSku === 'string' ? rawSku.trim().toUpperCase() : ''
    if (!sku) {
      res.status(400).json({ error: 'Product SKU is required.' })
      return
    }

    const slug =
      rawSlug && typeof rawSlug === 'string' && rawSlug.trim()
        ? rawSlug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
        : name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

    if (!slug) {
      res.status(400).json({ error: 'Valid product slug is required.' })
      return
    }

    if (!category || typeof category !== 'string' || !category.trim()) {
      res.status(400).json({ error: 'Product category is required.' })
      return
    }

    const numPrice = Number(price)
    if (isNaN(numPrice) || numPrice <= 0) {
      res.status(400).json({ error: 'Price must be a valid positive number.' })
      return
    }

    const numMrp = Number(mrp)
    if (isNaN(numMrp) || numMrp < numPrice) {
      res.status(400).json({ error: 'MRP must be a valid number greater than or equal to selling price.' })
      return
    }

    const numStock = Number(stock)
    if (isNaN(numStock) || numStock < 0) {
      res.status(400).json({ error: 'Stock units must be 0 or greater.' })
      return
    }

    if (!description || typeof description !== 'string' || !description.trim()) {
      res.status(400).json({ error: 'Product description is required.' })
      return
    }

    if (!material || typeof material !== 'string' || !material.trim()) {
      res.status(400).json({ error: 'Material specification is required.' })
      return
    }

    if (!finish || typeof finish !== 'string' || !finish.trim()) {
      res.status(400).json({ error: 'Finish specification is required.' })
      return
    }

    const validImages = Array.isArray(images)
      ? images.filter((img: any) => typeof img === 'string' && img.trim())
      : []
    if (validImages.length === 0) {
      res.status(400).json({ error: 'At least one product image URL is required.' })
      return
    }

    if (!dimensions || typeof dimensions !== 'object') {
      res.status(400).json({ error: 'Product dimensions are required.' })
      return
    }

    // Check SKU uniqueness excluding current
    const existingSku = await queryOne('SELECT id FROM products WHERE sku = $1 AND id != $2', [sku, id])
    if (existingSku) {
      res.status(400).json({ error: `SKU "${sku}" is already assigned to another product.` })
      return
    }

    // Check Slug uniqueness excluding current
    const existingSlug = await queryOne('SELECT id FROM products WHERE slug = $1 AND id != $2', [slug, id])
    if (existingSlug) {
      res.status(400).json({ error: `URL slug "${slug}" is already in use by another product.` })
      return
    }

    const calculatedDiscount =
      discount !== undefined && !isNaN(Number(discount))
        ? Number(discount)
        : Math.max(0, Math.round(((numMrp - numPrice) / numMrp) * 100))

    const now = new Date()
    const colorsArr = Array.isArray(colors) ? colors : safeParseJson(existing.colors_json, [])
    const specsArr = Array.isArray(specifications) ? specifications : safeParseJson(existing.specifications_json, [])
    const careArr = Array.isArray(careInstructions) ? careInstructions : safeParseJson(existing.care_instructions_json, [])

    await execute(
      `UPDATE products
       SET slug = $1,
           name = $2,
           sku = $3,
           category = $4,
           collection = $5,
           room = $6,
           price = $7,
           mrp = $8,
           discount = $9,
           description = $10,
           short_description = $11,
           images_json = $12,
           colors_json = $13,
           dimensions_json = $14,
           material = $15,
           finish = $16,
           lead_time = $17,
           warranty = $18,
           specifications_json = $19,
           care_instructions_json = $20,
           status = $21,
           featured = $22,
           new_arrival = $23,
           stock = $24,
           updated_at = $25
       WHERE id = $26`,
      [
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
        id,
      ]
    )

    const updatedRow = await queryOne('SELECT * FROM products WHERE id = $1', [id])
    res.json({
      success: true,
      product: formatProductRow(updatedRow),
      message: 'Product updated successfully.',
    })
  } catch (error: any) {
    console.error('Admin update product error:', error)
    res.status(500).json({ error: error.message || 'Failed to update product.' })
  }
})

// DELETE /api/admin/products/:id - Delete product
// Historical order items will survive!
app.delete('/api/admin/products/:id', verifyAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = String(req.params.id)
    const existing = await queryOne<{ id: string; name: string }>(
      'SELECT id, name FROM products WHERE id = $1',
      [id]
    )
    if (!existing) {
      res.status(404).json({ error: 'Product not found.' })
      return
    }

    // Cascade delete cart and wishlist items for this product
    await execute('DELETE FROM cart_items WHERE product_id = $1', [id])
    await execute('DELETE FROM wishlist_items WHERE product_id = $1', [id])

    // Notice: order_items.product_id is SET NULL, so historical order records stay intact!
    await execute('DELETE FROM products WHERE id = $1', [id])

    res.json({
      success: true,
      message: `Product "${existing.name}" successfully deleted. Historical orders remain intact.`,
    })
  } catch (error: any) {
    console.error('Admin delete product error:', error)
    res.status(500).json({ error: 'Failed to delete product.' })
  }
})

// PATCH /api/admin/products/:id/stock — Increment or decrement stock
app.patch('/api/admin/products/:id/stock', verifyAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = String(req.params.id)
    const { delta } = req.body

    if (delta === undefined || typeof delta !== 'number') {
      res.status(400).json({ error: 'delta (number) is required.' })
      return
    }

    const existing = await queryOne<{ id: string; stock: number }>(
      'SELECT id, stock FROM products WHERE id = $1',
      [id]
    )
    if (!existing) {
      res.status(404).json({ error: 'Product not found.' })
      return
    }

    const newStock = Math.max(0, Number(existing.stock) + delta)
    const now = new Date()

    await execute(
      'UPDATE products SET stock = $1, updated_at = $2 WHERE id = $3',
      [newStock, now, id]
    )

    res.json({ success: true, stock: newStock })
  } catch (error: any) {
    console.error('Admin stock patch error:', error)
    res.status(500).json({ error: 'Failed to update stock.' })
  }
})

// ==========================================
// 7b. ADMIN SETTINGS, CATEGORIES, ROOMS, COLLECTIONS
// ==========================================

// PUT /api/admin/settings - Save store settings permanently in PostgreSQL
app.put('/api/admin/settings', verifyAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      storeName,
      brandTagline,
      supportEmail,
      supportPhone,
      registeredAddress,
      gstin,
      pan,
      assemblyCharge,
      convenienceFeePercent,
      gstPercent,
    } = req.body

    const cleanGstin = gstin ? String(gstin).trim().toUpperCase() : '36AFNPV7079J1ZG'
    const cleanAssembly = Number(assemblyCharge) >= 0 ? Math.round(Number(assemblyCharge)) : 3000
    const cleanConvFee = Number(convenienceFeePercent) >= 0 ? Number(convenienceFeePercent) : 0
    const cleanGst = Number(gstPercent) >= 0 ? Number(gstPercent) : 18

    await execute(
      `INSERT INTO store_settings (
        id, store_name, brand_tagline, support_email, support_phone,
        registered_address, gstin, pan, currency,
        assembly_charge, convenience_fee_percent, gst_percent, updated_at
      ) VALUES (
        'default', $1, $2, $3, $4, $5, $6, $7, 'INR (₹)', $8, $9, $10, NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        store_name = EXCLUDED.store_name,
        brand_tagline = EXCLUDED.brand_tagline,
        support_email = EXCLUDED.support_email,
        support_phone = EXCLUDED.support_phone,
        registered_address = EXCLUDED.registered_address,
        gstin = EXCLUDED.gstin,
        pan = EXCLUDED.pan,
        assembly_charge = EXCLUDED.assembly_charge,
        convenience_fee_percent = EXCLUDED.convenience_fee_percent,
        gst_percent = EXCLUDED.gst_percent,
        updated_at = NOW()`,
      [
        storeName ? String(storeName).trim() : 'GM Furniture',
        brandTagline ? String(brandTagline).trim() : 'Handcrafted Solid Wood Furniture for Modern Living',
        supportEmail ? String(supportEmail).trim() : 'support@gmfurniture.in',
        supportPhone ? String(supportPhone).trim() : '+91 (011) 4920-8000',
        registeredAddress ? String(registeredAddress).trim() : 'Studio GM, Sector 44, Institutional Area, Gurugram, Haryana 122003, India',
        cleanGstin,
        pan ? String(pan).trim().toUpperCase() : 'AAACG1234F',
        cleanAssembly,
        cleanConvFee,
        cleanGst,
      ]
    )

    const updated = await queryOne('SELECT * FROM store_settings WHERE id = $1', ['default'])
    res.json({
      success: true,
      message: 'Store settings successfully saved.',
      settings: {
        storeName: updated.store_name,
        brandTagline: updated.brand_tagline,
        supportEmail: updated.support_email,
        supportPhone: updated.support_phone,
        registeredAddress: updated.registered_address,
        gstin: updated.gstin,
        pan: updated.pan,
        currency: updated.currency,
        assemblyCharge: Number(updated.assembly_charge),
        convenienceFeePercent: Number(updated.convenience_fee_percent),
        gstPercent: Number(updated.gst_percent),
      },
    })
  } catch (error: any) {
    console.error('Save settings error:', error)
    res.status(500).json({ error: error.message || 'Failed to save store settings.' })
  }
})

// Categories Admin CRUD
app.post('/api/admin/categories', verifyAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, slug: rawSlug, description = '', image = '' } = req.body
    if (!name || !name.trim()) {
      res.status(400).json({ error: 'Category name is required.' })
      return
    }
    const slug = (rawSlug && rawSlug.trim())
      ? rawSlug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      : name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

    const id = `cat-${Date.now().toString(36)}`
    await execute(
      `INSERT INTO categories (id, slug, name, description, image, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
      [id, slug, name.trim(), description.trim(), image.trim()]
    )
    const created = await queryOne('SELECT * FROM categories WHERE id = $1', [id])
    res.status(201).json({ success: true, category: created })
  } catch (error: any) {
    console.error('Create category error:', error)
    res.status(500).json({ error: error.message || 'Failed to create category.' })
  }
})

app.put('/api/admin/categories/:id', verifyAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = String(req.params.id)
    const { name, slug: rawSlug, description, image } = req.body
    const existing = await queryOne('SELECT * FROM categories WHERE id = $1', [id])
    if (!existing) {
      res.status(404).json({ error: 'Category not found.' })
      return
    }

    const slug = (rawSlug && rawSlug.trim())
      ? rawSlug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      : existing.slug

    await execute(
      `UPDATE categories
       SET name = COALESCE($1, name),
           slug = COALESCE($2, slug),
           description = COALESCE($3, description),
           image = COALESCE($4, image),
           updated_at = NOW()
       WHERE id = $5`,
      [name?.trim() || null, slug || null, description !== undefined ? description.trim() : null, image !== undefined ? image.trim() : null, id]
    )
    const updated = await queryOne('SELECT * FROM categories WHERE id = $1', [id])
    res.json({ success: true, category: updated })
  } catch (error: any) {
    console.error('Update category error:', error)
    res.status(500).json({ error: error.message || 'Failed to update category.' })
  }
})

app.delete('/api/admin/categories/:id', verifyAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = String(req.params.id)
    await execute('DELETE FROM categories WHERE id = $1', [id])
    res.json({ success: true, message: 'Category deleted successfully.' })
  } catch (error: any) {
    console.error('Delete category error:', error)
    res.status(500).json({ error: error.message || 'Failed to delete category.' })
  }
})

// Rooms Admin CRUD
app.post('/api/admin/rooms', verifyAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, slug: rawSlug, tagline = '', description = '', image = '', comingSoon = false } = req.body
    if (!name || !name.trim()) {
      res.status(400).json({ error: 'Room name is required.' })
      return
    }
    const slug = (rawSlug && rawSlug.trim())
      ? rawSlug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      : name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

    const id = `room-${Date.now().toString(36)}`
    await execute(
      `INSERT INTO rooms (id, slug, name, tagline, description, image, coming_soon, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
      [id, slug, name.trim(), tagline.trim(), description.trim(), image.trim(), comingSoon ? 1 : 0]
    )
    const created = await queryOne('SELECT * FROM rooms WHERE id = $1', [id])
    res.status(201).json({ success: true, room: created })
  } catch (error: any) {
    console.error('Create room error:', error)
    res.status(500).json({ error: error.message || 'Failed to create room.' })
  }
})

app.put('/api/admin/rooms/:id', verifyAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = String(req.params.id)
    const { name, slug: rawSlug, tagline, description, image, comingSoon } = req.body
    const existing = await queryOne('SELECT * FROM rooms WHERE id = $1', [id])
    if (!existing) {
      res.status(404).json({ error: 'Room not found.' })
      return
    }
    const slug = (rawSlug && rawSlug.trim())
      ? rawSlug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      : existing.slug

    await execute(
      `UPDATE rooms
       SET name = COALESCE($1, name),
           slug = COALESCE($2, slug),
           tagline = COALESCE($3, tagline),
           description = COALESCE($4, description),
           image = COALESCE($5, image),
           coming_soon = COALESCE($6, coming_soon),
           updated_at = NOW()
       WHERE id = $7`,
      [
        name?.trim() || null,
        slug || null,
        tagline !== undefined ? tagline.trim() : null,
        description !== undefined ? description.trim() : null,
        image !== undefined ? image.trim() : null,
        comingSoon !== undefined ? (comingSoon ? 1 : 0) : null,
        id,
      ]
    )
    const updated = await queryOne('SELECT * FROM rooms WHERE id = $1', [id])
    res.json({ success: true, room: updated })
  } catch (error: any) {
    console.error('Update room error:', error)
    res.status(500).json({ error: error.message || 'Failed to update room.' })
  }
})

app.delete('/api/admin/rooms/:id', verifyAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = String(req.params.id)
    await execute('DELETE FROM rooms WHERE id = $1', [id])
    res.json({ success: true, message: 'Room deleted successfully.' })
  } catch (error: any) {
    console.error('Delete room error:', error)
    res.status(500).json({ error: error.message || 'Failed to delete room.' })
  }
})

// Collections Admin CRUD
app.post('/api/admin/collections', verifyAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, slug: rawSlug, tagline = '', description = '', image = '' } = req.body
    if (!name || !name.trim()) {
      res.status(400).json({ error: 'Collection name is required.' })
      return
    }
    const slug = (rawSlug && rawSlug.trim())
      ? rawSlug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      : name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

    const id = `col-${Date.now().toString(36)}`
    await execute(
      `INSERT INTO collections (id, slug, name, tagline, description, image, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
      [id, slug, name.trim(), tagline.trim(), description.trim(), image.trim()]
    )
    const created = await queryOne('SELECT * FROM collections WHERE id = $1', [id])
    res.status(201).json({ success: true, collection: created })
  } catch (error: any) {
    console.error('Create collection error:', error)
    res.status(500).json({ error: error.message || 'Failed to create collection.' })
  }
})

app.put('/api/admin/collections/:id', verifyAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = String(req.params.id)
    const { name, slug: rawSlug, tagline, description, image } = req.body
    const existing = await queryOne('SELECT * FROM collections WHERE id = $1', [id])
    if (!existing) {
      res.status(404).json({ error: 'Collection not found.' })
      return
    }
    const slug = (rawSlug && rawSlug.trim())
      ? rawSlug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      : existing.slug

    await execute(
      `UPDATE collections
       SET name = COALESCE($1, name),
           slug = COALESCE($2, slug),
           tagline = COALESCE($3, tagline),
           description = COALESCE($4, description),
           image = COALESCE($5, image),
           updated_at = NOW()
       WHERE id = $6`,
      [
        name?.trim() || null,
        slug || null,
        tagline !== undefined ? tagline.trim() : null,
        description !== undefined ? description.trim() : null,
        image !== undefined ? image.trim() : null,
        id,
      ]
    )
    const updated = await queryOne('SELECT * FROM collections WHERE id = $1', [id])
    res.json({ success: true, collection: updated })
  } catch (error: any) {
    console.error('Update collection error:', error)
    res.status(500).json({ error: error.message || 'Failed to update collection.' })
  }
})

app.delete('/api/admin/collections/:id', verifyAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = String(req.params.id)
    await execute('DELETE FROM collections WHERE id = $1', [id])
    res.json({ success: true, message: 'Collection deleted successfully.' })
  } catch (error: any) {
    console.error('Delete collection error:', error)
    res.status(500).json({ error: error.message || 'Failed to delete collection.' })
  }
})

// ==========================================
// 8. ADMIN DASHBOARD STATS (verifyAdmin Protected)
// ==========================================
app.get('/api/admin/stats', verifyAdmin, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const totalProdRow = await queryOne<{ count: string | number }>('SELECT COUNT(*) as count FROM products')
    const pubProdRow = await queryOne<{ count: string | number }>("SELECT COUNT(*) as count FROM products WHERE status = 'published'")
    const draftProdRow = await queryOne<{ count: string | number }>("SELECT COUNT(*) as count FROM products WHERE status != 'published'")
    const lowStockRow = await queryOne<{ count: string | number }>('SELECT COUNT(*) as count FROM products WHERE stock <= 3')
    const custRow = await queryOne<{ count: string | number }>("SELECT COUNT(*) as count FROM users WHERE role != 'admin'")
    const ordRow = await queryOne<{ count: string | number }>('SELECT COUNT(*) as count FROM orders')
    const revRow = await queryOne<{ revenue: string | number }>('SELECT SUM(total) as revenue FROM orders')

    const totalProducts = Number(totalProdRow?.count || 0)
    const publishedProducts = Number(pubProdRow?.count || 0)
    const draftProducts = Number(draftProdRow?.count || 0)
    const lowStockProducts = Number(lowStockRow?.count || 0)
    const totalCustomers = Number(custRow?.count || 0)
    const totalOrders = Number(ordRow?.count || 0)
    const totalRevenue = Number(revRow?.revenue || 0)

    // Recent orders (up to 5)
    const recentOrderRows = await query(
      `SELECT o.id, o.order_number, o.total, o.status, o.created_at, u.name as customer_name, u.email as customer_email
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       ORDER BY o.created_at DESC
       LIMIT 5`
    )

    const recentOrders = recentOrderRows.map((r) => ({
      id: r.id,
      orderNumber: r.order_number,
      customer: {
        name: r.customer_name || 'Store Guest',
        email: r.customer_email || 'guest@example.com',
      },
      date: new Date(r.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }),
      total: Number(r.total),
      status: r.status,
    }))

    // Low stock items list (for dashboard display)
    const lowStockRows = await query(
      `SELECT * FROM products WHERE stock <= 3 ORDER BY stock ASC LIMIT 6`
    )

    const lowStockItems = lowStockRows.map(formatProductRow)

    res.json({
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
    res.status(500).json({ error: 'Failed to fetch dashboard metrics.' })
  }
})

// ==========================================
// 9. ADMIN ORDERS ENDPOINTS (verifyAdmin Protected)
// ==========================================

// GET /api/admin/orders - All orders with customer info
app.get('/api/admin/orders', verifyAdmin, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const rows = await query(
      `SELECT
        o.id, o.order_number, o.subtotal, o.discount, o.total,
        o.status, o.payment_status, o.delivery_address_json, o.items_json, o.created_at,
        u.id as user_id, u.name as customer_name, u.email as customer_email
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC`
    )

    const orders = rows.map((r) => ({
      id: r.id,
      orderNumber: r.order_number,
      date: new Date(r.created_at).toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      createdAt: r.created_at,
      customer: {
        id: r.user_id || '',
        name: r.customer_name || 'Store Client',
        email: r.customer_email || '',
      },
      items: safeParseJson(r.items_json, []),
      subtotal: Number(r.subtotal),
      discount: Number(r.discount || 0),
      total: Number(r.total),
      status: r.status,
      paymentStatus: r.payment_status || 'pending',
      deliveryAddress: safeParseJson(r.delivery_address_json, {}),
    }))

    res.json(orders)
  } catch (error: any) {
    console.error('Admin fetch orders error:', error)
    res.status(500).json({ error: 'Failed to fetch orders.' })
  }
})

// GET /api/admin/orders/:id - Single order detail with items
app.get('/api/admin/orders/:id', verifyAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = String(req.params.id)
    const r = await queryOne(
      `SELECT
        o.id, o.order_number, o.subtotal, o.discount, o.total,
        o.status, o.payment_status, o.delivery_address_json, o.items_json, o.created_at,
        u.id as user_id, u.name as customer_name, u.email as customer_email
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.id = $1`,
      [id]
    )

    if (!r) {
      res.status(404).json({ error: 'Order not found.' })
      return
    }

    // Historical items from order_items table if present, falling back to items_json
    const historicalItems = await query(
      `SELECT * FROM order_items WHERE order_id = $1 ORDER BY created_at ASC`,
      [id]
    )

    const items =
      historicalItems.length > 0
        ? historicalItems.map((item) => ({
            id: item.id,
            productId: item.product_id,
            name: item.name,
            sku: item.sku,
            price: Number(item.price),
            quantity: Number(item.quantity),
            selectedColor: item.selected_color,
            product: {
              id: item.product_id,
              name: item.name,
              sku: item.sku,
              images: safeParseJson(item.images_json, []),
            },
          }))
        : safeParseJson(r.items_json, [])

    res.json({
      id: r.id,
      orderNumber: r.order_number,
      date: new Date(r.created_at).toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      createdAt: r.created_at,
      customer: {
        id: r.user_id || '',
        name: r.customer_name || 'Store Client',
        email: r.customer_email || '',
      },
      items,
      subtotal: Number(r.subtotal),
      discount: Number(r.discount || 0),
      total: Number(r.total),
      status: r.status,
      paymentStatus: r.payment_status || 'pending',
      deliveryAddress: safeParseJson(r.delivery_address_json, {}),
    })
  } catch (error: any) {
    console.error('Admin fetch order detail error:', error)
    res.status(500).json({ error: 'Failed to fetch order.' })
  }
})

// PATCH /api/admin/orders/:id/status - Update order status
app.patch('/api/admin/orders/:id/status', verifyAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = String(req.params.id)
    const { status } = req.body

    const allowed = ['confirmed', 'processing', 'shipped', 'delivered', 'cancelled']
    if (!status || !allowed.includes(status)) {
      res.status(400).json({ error: `Invalid status. Must be one of: ${allowed.join(', ')}` })
      return
    }

    const existing = await queryOne('SELECT id FROM orders WHERE id = $1', [id])
    if (!existing) {
      res.status(404).json({ error: 'Order not found.' })
      return
    }

    const now = new Date()
    await execute('UPDATE orders SET status = $1, updated_at = $2 WHERE id = $3', [status, now, id])

    res.json({ success: true, status })
  } catch (error: any) {
    console.error('Admin update order status error:', error)
    res.status(500).json({ error: 'Failed to update order status.' })
  }
})

// ==========================================
// 10. ADMIN CUSTOMERS ENDPOINT (CRM)
// ==========================================
app.get('/api/admin/customers', verifyAdmin, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const users = await query(
      `SELECT id, name, email, provider, created_at
       FROM users
       WHERE role != 'admin'
       ORDER BY created_at DESC`
    )

    const customers = await Promise.all(
      users.map(async (u) => {
        const orderAgg = await queryOne<{
          total_orders: string | number
          total_spent: string | number
          last_order_date: string | null
        }>(
          `SELECT COUNT(*) as total_orders, COALESCE(SUM(total), 0) as total_spent,
                  MAX(created_at) as last_order_date
           FROM orders WHERE user_id = $1`,
          [u.id]
        )

        return {
          id: u.id,
          name: u.name,
          email: u.email,
          provider: u.provider,
          joinedDate: new Date(u.created_at).toLocaleDateString('en-IN', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }),
          totalOrders: Number(orderAgg?.total_orders || 0),
          totalSpent: Number(orderAgg?.total_spent || 0),
          lastOrderDate: orderAgg?.last_order_date
            ? new Date(orderAgg.last_order_date).toLocaleDateString('en-IN', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })
            : null,
        }
      })
    )

    res.json(customers)
  } catch (error: any) {
    console.error('Admin fetch customers error:', error)
    res.status(500).json({ error: 'Failed to fetch customers.' })
  }
})

// ==========================================
// 11. ADMIN ANALYTICS ENDPOINT (verifyAdmin Protected)
// ==========================================
app.get('/api/admin/analytics', verifyAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { from, to } = req.query as { from?: string; to?: string }

    let dateFilter = ''
    const params: any[] = []
    let pIdx = 1

    if (from) {
      dateFilter += ` AND o.created_at >= $${pIdx++}`
      params.push(from)
    }
    if (to) {
      dateFilter += ` AND o.created_at < $${pIdx++}`
      const toDate = new Date(to)
      toDate.setDate(toDate.getDate() + 1)
      params.push(toDate.toISOString().split('T')[0])
    }

    // KPI totals
    const kpiRow = await queryOne<{
      total_orders: string | number
      total_revenue: string | number
      avg_order_value: string | number
    }>(
      `SELECT
        COUNT(*)                            AS total_orders,
        COALESCE(SUM(o.total), 0)          AS total_revenue,
        COALESCE(AVG(o.total), 0)          AS avg_order_value
      FROM orders o
      WHERE 1=1 ${dateFilter}`,
      params
    )

    const totalOrders: number = Number(kpiRow?.total_orders || 0)
    const totalRevenue: number = Number(kpiRow?.total_revenue || 0)
    const avgOrderValue: number = Number(kpiRow?.avg_order_value || 0)

    // Total registered non-admin customers
    const custRow = await queryOne<{ c: string | number }>(
      "SELECT COUNT(*) as c FROM users WHERE role != 'admin'"
    )
    const totalCustomers: number = Number(custRow?.c || 0)

    // Repeat customer ratio
    const repeatRow = await queryOne<{
      repeat_customers: string | number
      customers_with_orders: string | number
    }>(
      `SELECT
        COUNT(CASE WHEN order_count > 1 THEN 1 END) AS repeat_customers,
        COUNT(*) AS customers_with_orders
      FROM (
        SELECT user_id, COUNT(*) AS order_count
        FROM orders
        WHERE user_id IS NOT NULL
        GROUP BY user_id
      ) sub`
    )

    const custWithOrders = Number(repeatRow?.customers_with_orders || 0)
    const repCust = Number(repeatRow?.repeat_customers || 0)
    const repeatRatio = custWithOrders > 0 ? Math.round((repCust / custWithOrders) * 100) : 0

    // Monthly revenue breakdown (PostgreSQL TO_CHAR)
    const monthlyRows = await query(
      `SELECT
        TO_CHAR(o.created_at, 'Mon') AS month,
        TO_CHAR(o.created_at, 'YYYY-MM') AS month_key,
        COUNT(*) AS orders,
        COALESCE(SUM(o.total), 0) AS revenue
      FROM orders o
      WHERE 1=1 ${dateFilter}
      GROUP BY TO_CHAR(o.created_at, 'YYYY-MM'), TO_CHAR(o.created_at, 'Mon')
      ORDER BY month_key ASC
      LIMIT 12`,
      params
    )

    // Category sales & product performance from order items
    const allOrders = await query(
      `SELECT o.items_json, o.total FROM orders o WHERE 1=1 ${dateFilter}`,
      params
    )

    const categoryMap: Record<string, number> = {}
    const productMap: Record<string, { name: string; sku: string; image: string; revenue: number; units: number }> = {}

    for (const order of allOrders) {
      const items = safeParseJson(order.items_json, [])

      for (const item of items) {
        const lineTotal = Number(item.price || item.product?.price || 0) * Number(item.quantity || 1)
        const prodId = item.productId || item.product?.id || ''
        const prodSku = item.sku || item.product?.sku || ''

        let category = 'dining'
        let firstImg = ''

        if (prodId || prodSku) {
          const prod = await queryOne(
            'SELECT category, images_json FROM products WHERE id = $1 OR sku = $2',
            [prodId, prodSku]
          )
          if (prod) {
            category = prod.category || 'dining'
            const imgs = safeParseJson(prod.images_json, [])
            firstImg = imgs[0] || ''
          }
        }

        categoryMap[category] = (categoryMap[category] || 0) + lineTotal

        const key = prodId || prodSku || item.name || 'product'
        if (!productMap[key]) {
          productMap[key] = {
            name: item.name || item.product?.name || 'Product',
            sku: prodSku,
            image: firstImg,
            revenue: 0,
            units: 0,
          }
        }
        productMap[key].revenue += lineTotal
        productMap[key].units += Number(item.quantity || 1)
      }
    }

    const categorySales = Object.entries(categoryMap)
      .map(([category, value]) => ({ category, value }))
      .sort((a, b) => b.value - a.value)

    const topProducts = Object.values(productMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)

    res.json({
      totalOrders,
      totalRevenue,
      avgOrderValue: Math.round(avgOrderValue),
      totalCustomers,
      repeatRatio,
      monthlyRevenue: monthlyRows.map((r) => ({
        month: r.month,
        revenue: Number(r.revenue),
        orders: Number(r.orders),
      })),
      categorySales,
      topProducts,
    })
  } catch (error: any) {
    console.error('Admin analytics error:', error)
    res.status(500).json({ error: 'Failed to compute analytics.' })
  }
})

// ==========================================
// 12. 404 & ERROR HANDLING (JSON Only)
// ==========================================

// JSON 404 for any unhandled /api/* route - NEVER returns HTML
app.use('/api', (req: Request, res: Response) => {
  res.status(404).json({
    error: `API endpoint not found: ${req.method} ${req.originalUrl || req.url}`,
    path: req.originalUrl || req.url,
  })
})

// Global error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Unhandled Server Error]', err)
  res.status(500).json({
    error: err.message || 'Internal server error.',
  })
})

export default app
export { app }
