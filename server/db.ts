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
      assembly_charge INTEGER NOT NULL DEFAULT 0,
      convenience_fee INTEGER NOT NULL DEFAULT 0,
      convenience_fee_percent REAL NOT NULL DEFAULT 0,
      gst INTEGER NOT NULL DEFAULT 0,
      gst_percent REAL NOT NULL DEFAULT 18,
      total INTEGER NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'confirmed',
      payment_status VARCHAR(50) NOT NULL DEFAULT 'pending',
      payment_method VARCHAR(50) NOT NULL DEFAULT 'cashfree',
      payment_id VARCHAR(255),
      payment_order_id VARCHAR(255),
      payment_transaction_id VARCHAR(255),
      payment_gateway VARCHAR(50) DEFAULT 'cashfree',
      payment_session_id VARCHAR(255),
      paid_at TIMESTAMPTZ,
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

    CREATE TABLE IF NOT EXISTS categories (
      id VARCHAR(64) PRIMARY KEY,
      slug VARCHAR(255) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      image TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS rooms (
      id VARCHAR(64) PRIMARY KEY,
      slug VARCHAR(255) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      tagline VARCHAR(255) NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      image TEXT NOT NULL DEFAULT '',
      coming_soon INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS collections (
      id VARCHAR(64) PRIMARY KEY,
      slug VARCHAR(255) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      tagline VARCHAR(255) NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      image TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS store_settings (
      id VARCHAR(64) PRIMARY KEY DEFAULT 'default',
      store_name VARCHAR(255) NOT NULL DEFAULT 'GM Furniture',
      brand_tagline VARCHAR(255) NOT NULL DEFAULT 'Handcrafted Solid Wood Furniture for Modern Living',
      support_email VARCHAR(255) NOT NULL DEFAULT 'support@gmfurniture.in',
      support_phone VARCHAR(50) NOT NULL DEFAULT '+91 (011) 4920-8000',
      registered_address TEXT NOT NULL DEFAULT 'Studio GM, Sector 44, Institutional Area, Gurugram, Haryana 122003, India',
      gstin VARCHAR(50) NOT NULL DEFAULT '36AFNPV7079J1ZG',
      pan VARCHAR(50) NOT NULL DEFAULT 'AAACG1234F',
      currency VARCHAR(20) NOT NULL DEFAULT 'INR (₹)',
      assembly_charge INTEGER NOT NULL DEFAULT 3000,
      convenience_fee_percent REAL NOT NULL DEFAULT 0,
      gst_percent REAL NOT NULL DEFAULT 18,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS coupons (
      id VARCHAR(64) PRIMARY KEY,
      code VARCHAR(100) UNIQUE NOT NULL,
      discount_type VARCHAR(50) NOT NULL,
      discount_value NUMERIC(12, 2) NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS order_status_history (
      id VARCHAR(64) PRIMARY KEY,
      order_id VARCHAR(64) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      old_status VARCHAR(50) NOT NULL,
      new_status VARCHAR(50) NOT NULL,
      changed_by VARCHAR(255) NOT NULL,
      changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS contact_inquiries (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      phone VARCHAR(50),
      subject VARCHAR(255),
      message TEXT NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'new',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `)

  // 1b. Schema migrations for existing tables (seamless upgrade)
  await query(`
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS assembly_charge NUMERIC(12, 2) NOT NULL DEFAULT 0;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS convenience_fee NUMERIC(12, 2) NOT NULL DEFAULT 0;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS convenience_fee_percent REAL NOT NULL DEFAULT 0;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS gst NUMERIC(12, 2) NOT NULL DEFAULT 0;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS gst_percent REAL NOT NULL DEFAULT 18;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_order_id VARCHAR(255);
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_transaction_id VARCHAR(255);
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_gateway VARCHAR(50) DEFAULT 'cashfree';
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_session_id VARCHAR(255);
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_code VARCHAR(100);
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_discount_type VARCHAR(50);
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_discount_value NUMERIC(12, 2);
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_discount_amount NUMERIC(12, 2) DEFAULT 0;
    ALTER TABLE orders ALTER COLUMN subtotal TYPE NUMERIC(12, 2);
    ALTER TABLE orders ALTER COLUMN total TYPE NUMERIC(12, 2);
    ALTER TABLE orders ALTER COLUMN assembly_charge TYPE NUMERIC(12, 2);
    ALTER TABLE orders ALTER COLUMN convenience_fee TYPE NUMERIC(12, 2);
    ALTER TABLE orders ALTER COLUMN gst TYPE NUMERIC(12, 2);
    CREATE INDEX IF NOT EXISTS idx_orders_payment_order_id ON orders(payment_order_id);

    ALTER TABLE order_items ADD COLUMN IF NOT EXISTS product_slug VARCHAR(255);
    ALTER TABLE order_items ADD COLUMN IF NOT EXISTS product_image TEXT;
    ALTER TABLE order_items ADD COLUMN IF NOT EXISTS material VARCHAR(255);
    ALTER TABLE order_items ADD COLUMN IF NOT EXISTS finish VARCHAR(255);
  `).catch((err) => {
    console.warn('[Database] Note on orders/order_items table schema migration:', err.message)
  })

  // 2. Create indexes for performance
  await query(`
    CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
    CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
    CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
    CREATE INDEX IF NOT EXISTS idx_products_room ON products(room);
    CREATE INDEX IF NOT EXISTS idx_products_collection ON products(collection);
    CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
    CREATE INDEX IF NOT EXISTS idx_rooms_slug ON rooms(slug);
    CREATE INDEX IF NOT EXISTS idx_collections_slug ON collections(slug);
    CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
    CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
    CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
    CREATE INDEX IF NOT EXISTS idx_cart_user_id ON cart_items(user_id);
    CREATE INDEX IF NOT EXISTS idx_wishlist_user_id ON wishlist_items(user_id);
    CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON addresses(user_id);
    CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
    CREATE INDEX IF NOT EXISTS idx_coupons_is_active ON coupons(is_active);
    CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON order_status_history(order_id);
    CREATE INDEX IF NOT EXISTS idx_contact_inquiries_status ON contact_inquiries(status);
    CREATE INDEX IF NOT EXISTS idx_contact_inquiries_created_at ON contact_inquiries(created_at);
  `)

  // 3. Seed admin user
  await seedAdminUser()

  // 4. Products table: DO NOT auto-seed demo products!
  // Production products table must only be populated via Admin actions or explicit migrations.
  // An empty products table is valid and will not be repopulated with demo products.

  // 5. Seed initial taxonomy and settings if tables are empty
  await seedInitialTaxonomyAndSettings()
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
        p.leadTime || '2-3 Weeks Delivery & Assembly',
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

export async function seedInitialTaxonomyAndSettings(): Promise<void> {
  // 1. Categories
  const catCountRow = await queryOne<{ count: string | number }>(
    'SELECT COUNT(*) as count FROM categories'
  )
  if (Number(catCountRow?.count || 0) === 0) {
    console.log('[Database] Seeding initial furniture categories...')
    const defaultCategories = [
      {
        id: 'cat-dining',
        slug: 'dining',
        name: 'Dining',
        description: 'Solid wood dining tables crafted for shared meals and celebrations.',
        image: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=1200&q=80',
      },
      {
        id: 'cat-sofas',
        slug: 'sofas',
        name: 'Living',
        description: 'Sofas and seating designed with balance and deep comfort.',
        image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=80',
      },
      {
        id: 'cat-beds',
        slug: 'beds',
        name: 'Bedroom',
        description: 'Minimalist platform beds and nightstands for restful bedrooms.',
        image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
      },
      {
        id: 'cat-storage',
        slug: 'storage',
        name: 'Storage',
        description: 'Credenzas, sideboards, and storage cabinets.',
        image: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=1200&q=80',
      },
    ]

    for (const c of defaultCategories) {
      await execute(
        `INSERT INTO categories (id, slug, name, description, image, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
         ON CONFLICT (id) DO NOTHING`,
        [c.id, c.slug, c.name, c.description, c.image]
      )
    }
  }

  // 2. Rooms
  const roomCountRow = await queryOne<{ count: string | number }>(
    'SELECT COUNT(*) as count FROM rooms'
  )
  if (Number(roomCountRow?.count || 0) === 0) {
    console.log('[Database] Seeding initial rooms...')
    const defaultRooms = [
      {
        id: 'room-dining',
        slug: 'dining-room',
        name: 'Dining',
        tagline: 'Crafted for shared rituals and celebration',
        description: 'Solid timber dining tables and seating.',
        image: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=1600&q=80',
        coming_soon: 0,
      },
      {
        id: 'room-living',
        slug: 'living-room',
        name: 'Living',
        tagline: 'A sanctuary of quiet contemplation',
        description: 'Oak silhouettes, soft bouclé, and inviting seating.',
        image: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1600&q=80',
        coming_soon: 0,
      },
      {
        id: 'room-bedroom',
        slug: 'bedroom',
        name: 'Bedroom',
        tagline: 'Understated serenity and restful proportions',
        description: 'Tactile platform frames and bedside nightstands.',
        image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1600&q=80',
        coming_soon: 0,
      },
    ]

    for (const r of defaultRooms) {
      await execute(
        `INSERT INTO rooms (id, slug, name, tagline, description, image, coming_soon, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
         ON CONFLICT (id) DO NOTHING`,
        [r.id, r.slug, r.name, r.tagline, r.description, r.image, r.coming_soon]
      )
    }
  }

  // 3. Collections
  const colCountRow = await queryOne<{ count: string | number }>(
    'SELECT COUNT(*) as count FROM collections'
  )
  if (Number(colCountRow?.count || 0) === 0) {
    console.log('[Database] Seeding initial collections...')
    const defaultCollections = [
      {
        id: 'col-minimalist',
        slug: 'minimalist-line',
        name: 'Minimalist Line',
        tagline: 'Essentialism reduced to pure geometric grace',
        description: 'Pure form, tactile materiality, and enduring structural integrity.',
        image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1400&q=80',
      },
      {
        id: 'col-architectural',
        slug: 'architectural-series',
        name: 'Architectural Series',
        tagline: 'Bold monoliths and sculptural silhouettes',
        description: 'Designed as functional sculptures with robust proportions and honest joinery.',
        image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=80',
      },
      {
        id: 'col-classics',
        slug: 'considered-classics',
        name: 'Considered Classics',
        tagline: 'Heirloom pieces engineered to age gracefully',
        description: 'Classic craftsmanship utilizing sustainably harvested hardwoods.',
        image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1400&q=80',
      },
    ]

    for (const col of defaultCollections) {
      await execute(
        `INSERT INTO collections (id, slug, name, tagline, description, image, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
         ON CONFLICT (id) DO NOTHING`,
        [col.id, col.slug, col.name, col.tagline, col.description, col.image]
      )
    }
  }

  // 4. Store Settings
  const settingsRow = await queryOne<{ id: string }>(
    "SELECT id FROM store_settings WHERE id = 'default'"
  )
  if (!settingsRow) {
    console.log('[Database] Initializing store settings row...')
    await execute(
      `INSERT INTO store_settings (
        id, store_name, brand_tagline, support_email, support_phone,
        registered_address, gstin, pan, currency,
        assembly_charge, convenience_fee_percent, gst_percent, updated_at
      ) VALUES (
        'default', 'GM Furniture', 'Handcrafted Solid Wood Furniture for Modern Living',
        'support@gmfurniture.in', '+91 (011) 4920-8000',
        'Studio GM, Sector 44, Institutional Area, Gurugram, Haryana 122003, India',
        '36AFNPV7079J1ZG', 'AAACG1234F', 'INR (₹)',
        3000, 0, 18, NOW()
      )`
    )
  }

  // 5. Seed initial coupons if table is empty
  const couponCountRow = await queryOne<{ count: string | number }>(
    'SELECT COUNT(*) as count FROM coupons'
  )
  if (Number(couponCountRow?.count || 0) === 0) {
    console.log('[Database] Seeding initial coupons (WELCOME10, GM5000)...')
    await execute(
      `INSERT INTO coupons (id, code, discount_type, discount_value, is_active, created_at, updated_at)
       VALUES 
       ('cpn_welcome10', 'WELCOME10', 'percent', 10, 1, NOW(), NOW()),
       ('cpn_gm5000', 'GM5000', 'fixed', 5000, 1, NOW(), NOW())
       ON CONFLICT (code) DO NOTHING`
    )
  }
}

