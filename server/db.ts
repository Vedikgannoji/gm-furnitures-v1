import pg from 'pg'
import bcrypt from 'bcryptjs'
import crypto from 'node:crypto'
import dotenv from 'dotenv'
import { CANONICAL_PRODUCTS } from '../src/data/canonicalProducts'

dotenv.config()

const { Pool } = pg

let pool: pg.Pool | null = null

export function getPool(): pg.Pool {
  if (!pool) {
    const connectionString =
      process.env.DATABASE_URL ||
      process.env.POSTGRES_URL ||
      process.env.POSTGRES_PRISMA_URL ||
      ''

    const isLocalhost =
      connectionString.includes('localhost') ||
      connectionString.includes('127.0.0.1')

    pool = new Pool({
      connectionString: connectionString || undefined,
      ssl: connectionString && !isLocalhost ? { rejectUnauthorized: false } : false,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    })

    pool.on('error', (err) => {
      console.error('[PostgreSQL Pool Error]', err)
    })
  }
  return pool
}

export function hasDatabaseUrl(): boolean {
  const connectionString =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    ''
  return connectionString.trim().length > 0
}

export async function testDatabaseConnection(): Promise<{ ok: boolean; error?: string }> {
  if (!hasDatabaseUrl()) {
    return { ok: false, error: 'DATABASE_URL is not set' }
  }
  try {
    const p = getPool()
    await p.query('SELECT 1')
    return { ok: true }
  } catch (err: any) {
    return { ok: false, error: err?.message || String(err) }
  }
}

/**
 * Execute a query returning an array of typed rows
 */
export async function query<T = any>(text: string, params: any[] = []): Promise<T[]> {
  if (!hasDatabaseUrl()) {
    throw new Error('Database is not configured. DATABASE_URL is missing.')
  }
  const p = getPool()
  const result = await p.query(text, params)
  return result.rows as T[]
}

/**
 * Execute a query returning a single row or null
 */
export async function queryOne<T = any>(text: string, params: any[] = []): Promise<T | null> {
  const rows = await query<T>(text, params)
  return rows.length > 0 ? rows[0] : null
}

/**
 * Execute a mutation query (INSERT, UPDATE, DELETE)
 */
export async function execute(text: string, params: any[] = []): Promise<{ rowCount: number }> {
  if (!hasDatabaseUrl()) {
    throw new Error('Database is not configured. DATABASE_URL is missing.')
  }
  const p = getPool()
  const result = await p.query(text, params)
  return { rowCount: result.rowCount || 0 }
}

let initPromise: Promise<void> | null = null

export function ensureDatabaseInitialized(): Promise<void> {
  if (!initPromise) {
    initPromise = initDatabase().catch((err) => {
      console.error('[Database] Initialization failed:', err)
      initPromise = null // Allow retry on next request if initialization failed
      throw err
    })
  }
  return initPromise
}

export async function initDatabase(): Promise<void> {
  const connectionString =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL

  if (!connectionString) {
    console.warn('[Database] WARNING: DATABASE_URL is not set. Database initialization skipped.')
    return
  }

  // 1. Create tables
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255),
      provider VARCHAR(50) NOT NULL DEFAULT 'local',
      provider_id VARCHAR(255),
      avatar_url TEXT,
      role VARCHAR(50) NOT NULL DEFAULT 'customer',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS products (
      id VARCHAR(64) PRIMARY KEY,
      slug VARCHAR(255) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      sku VARCHAR(100) UNIQUE NOT NULL,
      category VARCHAR(100) NOT NULL,
      collection VARCHAR(100),
      room VARCHAR(100),
      price INTEGER NOT NULL,
      mrp INTEGER NOT NULL,
      discount INTEGER NOT NULL DEFAULT 0,
      description TEXT NOT NULL,
      short_description TEXT NOT NULL,
      images_json TEXT NOT NULL DEFAULT '[]',
      colors_json TEXT NOT NULL DEFAULT '[]',
      dimensions_json TEXT NOT NULL DEFAULT '{}',
      material VARCHAR(255) NOT NULL,
      finish VARCHAR(255) NOT NULL,
      lead_time VARCHAR(255) NOT NULL,
      warranty VARCHAR(255) NOT NULL,
      specifications_json TEXT NOT NULL DEFAULT '[]',
      care_instructions_json TEXT NOT NULL DEFAULT '[]',
      status VARCHAR(50) NOT NULL DEFAULT 'published',
      featured INTEGER NOT NULL DEFAULT 0,
      new_arrival INTEGER NOT NULL DEFAULT 0,
      rating REAL NOT NULL DEFAULT 5.0,
      review_count INTEGER NOT NULL DEFAULT 0,
      stock INTEGER NOT NULL DEFAULT 10,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS cart_items (
      id VARCHAR(64) PRIMARY KEY,
      user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      product_id VARCHAR(64) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      quantity INTEGER NOT NULL DEFAULT 1,
      selected_color VARCHAR(100) NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(user_id, product_id, selected_color)
    );

    CREATE TABLE IF NOT EXISTS wishlist_items (
      id VARCHAR(64) PRIMARY KEY,
      user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      product_id VARCHAR(64) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(user_id, product_id)
    );

    CREATE TABLE IF NOT EXISTS addresses (
      id VARCHAR(64) PRIMARY KEY,
      user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      full_name VARCHAR(255) NOT NULL,
      phone VARCHAR(50) NOT NULL,
      address_line TEXT NOT NULL,
      city VARCHAR(100) NOT NULL,
      state VARCHAR(100) NOT NULL,
      pincode VARCHAR(20) NOT NULL,
      is_default INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS orders (
      id VARCHAR(64) PRIMARY KEY,
      order_number VARCHAR(100) UNIQUE NOT NULL,
      user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
      subtotal INTEGER NOT NULL,
      discount INTEGER NOT NULL DEFAULT 0,
      total INTEGER NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'confirmed',
      payment_status VARCHAR(50) NOT NULL DEFAULT 'pending',
      payment_method VARCHAR(50) NOT NULL DEFAULT 'cod',
      payment_id VARCHAR(255),
      delivery_address_json TEXT NOT NULL,
      items_json TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id VARCHAR(64) PRIMARY KEY,
      order_id VARCHAR(64) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id VARCHAR(64) REFERENCES products(id) ON DELETE SET NULL,
      name VARCHAR(255) NOT NULL,
      sku VARCHAR(100) NOT NULL,
      price INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      selected_color VARCHAR(100),
      images_json TEXT,
      specifications_json TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `)

  // 2. Create indexes for performance
  await query(`
    CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
    CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
    CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
    CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
    CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
    CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
    CREATE INDEX IF NOT EXISTS idx_cart_user_id ON cart_items(user_id);
    CREATE INDEX IF NOT EXISTS idx_wishlist_user_id ON wishlist_items(user_id);
    CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON addresses(user_id);
  `)

  // 3. Seed admin user
  await seedAdminUser()

  // 4. Seed initial products if table is empty
  await seedInitialProducts()
}

export async function seedAdminUser(): Promise<void> {
  const adminEmail = (process.env.ADMIN_EMAIL || 'vedikgannoji5126@gmail.com').trim().toLowerCase()
  const adminPassword = process.env.ADMIN_PASSWORD || 'Vedik@2006'
  const hash = bcrypt.hashSync(adminPassword, 10)
  const now = new Date()

  const existing = await queryOne<{ id: string; email: string; role: string }>(
    'SELECT id, email, role FROM users WHERE email = $1',
    [adminEmail]
  )

  if (!existing) {
    const adminId = `usr_admin_${crypto.randomUUID()}`
    await execute(
      `INSERT INTO users (id, name, email, password_hash, provider, role, created_at, updated_at)
       VALUES ($1, $2, $3, $4, 'local', 'admin', $5, $6)`,
      [adminId, 'Administrator', adminEmail, hash, now, now]
    )
    console.log(`[Database] Initialized designated admin user: ${adminEmail}`)
  } else {
    await execute(
      `UPDATE users
       SET role = 'admin', password_hash = $1, updated_at = $2
       WHERE email = $3`,
      [hash, now, adminEmail]
    )
    console.log(`[Database] Ensured admin privileges for: ${adminEmail}`)
  }
}

export async function seedInitialProducts(): Promise<void> {
  const row = await queryOne<{ count: string | number }>(
    'SELECT COUNT(*) as count FROM products'
  )
  const count = Number(row?.count || 0)

  // Only seed if table is completely empty to preserve manual admin edits/creations
  if (count > 0) {
    return
  }

  console.log('[Database] Seeding initial canonical architectural dining table products...')

  for (const p of CANONICAL_PRODUCTS) {
    const now = new Date()
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
      ) ON CONFLICT (id) DO NOTHING`,
      [
        p.id,
        p.slug,
        p.name,
        p.sku,
        p.category,
        p.collection || null,
        p.room || null,
        Math.round(p.price),
        Math.round(p.mrp),
        p.discount || 0,
        p.description,
        p.shortDescription || p.description.slice(0, 150),
        JSON.stringify(p.images || []),
        JSON.stringify(p.colors || []),
        JSON.stringify(p.dimensions || {}),
        p.material,
        p.finish,
        p.leadTime || '2-3 Weeks White-Glove Installation',
        p.warranty || '10-Year Framework Structural Warranty',
        JSON.stringify(p.specifications || []),
        JSON.stringify(p.careInstructions || []),
        p.status || 'published',
        p.featured ? 1 : 0,
        p.newArrival ? 1 : 0,
        p.rating || 5.0,
        p.reviewCount || 0,
        p.stock !== undefined ? p.stock : 10,
        now,
        now,
      ]
    )
  }

  console.log(`[Database] Successfully seeded ${CANONICAL_PRODUCTS.length} canonical products.`)
}
