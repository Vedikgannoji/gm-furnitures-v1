import { DatabaseSync } from 'node:sqlite'
import fs from 'node:fs'
import path from 'node:path'
import dotenv from 'dotenv'

dotenv.config()

const dbPath = process.env.DATABASE_PATH || 'server/data/gm_furniture.db'
const resolvedPath = path.resolve(process.cwd(), dbPath)
const dbDir = path.dirname(resolvedPath)

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true })
}

export const db = new DatabaseSync(resolvedPath)

// Initialize PRAGMA
db.exec('PRAGMA foreign_keys = ON;')

// Initialize Schema
export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT,
      provider TEXT NOT NULL DEFAULT 'local',
      provider_id TEXT,
      avatar_url TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      sku TEXT UNIQUE NOT NULL,
      category TEXT NOT NULL,
      collection TEXT,
      room TEXT,
      price INTEGER NOT NULL,
      mrp INTEGER NOT NULL,
      discount INTEGER NOT NULL DEFAULT 0,
      description TEXT NOT NULL,
      short_description TEXT NOT NULL,
      images_json TEXT NOT NULL,
      colors_json TEXT NOT NULL,
      dimensions_json TEXT NOT NULL,
      material TEXT NOT NULL,
      finish TEXT NOT NULL,
      lead_time TEXT NOT NULL,
      warranty TEXT NOT NULL,
      specifications_json TEXT NOT NULL,
      care_instructions_json TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'published',
      featured INTEGER NOT NULL DEFAULT 0,
      new_arrival INTEGER NOT NULL DEFAULT 0,
      rating REAL NOT NULL DEFAULT 5.0,
      review_count INTEGER NOT NULL DEFAULT 0,
      stock INTEGER NOT NULL DEFAULT 10,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS cart_items (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      quantity INTEGER NOT NULL DEFAULT 1,
      selected_color TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(user_id, product_id, selected_color)
    );

    CREATE TABLE IF NOT EXISTS wishlist_items (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL,
      UNIQUE(user_id, product_id)
    );

    CREATE TABLE IF NOT EXISTS addresses (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      full_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      address_line TEXT NOT NULL,
      city TEXT NOT NULL,
      state TEXT NOT NULL,
      pincode TEXT NOT NULL,
      is_default INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      order_number TEXT UNIQUE NOT NULL,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      subtotal INTEGER NOT NULL,
      discount INTEGER NOT NULL DEFAULT 0,
      total INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'confirmed',
      delivery_address_json TEXT NOT NULL,
      items_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `)

  seedProducts()
}

function seedProducts() {
  const countRow = db.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number }
  if (countRow && countRow.count >= 4) {
    return
  }

  // Clear any existing legacy products to ensure only the 4 canonical products exist
  db.exec('DELETE FROM products;')

  const insertProduct = db.prepare(`
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
  `)

  const now = new Date().toISOString()

  // 1. Atelier Solid Walnut Dining Table
  insertProduct.run(
    'gm-prod-04',
    'atelier-solid-walnut-dining-table',
    'Atelier Solid Walnut Dining Table',
    'GM-DIN-004',
    'dining',
    'considered-classics',
    'dining-room',
    195000,
    230000,
    15,
    'An expansive centerpiece benchcrafted from wide-plank American black walnut. The chamfered perimeter and tapered trestle base offer generous legroom for eight to ten guests.',
    'Solid American black walnut 8-seater dining table.',
    JSON.stringify([
      'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1544457070-4cd773b4d71e?auto=format&fit=crop&w=1200&q=80',
    ]),
    JSON.stringify([
      { name: 'Natural American Walnut', hex: '#533B2B' },
      { name: 'Ebonized Dark Walnut', hex: '#222222' },
    ]),
    JSON.stringify({
      width: '240 cm',
      depth: '100 cm',
      height: '75 cm',
      weight: '78 kg',
    }),
    'FSC-Certified American Black Walnut',
    'Natural Matte Hardwax Oil',
    '2-3 Weeks White-Glove Installation',
    '10-Year Framework Structural Warranty',
    JSON.stringify([
      { label: 'Timber Origin', value: 'Sustainably Managed Appalachian Hardwoods' },
      { label: 'Joinery Type', value: 'Mortise & Tenon with Through-Dowels' },
      { label: 'Seating Capacity', value: '8-10 Guests' },
      { label: 'Finish System', value: 'Zero-VOC Food-Safe Plant Wax' },
    ]),
    JSON.stringify([
      'Wipe down with a damp lint-free cotton cloth.',
      'Avoid placing hot pans directly without trivets.',
      'Re-apply natural hardwax oil annually to maintain rich patina.',
    ]),
    'published',
    1, // featured
    0, // newArrival
    4.9,
    18,
    8,
    now,
    now
  )

  // 2. Column Round Carrara Marble Dining Table
  insertProduct.run(
    'gm-prod-14',
    'column-marble-dining-table',
    'Column Round Carrara Marble Dining Table',
    'GM-DIN-014',
    'dining',
    'architectural-series',
    'dining-room',
    188000,
    220000,
    15,
    'A majestic 140cm diameter round dining table highlighting a seamless honed Italian Carrara marble disc anchored atop a monolithic cast architectural ribbed concrete base.',
    '140cm round Carrara marble tabletop on ribbed fluted pedestal.',
    JSON.stringify([
      'https://images.unsplash.com/photo-1544457070-4cd773b4d71e?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=1200&q=80',
    ]),
    JSON.stringify([
      { name: 'White Carrara Marble', hex: '#EDEAE6' },
      { name: 'Arabescato Dark Marble', hex: '#63625F' },
    ]),
    JSON.stringify({
      width: '140 cm',
      depth: '140 cm',
      height: '75 cm',
      weight: '115 kg',
    }),
    'Honed Carrara Marble & Cast Fluted Concrete',
    'Penetrating Matte Nano-Sealant',
    '2-3 Weeks White-Glove Installation',
    '10-Year Framework Structural Warranty',
    JSON.stringify([
      { label: 'Stone Origin', value: 'Carrara Region, Tuscany, Italy' },
      { label: 'Base Construction', value: 'Steel-Reinforced Cast Architectural Concrete' },
      { label: 'Seating Capacity', value: '4-6 Guests' },
      { label: 'Stone Thickness', value: '25mm Solid Honed Slab' },
    ]),
    JSON.stringify([
      'Clean spills immediately to prevent marble etching.',
      'Use pH-neutral stone cleaner only.',
      'Do not use acidic cleaners or abrasive scouring pads.',
    ]),
    'published',
    1, // featured
    1, // newArrival
    5.0,
    14,
    5,
    now,
    now
  )

  // 3. Nordic Atelier Solid White Oak Dining Table
  insertProduct.run(
    'gm-prod-22',
    'nordic-oak-dining-table',
    'Nordic Atelier Solid White Oak Dining Table',
    'GM-DIN-022',
    'dining',
    'nordic-atelier',
    'dining-room',
    172000,
    205000,
    16,
    'Minimalist Nordic dining table sculpted from European white oak with soft radius pillowed edges and concealed mortise-and-tenon structural framing.',
    'Solid European white oak 6-8 seater architectural dining table.',
    JSON.stringify([
      'https://images.unsplash.com/photo-1577140917170-285929fb55b7?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=1200&q=80',
    ]),
    JSON.stringify([
      { name: 'White-Pigmented Oak', hex: '#E2D7C5' },
      { name: 'Smoked Grey Oak', hex: '#686055' },
    ]),
    JSON.stringify({
      width: '210 cm',
      depth: '95 cm',
      height: '75 cm',
      weight: '64 kg',
    }),
    'Solid European White Oak',
    'White-Pigmented Matte Hardwax Oil',
    '2-3 Weeks White-Glove Installation',
    '10-Year Framework Structural Warranty',
    JSON.stringify([
      { label: 'Timber Origin', value: 'FSC-Certified French White Oak' },
      { label: 'Edge Profile', value: 'Soft Bullnose Radius' },
      { label: 'Seating Capacity', value: '6-8 Guests' },
      { label: 'Eco Certification', value: 'FSC 100% Verified Chain of Custody' },
    ]),
    JSON.stringify([
      'Dust with dry microfiber cloth.',
      'Protect surface from prolonged moisture exposure.',
    ]),
    'published',
    1, // featured
    0, // newArrival
    4.9,
    11,
    7,
    now,
    now
  )

  // 4. Monolith Smoked Oak & Travertine Dining Table
  insertProduct.run(
    'gm-prod-23',
    'monolith-travertine-dining-table',
    'Monolith Smoked Oak & Travertine Dining Table',
    'GM-DIN-023',
    'dining',
    'architectural-series',
    'dining-room',
    215000,
    250000,
    14,
    'A commanding monumental dining table featuring an uncurated Roman travertine slab inset into a deep smoked oak perimeter with twin monolithic pillar legs.',
    'Smoked oak and honed Roman travertine stone dining table.',
    JSON.stringify([
      'https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1544457070-4cd773b4d71e?auto=format&fit=crop&w=1200&q=80',
    ]),
    JSON.stringify([
      { name: 'Smoked Oak & Travertine', hex: '#3B332B' },
      { name: 'Bleached Oak & Travertine', hex: '#C7B9A5' },
    ]),
    JSON.stringify({
      width: '260 cm',
      depth: '105 cm',
      height: '76 cm',
      weight: '130 kg',
    }),
    'Smoked European Oak & Italian Roman Travertine',
    'Zero-VOC Natural Matte Finish',
    '3-4 Weeks White-Glove Installation',
    '10-Year Framework Structural Warranty',
    JSON.stringify([
      { label: 'Stone Origin', value: 'Tivoli, Italy' },
      { label: 'Timber Finish', value: 'Fumed Smoked Oak' },
      { label: 'Seating Capacity', value: '10-12 Guests' },
      { label: 'Pedestal Construction', value: 'Dual Hollow-Core Weighted Monoliths' },
    ]),
    JSON.stringify([
      'Wipe down with stone-safe natural cleansers.',
      'Periodically apply breathable stone impregnator.',
    ]),
    'published',
    0, // featured
    1, // newArrival
    5.0,
    9,
    4,
    now,
    now
  )
}
