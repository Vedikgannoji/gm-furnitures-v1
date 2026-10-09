// server/app.ts
import express from "express";
import cors from "cors";
import dotenv4 from "dotenv";
import crypto3 from "node:crypto";

// server/db.ts
import pg from "pg";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import dotenv from "dotenv";
dotenv.config();
var { Pool } = pg;
var pool = null;
function getPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL || "";
    const isLocalhost = connectionString.includes("localhost") || connectionString.includes("127.0.0.1");
    pool = new Pool({
      connectionString: connectionString || void 0,
      ssl: connectionString && !isLocalhost ? { rejectUnauthorized: false } : false,
      max: 10,
      idleTimeoutMillis: 3e4,
      connectionTimeoutMillis: 1e4
    });
    pool.on("error", (err) => {
      console.error("[PostgreSQL Pool Error]", err);
    });
  }
  return pool;
}
var mockQueryHandler = null;
function hasDatabaseUrl() {
  if (mockQueryHandler) return true;
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL || "";
  return connectionString.trim().length > 0;
}
async function testDatabaseConnection() {
  if (mockQueryHandler) {
    return { ok: true };
  }
  if (!hasDatabaseUrl()) {
    return { ok: false, error: "DATABASE_URL is not set" };
  }
  try {
    const p = getPool();
    await p.query("SELECT 1");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err?.message || String(err) };
  }
}
async function query(text, params = []) {
  if (mockQueryHandler) {
    const res = await mockQueryHandler(text, params);
    return Array.isArray(res) ? res : [];
  }
  if (!hasDatabaseUrl()) {
    throw new Error("Database is not configured. DATABASE_URL is missing.");
  }
  const p = getPool();
  const result = await p.query(text, params);
  return result.rows;
}
async function queryOne(text, params = []) {
  const rows = await query(text, params);
  return rows.length > 0 ? rows[0] : null;
}
async function execute(text, params = []) {
  if (mockQueryHandler) {
    const res = await mockQueryHandler(text, params);
    return { rowCount: Array.isArray(res) ? res.length : res ? 1 : 0 };
  }
  if (!hasDatabaseUrl()) {
    throw new Error("Database is not configured. DATABASE_URL is missing.");
  }
  const p = getPool();
  const result = await p.query(text, params);
  return { rowCount: result.rowCount || 0 };
}
var initPromise = null;
function ensureDatabaseInitialized() {
  if (mockQueryHandler) {
    return Promise.resolve();
  }
  if (!initPromise) {
    initPromise = initDatabase().catch((err) => {
      console.error("[Database] Initialization failed:", err);
      initPromise = null;
      throw err;
    });
  }
  return initPromise;
}
async function initDatabase() {
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL;
  if (!connectionString) {
    console.warn("[Database] WARNING: DATABASE_URL is not set. Database initialization skipped.");
    return;
  }
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
      payment_environment VARCHAR(20) NOT NULL DEFAULT 'sandbox',
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
      currency VARCHAR(20) NOT NULL DEFAULT 'INR (\u20B9)',
      assembly_charge INTEGER NOT NULL DEFAULT 3000,
      convenience_fee_percent REAL NOT NULL DEFAULT 0,
      gst_percent REAL NOT NULL DEFAULT 18,
      cashfree_environment VARCHAR(20) NOT NULL DEFAULT 'sandbox',
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
  `);
  const migrations = [
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(50)",
    "ALTER TABLE orders ADD COLUMN IF NOT EXISTS assembly_charge NUMERIC(12, 2) NOT NULL DEFAULT 0",
    "ALTER TABLE orders ADD COLUMN IF NOT EXISTS convenience_fee NUMERIC(12, 2) NOT NULL DEFAULT 0",
    "ALTER TABLE orders ADD COLUMN IF NOT EXISTS convenience_fee_percent REAL NOT NULL DEFAULT 0",
    "ALTER TABLE orders ADD COLUMN IF NOT EXISTS gst NUMERIC(12, 2) NOT NULL DEFAULT 0",
    "ALTER TABLE orders ADD COLUMN IF NOT EXISTS gst_percent REAL NOT NULL DEFAULT 18",
    "ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_order_id VARCHAR(255)",
    "ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_transaction_id VARCHAR(255)",
    "ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_gateway VARCHAR(50) DEFAULT 'cashfree'",
    "ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_session_id VARCHAR(255)",
    "ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_environment VARCHAR(20) NOT NULL DEFAULT 'sandbox'",
    "ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ",
    "ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_code VARCHAR(100)",
    "ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_discount_type VARCHAR(50)",
    "ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_discount_value NUMERIC(12, 2)",
    "ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_discount_amount NUMERIC(12, 2) DEFAULT 0",
    "CREATE INDEX IF NOT EXISTS idx_orders_payment_order_id ON orders(payment_order_id)",
    "CREATE INDEX IF NOT EXISTS idx_orders_payment_environment ON orders(payment_environment)",
    "ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS cashfree_environment VARCHAR(20) NOT NULL DEFAULT 'sandbox'",
    "ALTER TABLE order_items ADD COLUMN IF NOT EXISTS product_slug VARCHAR(255)",
    "ALTER TABLE order_items ADD COLUMN IF NOT EXISTS product_image TEXT",
    "ALTER TABLE order_items ADD COLUMN IF NOT EXISTS material VARCHAR(255)",
    "ALTER TABLE order_items ADD COLUMN IF NOT EXISTS finish VARCHAR(255)"
  ];
  for (const sql of migrations) {
    try {
      await query(sql);
    } catch (err) {
      console.warn(`[Database Migration Note] ${sql}:`, err.message);
    }
  }
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
  `);
  await seedAdminUser();
  await seedInitialTaxonomyAndSettings();
}
async function seedAdminUser() {
  const adminEmail = (process.env.ADMIN_EMAIL || "vedikgannoji5126@gmail.com").trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || "Vedik@2006";
  const hash = bcrypt.hashSync(adminPassword, 10);
  const now = /* @__PURE__ */ new Date();
  const existing = await queryOne(
    "SELECT id, email, role FROM users WHERE email = $1",
    [adminEmail]
  );
  if (!existing) {
    const adminId = `usr_admin_${crypto.randomUUID()}`;
    await execute(
      `INSERT INTO users (id, name, email, password_hash, provider, role, created_at, updated_at)
       VALUES ($1, $2, $3, $4, 'local', 'admin', $5, $6)`,
      [adminId, "Administrator", adminEmail, hash, now, now]
    );
    console.log(`[Database] Initialized designated admin user: ${adminEmail}`);
  } else {
    await execute(
      `UPDATE users
       SET role = 'admin', password_hash = $1, updated_at = $2
       WHERE email = $3`,
      [hash, now, adminEmail]
    );
    console.log(`[Database] Ensured admin privileges for: ${adminEmail}`);
  }
}
async function seedInitialTaxonomyAndSettings() {
  const catCountRow = await queryOne(
    "SELECT COUNT(*) as count FROM categories"
  );
  if (Number(catCountRow?.count || 0) === 0) {
    console.log("[Database] Seeding initial furniture categories...");
    const defaultCategories = [
      {
        id: "cat-dining",
        slug: "dining",
        name: "Dining",
        description: "Solid wood dining tables crafted for shared meals and celebrations.",
        image: "https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=1200&q=80"
      },
      {
        id: "cat-sofas",
        slug: "sofas",
        name: "Living",
        description: "Sofas and seating designed with balance and deep comfort.",
        image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=80"
      },
      {
        id: "cat-beds",
        slug: "beds",
        name: "Bedroom",
        description: "Minimalist platform beds and nightstands for restful bedrooms.",
        image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80"
      },
      {
        id: "cat-storage",
        slug: "storage",
        name: "Storage",
        description: "Credenzas, sideboards, and storage cabinets.",
        image: "https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=1200&q=80"
      }
    ];
    for (const c of defaultCategories) {
      await execute(
        `INSERT INTO categories (id, slug, name, description, image, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
         ON CONFLICT (id) DO NOTHING`,
        [c.id, c.slug, c.name, c.description, c.image]
      );
    }
  }
  const roomCountRow = await queryOne(
    "SELECT COUNT(*) as count FROM rooms"
  );
  if (Number(roomCountRow?.count || 0) === 0) {
    console.log("[Database] Seeding initial rooms...");
    const defaultRooms = [
      {
        id: "room-dining",
        slug: "dining-room",
        name: "Dining",
        tagline: "Crafted for shared rituals and celebration",
        description: "Solid timber dining tables and seating.",
        image: "https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=1600&q=80",
        coming_soon: 0
      },
      {
        id: "room-living",
        slug: "living-room",
        name: "Living",
        tagline: "A sanctuary of quiet contemplation",
        description: "Oak silhouettes, soft boucl\xE9, and inviting seating.",
        image: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1600&q=80",
        coming_soon: 0
      },
      {
        id: "room-bedroom",
        slug: "bedroom",
        name: "Bedroom",
        tagline: "Understated serenity and restful proportions",
        description: "Tactile platform frames and bedside nightstands.",
        image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1600&q=80",
        coming_soon: 0
      }
    ];
    for (const r of defaultRooms) {
      await execute(
        `INSERT INTO rooms (id, slug, name, tagline, description, image, coming_soon, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
         ON CONFLICT (id) DO NOTHING`,
        [r.id, r.slug, r.name, r.tagline, r.description, r.image, r.coming_soon]
      );
    }
  }
  const colCountRow = await queryOne(
    "SELECT COUNT(*) as count FROM collections"
  );
  if (Number(colCountRow?.count || 0) === 0) {
    console.log("[Database] Seeding initial collections...");
    const defaultCollections = [
      {
        id: "col-minimalist",
        slug: "minimalist-line",
        name: "Minimalist Line",
        tagline: "Essentialism reduced to pure geometric grace",
        description: "Pure form, tactile materiality, and enduring structural integrity.",
        image: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1400&q=80"
      },
      {
        id: "col-architectural",
        slug: "architectural-series",
        name: "Architectural Series",
        tagline: "Bold monoliths and sculptural silhouettes",
        description: "Designed as functional sculptures with robust proportions and honest joinery.",
        image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=80"
      },
      {
        id: "col-classics",
        slug: "considered-classics",
        name: "Considered Classics",
        tagline: "Heirloom pieces engineered to age gracefully",
        description: "Classic craftsmanship utilizing sustainably harvested hardwoods.",
        image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1400&q=80"
      }
    ];
    for (const col of defaultCollections) {
      await execute(
        `INSERT INTO collections (id, slug, name, tagline, description, image, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
         ON CONFLICT (id) DO NOTHING`,
        [col.id, col.slug, col.name, col.tagline, col.description, col.image]
      );
    }
  }
  const settingsRow = await queryOne(
    "SELECT id FROM store_settings WHERE id = 'default'"
  );
  if (!settingsRow) {
    console.log("[Database] Initializing store settings row...");
    await execute(
      `INSERT INTO store_settings (
        id, store_name, brand_tagline, support_email, support_phone,
        registered_address, gstin, pan, currency,
        assembly_charge, convenience_fee_percent, gst_percent, cashfree_environment, updated_at
      ) VALUES (
        'default', 'GM Furniture', 'Handcrafted Solid Wood Furniture for Modern Living',
        'support@gmfurniture.in', '+91 (011) 4920-8000',
        'Studio GM, Sector 44, Institutional Area, Gurugram, Haryana 122003, India',
        '36AFNPV7079J1ZG', 'AAACG1234F', 'INR (\u20B9)',
        3000, 0, 18, 'sandbox', NOW()
      )`
    );
  }
  const couponCountRow = await queryOne(
    "SELECT COUNT(*) as count FROM coupons"
  );
  if (Number(couponCountRow?.count || 0) === 0) {
    console.log("[Database] Seeding initial coupons (WELCOME10, GM5000)...");
    await execute(
      `INSERT INTO coupons (id, code, discount_type, discount_value, is_active, created_at, updated_at)
       VALUES 
       ('cpn_welcome10', 'WELCOME10', 'percent', 10, 1, NOW(), NOW()),
       ('cpn_gm5000', 'GM5000', 'fixed', 5000, 1, NOW(), NOW())
       ON CONFLICT (code) DO NOTHING`
    );
  }
}

// server/auth.ts
import jwt from "jsonwebtoken";
import bcrypt2 from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import dotenv2 from "dotenv";
dotenv2.config();
var JWT_SECRET = process.env.JWT_SECRET || "gm_atelier_fallback_jwt_secret_dev";
var JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
var GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || "";
var googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);
function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      provider: user.provider,
      role: user.role || "customer"
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}
function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch {
    return null;
  }
}
async function hashPassword(password) {
  const salt = await bcrypt2.genSalt(10);
  return bcrypt2.hash(password, salt);
}
async function comparePassword(password, hash) {
  return bcrypt2.compare(password, hash);
}
async function verifyGoogleToken(credential) {
  if (!GOOGLE_CLIENT_ID) {
    throw new Error("GOOGLE_CLIENT_ID is not configured in the server environment.");
  }
  const ticket = await googleClient.verifyIdToken({
    idToken: credential,
    audience: GOOGLE_CLIENT_ID
  });
  const payload = ticket.getPayload();
  if (!payload || !payload.email) {
    throw new Error("Invalid Google credential payload");
  }
  return {
    email: payload.email,
    name: payload.name || payload.email.split("@")[0],
    sub: payload.sub,
    picture: payload.picture
  };
}
async function verifyAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "Authentication required. Please sign in." });
      return;
    }
    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);
    if (!decoded) {
      res.status(401).json({ error: "Session expired or invalid. Please sign in again." });
      return;
    }
    const user = await queryOne(
      "SELECT id, name, email, provider, role, avatar_url FROM users WHERE id = $1",
      [decoded.id]
    );
    if (!user) {
      res.status(401).json({ error: "User account no longer exists." });
      return;
    }
    req.user = user;
    next();
  } catch (err) {
    console.error("verifyAuth middleware error:", err);
    res.status(500).json({ error: "Authentication check failed." });
  }
}
async function verifyAdmin(req, res, next) {
  await verifyAuth(req, res, () => {
    if (req.user?.role !== "admin") {
      res.status(403).json({ error: "Access denied: Admin privileges required." });
      return;
    }
    next();
  });
}

// server/cashfree.ts
import crypto2 from "node:crypto";
import dotenv3 from "dotenv";
dotenv3.config();
var CASHFREE_SANDBOX_BASE_URL = "https://sandbox.cashfree.com/pg";
var CASHFREE_PRODUCTION_BASE_URL = "https://api.cashfree.com/pg";
var CASHFREE_API_VERSION = "2023-08-01";
function isTestCredential(id) {
  if (!id) return false;
  const trimmed = id.trim();
  return trimmed.startsWith("TEST") || trimmed.toLowerCase().startsWith("test_") || trimmed.toLowerCase().includes("_test_");
}
function isTestSecret(secret) {
  if (!secret) return false;
  const trimmed = secret.trim();
  return trimmed.startsWith("cfsk_ma_test_") || trimmed.toLowerCase().includes("_test_");
}
function sanitizeEnvironment(raw) {
  const normalized = (raw || "").trim().toLowerCase();
  if (normalized === "production") {
    return "production";
  }
  return "sandbox";
}
function getCashfreeCredentialsForEnv(env) {
  if (env === "production") {
    const dedicatedId2 = (process.env.CASHFREE_PRODUCTION_CLIENT_ID || process.env.CASHFREE_PROD_CLIENT_ID || "").trim();
    const dedicatedSecret2 = (process.env.CASHFREE_PRODUCTION_CLIENT_SECRET || process.env.CASHFREE_PROD_CLIENT_SECRET || "").trim();
    const generalId2 = (process.env.CASHFREE_CLIENT_ID || "").trim();
    const generalSecret2 = (process.env.CASHFREE_CLIENT_SECRET || "").trim();
    const globalEnv2 = (process.env.CASHFREE_ENVIRONMENT || "").trim().toLowerCase();
    let clientId2 = dedicatedId2;
    let clientSecret2 = dedicatedSecret2;
    if (!clientId2 && globalEnv2 === "production" && !isTestCredential(generalId2)) {
      clientId2 = generalId2;
    }
    if (!clientSecret2 && globalEnv2 === "production" && !isTestSecret(generalSecret2)) {
      clientSecret2 = generalSecret2;
    }
    if (isTestCredential(clientId2) || isTestSecret(clientSecret2)) {
      return {
        clientId: "",
        clientSecret: "",
        isConfigured: false
      };
    }
    const isConfigured2 = Boolean(clientId2 && clientSecret2);
    return { clientId: clientId2, clientSecret: clientSecret2, isConfigured: isConfigured2 };
  }
  const dedicatedId = (process.env.CASHFREE_SANDBOX_CLIENT_ID || "").trim();
  const dedicatedSecret = (process.env.CASHFREE_SANDBOX_CLIENT_SECRET || "").trim();
  const generalId = (process.env.CASHFREE_CLIENT_ID || "").trim();
  const generalSecret = (process.env.CASHFREE_CLIENT_SECRET || "").trim();
  const globalEnv = (process.env.CASHFREE_ENVIRONMENT || "").trim().toLowerCase();
  let clientId = dedicatedId;
  let clientSecret = dedicatedSecret;
  if (!clientId) {
    if (isTestCredential(generalId) || globalEnv !== "production") {
      clientId = generalId;
    }
  }
  if (!clientSecret) {
    if (isTestSecret(generalSecret) || globalEnv !== "production") {
      clientSecret = generalSecret;
    }
  }
  const isConfigured = Boolean(clientId && clientSecret);
  return { clientId, clientSecret, isConfigured };
}
function getCashfreeConfigForEnv(env) {
  const isProduction = env === "production";
  const baseUrl = isProduction ? CASHFREE_PRODUCTION_BASE_URL : CASHFREE_SANDBOX_BASE_URL;
  const ordersUrl = `${baseUrl}/orders`;
  const { clientId, clientSecret, isConfigured } = getCashfreeCredentialsForEnv(env);
  return {
    env,
    isProduction,
    baseUrl,
    ordersUrl,
    clientId,
    clientSecret,
    apiVersion: CASHFREE_API_VERSION,
    isConfigured
  };
}
function getCashfreeStatusReport(activeEnv) {
  const sandboxCreds = getCashfreeCredentialsForEnv("sandbox");
  const prodCreds = getCashfreeCredentialsForEnv("production");
  const switchPasswordConfigured = Boolean(
    (process.env.CASHFREE_ENV_SWITCH_PASSWORD || "").trim()
  );
  return {
    currentEnvironment: activeEnv,
    sandboxConfigured: sandboxCreds.isConfigured,
    productionConfigured: prodCreds.isConfigured,
    switchPasswordConfigured
  };
}
function verifyCashfreeWebhookSignature(rawBody, signature, timestamp, clientSecret) {
  if (!signature || !timestamp || !clientSecret) {
    return false;
  }
  try {
    const generated = crypto2.createHmac("sha256", clientSecret).update(timestamp + rawBody).digest("base64");
    const sigBuf = Buffer.from(signature);
    const genBuf = Buffer.from(generated);
    if (sigBuf.length !== genBuf.length) {
      return false;
    }
    return crypto2.timingSafeEqual(sigBuf, genBuf);
  } catch {
    return false;
  }
}
var rateLimitMap = /* @__PURE__ */ new Map();
var MAX_FAILED_ATTEMPTS = 5;
var LOCKOUT_DURATION_MS = 15 * 60 * 1e3;
function checkRateLimit(key) {
  const now = Date.now();
  const record = rateLimitMap.get(key);
  if (!record) {
    return { allowed: true };
  }
  if (record.lockedUntil > now) {
    return {
      allowed: false,
      remainingWaitMs: record.lockedUntil - now
    };
  }
  if (record.lockedUntil > 0 && record.lockedUntil <= now) {
    rateLimitMap.delete(key);
    return { allowed: true };
  }
  return { allowed: true };
}
function recordFailedPasswordAttempt(key) {
  const now = Date.now();
  const record = rateLimitMap.get(key) || { failedAttempts: 0, lockedUntil: 0 };
  record.failedAttempts += 1;
  if (record.failedAttempts >= MAX_FAILED_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_DURATION_MS;
  }
  rateLimitMap.set(key, record);
}
function resetPasswordRateLimit(key) {
  rateLimitMap.delete(key);
}
function verifyEnvSwitchPassword(candidatePassword, rateLimitKey) {
  const rateLimit = checkRateLimit(rateLimitKey);
  if (!rateLimit.allowed) {
    const minutesLeft = Math.ceil((rateLimit.remainingWaitMs || 0) / 6e4);
    return {
      valid: false,
      error: `Too many failed password attempts. Please wait ${minutesLeft} minute(s) before trying again.`,
      status: 429
    };
  }
  const expectedPassword = (process.env.CASHFREE_ENV_SWITCH_PASSWORD || "").trim();
  if (!expectedPassword) {
    return {
      valid: false,
      error: "CASHFREE_ENV_SWITCH_PASSWORD is not configured in the server environment. Please configure CASHFREE_ENV_SWITCH_PASSWORD=CASHFREE before switching environments.",
      status: 500
    };
  }
  if (typeof candidatePassword !== "string" || !candidatePassword) {
    recordFailedPasswordAttempt(rateLimitKey);
    return {
      valid: false,
      error: "Incorrect password. Environment unchanged.",
      status: 401
    };
  }
  const candidateBuf = Buffer.from(candidatePassword.trim());
  const expectedBuf = Buffer.from(expectedPassword);
  const isMatch = candidateBuf.length === expectedBuf.length && crypto2.timingSafeEqual(candidateBuf, expectedBuf);
  if (!isMatch) {
    recordFailedPasswordAttempt(rateLimitKey);
    return {
      valid: false,
      error: "Incorrect password. Environment unchanged.",
      status: 401
    };
  }
  resetPasswordRateLimit(rateLimitKey);
  return { valid: true, status: 200 };
}

// server/app.ts
dotenv4.config();
var app = express();
app.set("trust proxy", true);
async function getActiveCashfreeEnvironment() {
  try {
    if (hasDatabaseUrl()) {
      const row = await queryOne(
        "SELECT cashfree_environment FROM store_settings WHERE id = $1",
        ["default"]
      );
      if (row?.cashfree_environment) {
        return sanitizeEnvironment(row.cashfree_environment);
      }
    }
  } catch {
  }
  return sanitizeEnvironment(process.env.CASHFREE_ENVIRONMENT);
}
function getPublicAppUrl(req) {
  const isVercel = process.env.VERCEL === "1" || Boolean(process.env.VERCEL_ENV) || Boolean(process.env.VERCEL_URL);
  const isProd = process.env.NODE_ENV === "production" || isVercel;
  const configured = (process.env.APP_URL || "").trim().replace(/\/$/, "");
  if (req) {
    try {
      const rawOrigin = req.headers.origin || (typeof req.headers.referer === "string" ? new URL(req.headers.referer).origin : "");
      const origin = String(rawOrigin || "").trim().replace(/\/$/, "");
      if (origin) {
        if (isProd && !origin.includes("localhost") && !origin.includes("127.0.0.1")) {
          return origin;
        }
        if (!isProd) {
          return origin;
        }
      }
    } catch {
    }
  }
  if (isProd) {
    if (!configured || configured.includes("localhost") || configured.includes("127.0.0.1")) {
      return "https://gmfurniture.in";
    }
    return configured;
  }
  return configured || "http://localhost:5173";
}
var allowedOrigins = [
  getPublicAppUrl(),
  "https://gmfurniture.in",
  "https://www.gmfurniture.in",
  "https://gmfurniture.vercel.app",
  "https://gm-furnitures.vercel.app",
  "http://localhost:5173",
  "http://localhost:4173",
  "http://localhost:3000",
  "http://localhost:3001"
];
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.some((o) => origin.startsWith(o))) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true
  })
);
app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf.toString();
    }
  })
);
app.use((req, _res, next) => {
  const originalPath = req.headers["x-matched-path"] || req.headers["x-forwarded-uri"];
  if (originalPath && originalPath.startsWith("/api") && (req.url === "/api" || req.url === "/api/" || req.url.startsWith("/api/index"))) {
    req.url = originalPath;
  } else if (!req.url.startsWith("/api")) {
    req.url = "/api" + (req.url.startsWith("/") ? req.url : "/" + req.url);
  }
  next();
});
app.use("/api", (_req, res, next) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  next();
});
function safeParseJson(value, fallback) {
  if (value === null || value === void 0) return fallback;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}
function formatProductRow(row) {
  if (!row) return null;
  const parsedImages = safeParseJson(row.images_json, []);
  const parsedColors = safeParseJson(row.colors_json, []);
  const parsedDimensions = safeParseJson(row.dimensions_json, {});
  const parsedSpecifications = safeParseJson(row.specifications_json, []);
  const parsedCareInstructions = safeParseJson(row.care_instructions_json, []);
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    sku: row.sku || "",
    category: row.category || "",
    collection: row.collection || "",
    room: row.room || "",
    price: Number(row.price || 0),
    mrp: Number(row.mrp || 0),
    discount: Number(row.discount || 0),
    description: row.description || "",
    shortDescription: row.short_description || "",
    images: Array.isArray(parsedImages) ? parsedImages : [],
    colors: Array.isArray(parsedColors) ? parsedColors : [],
    dimensions: parsedDimensions && typeof parsedDimensions === "object" ? parsedDimensions : {},
    material: row.material || "",
    finish: row.finish || "",
    leadTime: row.lead_time || "",
    warranty: row.warranty || "",
    specifications: Array.isArray(parsedSpecifications) ? parsedSpecifications : [],
    careInstructions: Array.isArray(parsedCareInstructions) ? parsedCareInstructions : [],
    status: row.status || "published",
    featured: Boolean(row.featured),
    newArrival: Boolean(row.new_arrival),
    rating: Number(row.rating || 5),
    reviewCount: Number(row.review_count || 0),
    stock: Number(row.stock || 0),
    stockStatus: Number(row.stock || 0) === 0 ? "out_of_stock" : Number(row.stock || 0) <= 3 ? "low_stock" : "in_stock",
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
app.get("/api", (_req, res) => {
  res.json({
    status: "ok",
    service: "GM Furniture API",
    endpoints: {
      health: "/api/health",
      products: "/api/products",
      login: "/api/auth/login",
      register: "/api/auth/register"
    }
  });
});
app.get("/api/health", async (_req, res) => {
  const dbTest = await testDatabaseConnection();
  const activeEnv = await getActiveCashfreeEnvironment();
  const cf = getCashfreeConfigForEnv(activeEnv);
  const cfStatus = getCashfreeStatusReport(activeEnv);
  const publicAppUrl = getPublicAppUrl();
  res.json({
    status: dbTest.ok ? "ok" : "degraded",
    environment: process.env.NODE_ENV || "production",
    isVercel: process.env.VERCEL === "1" || Boolean(process.env.VERCEL_ENV),
    vercelEnv: process.env.VERCEL_ENV || null,
    appUrl: {
      configured: Boolean(process.env.APP_URL),
      configuredValue: process.env.APP_URL || null,
      resolvedValue: publicAppUrl,
      sampleReturnUrl: `${publicAppUrl}/checkout/payment-return?order_id={order_id}`
    },
    cashfree: {
      environment: activeEnv,
      configured: cf.isConfigured,
      sandboxConfigured: cfStatus.sandboxConfigured,
      productionConfigured: cfStatus.productionConfigured,
      switchPasswordConfigured: cfStatus.switchPasswordConfigured
    },
    database: {
      configured: hasDatabaseUrl(),
      connected: dbTest.ok,
      error: dbTest.error || null
    },
    env: {
      DATABASE_URL: hasDatabaseUrl(),
      JWT_SECRET: Boolean(process.env.JWT_SECRET),
      GOOGLE_CLIENT_ID: Boolean(process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID),
      GOOGLE_CLIENT_SECRET: Boolean(process.env.GOOGLE_CLIENT_SECRET),
      ADMIN_EMAIL: Boolean(process.env.ADMIN_EMAIL)
    },
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
});
app.use(async (_req, res, next) => {
  if (!hasDatabaseUrl()) {
    res.status(503).json({
      error: "Database not configured. Please set DATABASE_URL (Neon PostgreSQL) in your Vercel project environment variables."
    });
    return;
  }
  try {
    await ensureDatabaseInitialized();
    next();
  } catch (err) {
    console.error("[Database Middleware Error]", err);
    res.status(500).json({
      error: "Database connection failed. Please verify Neon PostgreSQL connection string."
    });
  }
});
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      res.status(400).json({ error: "Please provide full name, email, and password." });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ error: "Password must be at least 6 characters." });
      return;
    }
    const normalizedEmail = email.trim().toLowerCase();
    const existing = await queryOne(
      "SELECT id FROM users WHERE email = $1",
      [normalizedEmail]
    );
    if (existing) {
      res.status(400).json({ error: "An account with this email already exists." });
      return;
    }
    const passwordHash = await hashPassword(password);
    const userId = `usr_${crypto3.randomUUID()}`;
    const now = /* @__PURE__ */ new Date();
    await execute(
      `INSERT INTO users (id, name, email, password_hash, provider, role, created_at, updated_at)
       VALUES ($1, $2, $3, $4, 'local', 'customer', $5, $6)`,
      [userId, name.trim(), normalizedEmail, passwordHash, now, now]
    );
    const user = {
      id: userId,
      name: name.trim(),
      email: normalizedEmail,
      provider: "local",
      role: "customer"
    };
    const token = signToken(user);
    res.status(201).json({
      user,
      token,
      message: "Account created successfully."
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Failed to create account. Please try again." });
  }
});
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required." });
      return;
    }
    const normalizedEmail = email.trim().toLowerCase();
    const userRow = await queryOne(
      "SELECT id, name, email, password_hash, provider, role, avatar_url FROM users WHERE email = $1",
      [normalizedEmail]
    );
    if (!userRow || !userRow.password_hash) {
      res.status(401).json({ error: "Invalid email or password." });
      return;
    }
    const isMatch = await comparePassword(password, userRow.password_hash);
    if (!isMatch) {
      res.status(401).json({ error: "Invalid email or password." });
      return;
    }
    const user = {
      id: userRow.id,
      name: userRow.name,
      email: userRow.email,
      provider: userRow.provider,
      role: userRow.role || "customer",
      avatar_url: userRow.avatar_url
    };
    const token = signToken(user);
    res.json({
      user,
      token,
      message: "Signed in successfully."
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Authentication failed. Please try again." });
  }
});
app.post("/api/auth/google", async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      res.status(400).json({ error: "Google credential token is required." });
      return;
    }
    const googlePayload = await verifyGoogleToken(credential);
    const normalizedEmail = googlePayload.email.trim().toLowerCase();
    const now = /* @__PURE__ */ new Date();
    let userRow = await queryOne(
      "SELECT id, name, email, provider, role, avatar_url FROM users WHERE email = $1",
      [normalizedEmail]
    );
    if (!userRow) {
      const userId = `usr_${crypto3.randomUUID()}`;
      await execute(
        `INSERT INTO users (id, name, email, provider, provider_id, role, avatar_url, created_at, updated_at)
         VALUES ($1, $2, $3, 'google', $4, 'customer', $5, $6, $7)`,
        [userId, googlePayload.name, normalizedEmail, googlePayload.sub, googlePayload.picture || null, now, now]
      );
      userRow = {
        id: userId,
        name: googlePayload.name,
        email: normalizedEmail,
        provider: "google",
        role: "customer",
        avatar_url: googlePayload.picture
      };
    } else {
      await execute(
        `UPDATE users
         SET provider_id = COALESCE(provider_id, $1),
             avatar_url = COALESCE($2, avatar_url),
             updated_at = $3
         WHERE id = $4`,
        [googlePayload.sub, googlePayload.picture || null, now, userRow.id]
      );
    }
    const user = {
      id: userRow.id,
      name: userRow.name,
      email: userRow.email,
      provider: userRow.provider,
      role: userRow.role || "customer",
      avatar_url: userRow.avatar_url
    };
    const token = signToken(user);
    res.json({
      user,
      token,
      message: "Google authentication successful."
    });
  } catch (error) {
    console.error("Google auth error:", error);
    res.status(400).json({ error: error.message || "Google authentication failed." });
  }
});
app.get("/api/auth/me", verifyAuth, (req, res) => {
  res.json({ user: req.user });
});
app.get("/api/products", async (req, res) => {
  try {
    const { featured, newArrival, category, room, collection } = req.query;
    let sql = "SELECT * FROM products WHERE (status = 'published' OR status = 'active')";
    const params = [];
    let pIdx = 1;
    if (featured === "true" || featured === "1") {
      sql += ` AND featured = 1`;
    }
    if (newArrival === "true" || newArrival === "1") {
      sql += ` AND new_arrival = 1`;
    }
    if (category && typeof category === "string" && category.trim()) {
      sql += ` AND (LOWER(category) = LOWER($${pIdx}) OR LOWER(category) = LOWER(REPLACE($${pIdx}, '-', ' ')))`;
      params.push(category.trim());
      pIdx++;
    }
    if (room && typeof room === "string" && room.trim()) {
      sql += ` AND (LOWER(room) = LOWER($${pIdx}) OR LOWER(room) = LOWER(REPLACE($${pIdx}, '-', ' ')))`;
      params.push(room.trim());
      pIdx++;
    }
    if (collection && typeof collection === "string" && collection.trim()) {
      sql += ` AND (LOWER(collection) = LOWER($${pIdx}) OR LOWER(collection) = LOWER(REPLACE($${pIdx}, '-', ' ')))`;
      params.push(collection.trim());
      pIdx++;
    }
    sql += " ORDER BY created_at ASC";
    const rows = await query(sql, params);
    const products = rows.map(formatProductRow);
    res.json(products);
  } catch (error) {
    console.error("Fetch products error:", error);
    res.status(500).json({ error: "Failed to fetch products." });
  }
});
app.get("/api/products/:slugOrId", async (req, res) => {
  try {
    const slugOrId = String(req.params.slugOrId).trim();
    const row = await queryOne(
      "SELECT * FROM products WHERE (LOWER(slug) = LOWER($1) OR id = $2) AND (status = 'published' OR status = 'active')",
      [slugOrId, slugOrId]
    );
    if (!row) {
      res.status(404).json({ error: "Product not found." });
      return;
    }
    res.json(formatProductRow(row));
  } catch (error) {
    console.error("Fetch product detail error:", error);
    res.status(500).json({ error: "Failed to fetch product." });
  }
});
app.get("/api/settings", async (_req, res) => {
  try {
    const row = await queryOne("SELECT * FROM store_settings WHERE id = $1", ["default"]);
    if (!row) {
      res.json({
        storeName: "GM Furniture",
        brandTagline: "Handcrafted Solid Wood Furniture for Modern Living",
        supportEmail: "support@gmfurniture.in",
        supportPhone: "+91 (011) 4920-8000",
        registeredAddress: "Studio GM, Sector 44, Institutional Area, Gurugram, Haryana 122003, India",
        gstin: "36AFNPV7079J1ZG",
        pan: "AAACG1234F",
        currency: "INR (\u20B9)",
        assemblyCharge: 3e3,
        convenienceFeePercent: 0,
        gstPercent: 18,
        cashfreeEnvironment: "sandbox"
      });
      return;
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
      assemblyCharge: Number(row.assembly_charge !== void 0 ? row.assembly_charge : 3e3),
      convenienceFeePercent: Number(row.convenience_fee_percent !== void 0 ? row.convenience_fee_percent : 0),
      gstPercent: Number(row.gst_percent !== void 0 ? row.gst_percent : 18),
      cashfreeEnvironment: row.cashfree_environment || "sandbox"
    });
  } catch (error) {
    console.error("Fetch settings error:", error);
    res.status(500).json({ error: "Failed to fetch store settings." });
  }
});
app.get("/api/categories", async (_req, res) => {
  try {
    const rows = await query(`
      SELECT 
        c.id, c.slug, c.name, c.description, c.image,
        COALESCE((SELECT COUNT(*) FROM products p WHERE (LOWER(p.category) = LOWER(c.slug) OR LOWER(p.category) = LOWER(c.name)) AND (p.status = 'published' OR p.status = 'active')), 0) as item_count
      FROM categories c
      ORDER BY c.created_at ASC
    `);
    res.json(rows.map((r) => ({
      id: r.id,
      slug: r.slug,
      name: r.name,
      description: r.description,
      image: r.image,
      itemCount: Number(r.item_count || 0)
    })));
  } catch (error) {
    console.error("Fetch categories error:", error);
    res.status(500).json({ error: "Failed to fetch categories." });
  }
});
app.get("/api/rooms", async (_req, res) => {
  try {
    const rows = await query(`
      SELECT 
        r.id, r.slug, r.name, r.tagline, r.description, r.image, r.coming_soon,
        COALESCE((SELECT COUNT(*) FROM products p WHERE (LOWER(p.room) = LOWER(r.slug) OR LOWER(p.room) = LOWER(r.name)) AND (p.status = 'published' OR p.status = 'active')), 0) as product_count
      FROM rooms r
      ORDER BY r.created_at ASC
    `);
    res.json(rows.map((r) => ({
      id: r.id,
      slug: r.slug,
      name: r.name,
      tagline: r.tagline,
      description: r.description,
      image: r.image,
      comingSoon: Boolean(r.coming_soon),
      productCount: Number(r.product_count || 0)
    })));
  } catch (error) {
    console.error("Fetch rooms error:", error);
    res.status(500).json({ error: "Failed to fetch rooms." });
  }
});
app.get("/api/rooms/:slugOrId", async (req, res) => {
  try {
    const slugOrId = String(req.params.slugOrId).trim();
    const room = await queryOne("SELECT * FROM rooms WHERE LOWER(slug) = LOWER($1) OR id = $2", [slugOrId, slugOrId]);
    if (!room) {
      res.status(404).json({ error: "Room not found." });
      return;
    }
    const prods = await query(
      "SELECT * FROM products WHERE (LOWER(room) = LOWER($1) OR LOWER(room) = LOWER($2) OR LOWER(room) = LOWER(REPLACE($1, '-', ' '))) AND (status = 'published' OR status = 'active') ORDER BY created_at ASC",
      [room.slug, room.name]
    );
    res.json({
      room: {
        id: room.id,
        slug: room.slug,
        name: room.name,
        tagline: room.tagline,
        description: room.description,
        image: room.image,
        comingSoon: Boolean(room.coming_soon),
        productCount: prods.length
      },
      products: prods.map(formatProductRow)
    });
  } catch (error) {
    console.error("Fetch room detail error:", error);
    res.status(500).json({ error: "Failed to fetch room detail." });
  }
});
app.get("/api/collections", async (_req, res) => {
  try {
    const rows = await query(`
      SELECT 
        c.id, c.slug, c.name, c.tagline, c.description, c.image,
        COALESCE((SELECT COUNT(*) FROM products p WHERE (LOWER(p.collection) = LOWER(c.slug) OR LOWER(p.collection) = LOWER(c.name)) AND (p.status = 'published' OR p.status = 'active')), 0) as product_count
      FROM collections c
      ORDER BY c.created_at ASC
    `);
    res.json(rows.map((r) => ({
      id: r.id,
      slug: r.slug,
      name: r.name,
      tagline: r.tagline,
      description: r.description,
      image: r.image,
      productCount: Number(r.product_count || 0)
    })));
  } catch (error) {
    console.error("Fetch collections error:", error);
    res.status(500).json({ error: "Failed to fetch collections." });
  }
});
app.get("/api/collections/:slugOrId", async (req, res) => {
  try {
    const slugOrId = String(req.params.slugOrId).trim();
    const col = await queryOne("SELECT * FROM collections WHERE LOWER(slug) = LOWER($1) OR id = $2", [slugOrId, slugOrId]);
    if (!col) {
      res.status(404).json({ error: "Collection not found." });
      return;
    }
    const prods = await query(
      "SELECT * FROM products WHERE (LOWER(collection) = LOWER($1) OR LOWER(collection) = LOWER($2) OR LOWER(collection) = LOWER(REPLACE($1, '-', ' '))) AND (status = 'published' OR status = 'active') ORDER BY created_at ASC",
      [col.slug, col.name]
    );
    res.json({
      collection: {
        id: col.id,
        slug: col.slug,
        name: col.name,
        tagline: col.tagline,
        description: col.description,
        image: col.image,
        productCount: prods.length
      },
      products: prods.map(formatProductRow)
    });
  } catch (error) {
    console.error("Fetch collection detail error:", error);
    res.status(500).json({ error: "Failed to fetch collection detail." });
  }
});
app.get("/api/cart", verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
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
    );
    const items = rows.map((r) => ({
      id: r.cart_item_id,
      product: formatProductRow(r),
      quantity: Number(r.quantity),
      selectedColor: r.selected_color
    }));
    res.json(items);
  } catch (error) {
    console.error("Fetch cart error:", error);
    res.status(500).json({ error: "Failed to fetch cart." });
  }
});
app.post("/api/cart", verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, quantity = 1, selectedColor = "Standard" } = req.body;
    if (!productId) {
      res.status(400).json({ error: "productId is required." });
      return;
    }
    const numQuantity = Math.max(1, Number(quantity) || 1);
    const product = await queryOne("SELECT id, name, status, stock FROM products WHERE id = $1", [productId]);
    if (!product) {
      res.status(404).json({ error: "Product not found." });
      return;
    }
    if (product.status && product.status !== "published" && product.status !== "active") {
      res.status(400).json({ error: `"${product.name}" is currently unavailable for purchase.` });
      return;
    }
    if (product.stock !== void 0 && product.stock !== null && product.stock <= 0) {
      res.status(400).json({ error: `"${product.name}" is currently out of stock.` });
      return;
    }
    const now = /* @__PURE__ */ new Date();
    const existing = await queryOne(
      `SELECT id, quantity FROM cart_items
       WHERE user_id = $1 AND product_id = $2 AND selected_color = $3`,
      [userId, productId, selectedColor]
    );
    if (existing) {
      await execute(
        `UPDATE cart_items
         SET quantity = quantity + $1, updated_at = $2
         WHERE id = $3`,
        [numQuantity, now, existing.id]
      );
    } else {
      const cartItemId = `cart_${crypto3.randomUUID()}`;
      await execute(
        `INSERT INTO cart_items (id, user_id, product_id, quantity, selected_color, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [cartItemId, userId, productId, numQuantity, selectedColor, now, now]
      );
    }
    res.json({ success: true, message: "Item added to cart." });
  } catch (error) {
    console.error("Add cart item error:", error);
    res.status(500).json({ error: "Failed to update cart." });
  }
});
app.put("/api/cart/:id", verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const id = String(req.params.id);
    const { quantity } = req.body;
    if (Number(quantity) <= 0) {
      await execute("DELETE FROM cart_items WHERE id = $1 AND user_id = $2", [id, userId]);
    } else {
      const now = /* @__PURE__ */ new Date();
      await execute(
        "UPDATE cart_items SET quantity = $1, updated_at = $2 WHERE id = $3 AND user_id = $4",
        [Number(quantity), now, id, userId]
      );
    }
    res.json({ success: true });
  } catch (error) {
    console.error("Update cart item error:", error);
    res.status(500).json({ error: "Failed to update cart item." });
  }
});
app.delete("/api/cart/:id", verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const id = String(req.params.id);
    await execute("DELETE FROM cart_items WHERE id = $1 AND user_id = $2", [id, userId]);
    res.json({ success: true });
  } catch (error) {
    console.error("Delete cart item error:", error);
    res.status(500).json({ error: "Failed to remove cart item." });
  }
});
app.post("/api/cart/merge", verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { items } = req.body;
    if (Array.isArray(items)) {
      const now = /* @__PURE__ */ new Date();
      for (const item of items) {
        if (!item.productId) continue;
        const existing = await queryOne(
          `SELECT id, quantity FROM cart_items
           WHERE user_id = $1 AND product_id = $2 AND selected_color = $3`,
          [userId, item.productId, item.selectedColor || "Standard"]
        );
        if (existing) {
          await execute(
            `UPDATE cart_items
             SET quantity = quantity + $1, updated_at = $2
             WHERE id = $3`,
            [Number(item.quantity || 1), now, existing.id]
          );
        } else {
          const cartItemId = `cart_${crypto3.randomUUID()}`;
          await execute(
            `INSERT INTO cart_items (id, user_id, product_id, quantity, selected_color, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [cartItemId, userId, item.productId, Number(item.quantity || 1), item.selectedColor || "Standard", now, now]
          );
        }
      }
    }
    res.json({ success: true, message: "Cart merged successfully." });
  } catch (error) {
    console.error("Merge cart error:", error);
    res.status(500).json({ error: "Failed to merge cart." });
  }
});
app.get("/api/wishlist", verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const rows = await query(
      `SELECT p.*
       FROM wishlist_items wi
       JOIN products p ON wi.product_id = p.id
       WHERE wi.user_id = $1
       ORDER BY wi.created_at DESC`,
      [userId]
    );
    const products = rows.map(formatProductRow);
    res.json(products);
  } catch (error) {
    console.error("Fetch wishlist error:", error);
    res.status(500).json({ error: "Failed to fetch wishlist." });
  }
});
app.post("/api/wishlist", verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.body;
    if (!productId) {
      res.status(400).json({ error: "productId is required." });
      return;
    }
    const id = `wish_${crypto3.randomUUID()}`;
    const now = /* @__PURE__ */ new Date();
    await execute(
      `INSERT INTO wishlist_items (id, user_id, product_id, created_at)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, product_id) DO NOTHING`,
      [id, userId, productId, now]
    );
    res.json({ success: true });
  } catch (error) {
    console.error("Add wishlist error:", error);
    res.status(500).json({ error: "Failed to add to wishlist." });
  }
});
app.delete("/api/wishlist/:productId", verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const productId = String(req.params.productId);
    await execute("DELETE FROM wishlist_items WHERE user_id = $1 AND product_id = $2", [userId, productId]);
    res.json({ success: true });
  } catch (error) {
    console.error("Delete wishlist error:", error);
    res.status(500).json({ error: "Failed to remove from wishlist." });
  }
});
app.get("/api/addresses", verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const addresses = await query(
      `SELECT * FROM addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC`,
      [userId]
    );
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
        updatedAt: a.updated_at
      }))
    );
  } catch (error) {
    console.error("Fetch addresses error:", error);
    res.status(500).json({ error: "Failed to fetch addresses." });
  }
});
app.post("/api/addresses", verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const fullName = req.body.fullName || req.body.name;
    const phone = req.body.phone;
    const addressLine = req.body.addressLine || req.body.streetAddress || req.body.address;
    const city = req.body.city;
    const state = req.body.state;
    const pincode = req.body.pincode || req.body.zip;
    const isDefault = Boolean(req.body.isDefault);
    if (!fullName || !phone || !addressLine || !city || !state || !pincode) {
      res.status(400).json({ error: "All address fields are required." });
      return;
    }
    const now = /* @__PURE__ */ new Date();
    const addressId = `addr_${crypto3.randomUUID()}`;
    if (isDefault) {
      await execute("UPDATE addresses SET is_default = 0 WHERE user_id = $1", [userId]);
    }
    await execute(
      `INSERT INTO addresses (id, user_id, full_name, phone, address_line, city, state, pincode, is_default, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [addressId, userId, fullName, phone, addressLine, city, state, pincode, isDefault ? 1 : 0, now, now]
    );
    res.status(201).json({ success: true, id: addressId });
  } catch (error) {
    console.error("Create address error:", error);
    res.status(500).json({ error: "Failed to save address." });
  }
});
app.delete("/api/addresses/:id", verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const id = String(req.params.id);
    await execute("DELETE FROM addresses WHERE id = $1 AND user_id = $2", [id, userId]);
    res.json({ success: true });
  } catch (error) {
    console.error("Delete address error:", error);
    res.status(500).json({ error: "Failed to delete address." });
  }
});
function formatHistoricalItems(rawItems) {
  const parsed = Array.isArray(rawItems) ? rawItems : typeof rawItems === "string" ? safeParseJson(rawItems, []) : [];
  return parsed.map((item) => {
    const rawImages = item.images || item.images_json || item.product?.images || [];
    const images = Array.isArray(rawImages) ? rawImages.filter((x) => typeof x === "string" && x.trim().length > 0) : typeof rawImages === "string" ? safeParseJson(rawImages, []).filter((x) => typeof x === "string" && x.trim().length > 0) : [];
    const firstImage = typeof item.image === "string" && item.image.trim() ? item.image.trim() : typeof item.product_image === "string" && item.product_image.trim() ? item.product_image.trim() : images.length > 0 ? images[0] : "";
    const price = Number(item.price || item.product?.price || 0);
    const quantity = Math.max(1, Math.round(Number(item.quantity || 1)));
    const prodId = String(item.productId || item.product_id || item.product?.id || "");
    const name = String(item.name || item.product?.name || "Bespoke Furniture Piece");
    const sku = String(item.sku || item.product?.sku || "");
    const slug = String(item.slug || item.product_slug || item.product?.slug || "");
    const selectedColor = item.selectedColor || item.selected_color || void 0;
    const material = item.material || void 0;
    const finish = item.finish || void 0;
    return {
      productId: prodId,
      name,
      sku,
      slug,
      price,
      quantity,
      selectedColor,
      material,
      finish,
      image: firstImage,
      images: images.length > 0 ? images : firstImage ? [firstImage] : [],
      lineTotal: price * quantity,
      product: {
        id: prodId,
        name,
        sku,
        images: images.length > 0 ? images : firstImage ? [firstImage] : []
      }
    };
  });
}
app.get("/api/orders", verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const rows = await query(
      `SELECT * FROM orders
       WHERE user_id = $1
         AND (payment_status IN ('paid', 'success') OR status IN ('confirmed', 'shipped', 'in_transit', 'out_for_delivery', 'delivered'))
         AND payment_status != 'failed'
         AND status != 'failed'
         AND status != 'pending'
       ORDER BY created_at DESC`,
      [userId]
    );
    const orders = rows.map((r) => ({
      id: r.id,
      orderNumber: r.order_number,
      subtotal: Number(r.subtotal),
      discount: Number(r.discount || 0),
      assemblyCharge: Number(r.assembly_charge || 0),
      convenienceFee: Number(r.convenience_fee || 0),
      convenienceFeePercent: Number(r.convenience_fee_percent || 0),
      gst: Number(r.gst || 0),
      gstPercent: Number(r.gst_percent || 18),
      total: Number(r.total),
      status: r.status,
      paymentStatus: r.payment_status || "paid",
      paymentMethod: r.payment_method || "cashfree",
      couponCode: r.coupon_code || null,
      couponDiscountType: r.coupon_discount_type || null,
      couponDiscountValue: r.coupon_discount_value != null ? Number(r.coupon_discount_value) : null,
      couponDiscountAmount: Number(r.coupon_discount_amount || 0),
      deliveryAddress: safeParseJson(r.delivery_address_json, {}),
      items: formatHistoricalItems(r.items_json),
      createdAt: r.created_at
    }));
    res.json(orders);
  } catch (error) {
    console.error("Fetch orders error:", error);
    res.status(500).json({ error: "Failed to fetch orders." });
  }
});
app.get("/api/orders/:id", verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const id = String(req.params.id).trim();
    const r = await queryOne(
      `SELECT * FROM orders
       WHERE (id = $1 OR order_number = $1)
         AND user_id = $2
         AND (payment_status IN ('paid', 'success') OR status IN ('confirmed', 'shipped', 'in_transit', 'out_for_delivery', 'delivered'))
         AND payment_status != 'failed'
         AND status != 'failed'
         AND status != 'pending'`,
      [id, userId]
    );
    if (!r) {
      res.status(404).json({ error: "Order not found." });
      return;
    }
    const orderItems = await query(
      "SELECT * FROM order_items WHERE order_id = $1 ORDER BY created_at ASC",
      [r.id]
    );
    const items = orderItems.length > 0 ? formatHistoricalItems(orderItems.map((oi) => ({
      productId: oi.product_id,
      name: oi.name,
      sku: oi.sku,
      slug: oi.product_slug,
      image: oi.product_image,
      images_json: oi.images_json,
      price: oi.price,
      quantity: oi.quantity,
      selectedColor: oi.selected_color,
      material: oi.material,
      finish: oi.finish
    }))) : formatHistoricalItems(r.items_json);
    res.json({
      id: r.id,
      orderNumber: r.order_number,
      subtotal: Number(r.subtotal),
      discount: Number(r.discount || 0),
      assemblyCharge: Number(r.assembly_charge || 0),
      convenienceFee: Number(r.convenience_fee || 0),
      convenienceFeePercent: Number(r.convenience_fee_percent || 0),
      gst: Number(r.gst || 0),
      gstPercent: Number(r.gst_percent || 18),
      total: Number(r.total),
      status: r.status,
      paymentStatus: r.payment_status || "pending",
      paymentMethod: r.payment_method || "cashfree",
      couponCode: r.coupon_code || null,
      couponDiscountType: r.coupon_discount_type || null,
      couponDiscountValue: r.coupon_discount_value != null ? Number(r.coupon_discount_value) : null,
      couponDiscountAmount: Number(r.coupon_discount_amount || 0),
      deliveryAddress: safeParseJson(r.delivery_address_json, {}),
      items,
      createdAt: r.created_at
    });
  } catch (error) {
    console.error("Fetch order detail error:", error);
    res.status(500).json({ error: "Failed to fetch order detail." });
  }
});
app.post("/api/orders", verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      items,
      subtotal,
      discount = 0,
      assemblyCharge = 0,
      convenienceFee = 0,
      convenienceFeePercent = 0,
      gst = 0,
      gstPercent = 18,
      paymentMethod = "cashfree"
    } = req.body;
    const deliveryAddress = req.body.deliveryAddress || req.body.shippingAddress;
    const total = req.body.total || req.body.grandTotal || subtotal;
    if (!items || !Array.isArray(items) || items.length === 0 || !deliveryAddress) {
      res.status(400).json({ error: "Order must contain items and a delivery address." });
      return;
    }
    const orderId = `ord_${crypto3.randomUUID()}`;
    const orderNumber = `GM-${(/* @__PURE__ */ new Date()).getFullYear()}-${Math.floor(1e5 + Math.random() * 9e5)}`;
    const now = /* @__PURE__ */ new Date();
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
        now
      ]
    );
    for (const item of items) {
      const orderItemId = `item_${crypto3.randomUUID()}`;
      const prodId = item.product?.id || item.productId || null;
      let prodName = item.product?.name || item.name || "Bespoke Furniture Piece";
      let prodSku = item.product?.sku || item.sku || "GM-SKU";
      let prodSlug = item.product?.slug || item.slug || "";
      let prodMaterial = item.product?.material || item.material || "";
      let prodFinish = item.product?.finish || item.finish || "";
      let images = item.product?.images || item.images || [];
      if (prodId) {
        const dbProd = await queryOne(
          "SELECT name, sku, slug, material, finish, images_json FROM products WHERE id = $1",
          [prodId]
        );
        if (dbProd) {
          prodName = dbProd.name || prodName;
          prodSku = dbProd.sku || prodSku;
          prodSlug = dbProd.slug || prodSlug;
          prodMaterial = dbProd.material || prodMaterial;
          prodFinish = dbProd.finish || prodFinish;
          if (dbProd.images_json) {
            images = safeParseJson(dbProd.images_json, images);
          }
        }
      }
      const firstImage = Array.isArray(images) && images.length > 0 && typeof images[0] === "string" ? images[0] : "";
      const prodPrice = Math.round(Number(item.price || item.product?.price || 0));
      const prodQty = Math.max(1, Math.round(Number(item.quantity || 1)));
      const color = item.selectedColor || null;
      const imagesJson = JSON.stringify(images);
      const specsJson = JSON.stringify(item.product?.specifications || item.specifications || []);
      await execute(
        `INSERT INTO order_items (
          id, order_id, product_id, name, sku, price, quantity, selected_color,
          images_json, specifications_json, product_slug, product_image, material, finish, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
        [orderItemId, orderId, prodId, prodName, prodSku, prodPrice, prodQty, color, imagesJson, specsJson, prodSlug, firstImage, prodMaterial, prodFinish, now]
      );
      if (prodId) {
        await execute(
          `UPDATE products
           SET stock = GREATEST(0, stock - $1), updated_at = $2
           WHERE id = $3`,
          [prodQty, now, prodId]
        );
      }
      if (userId && prodId) {
        if (color) {
          await execute("DELETE FROM cart_items WHERE user_id = $1 AND product_id = $2 AND selected_color = $3", [userId, prodId, color]);
        } else {
          await execute("DELETE FROM cart_items WHERE user_id = $1 AND product_id = $2", [userId, prodId]);
        }
      }
    }
    res.status(201).json({
      success: true,
      order: {
        id: orderId,
        orderNumber,
        total: Math.round(Number(total)),
        status: "confirmed",
        createdAt: now.toISOString()
      }
    });
  } catch (error) {
    console.error("Create order error:", error);
    res.status(500).json({ error: "Failed to create order." });
  }
});
app.post("/api/orders/verify-payment", verifyAuth, async (req, res) => {
  try {
    const { orderId, paymentId, paymentSignature, paymentStatus } = req.body;
    if (!orderId) {
      res.status(400).json({ error: "orderId is required." });
      return;
    }
    const order = await queryOne("SELECT * FROM orders WHERE id = $1", [orderId]);
    if (!order) {
      res.status(404).json({ error: "Order not found." });
      return;
    }
    const isVerified = Boolean(paymentSignature && paymentId);
    const newPaymentStatus = isVerified || paymentStatus === "paid" ? "paid" : "pending";
    const now = /* @__PURE__ */ new Date();
    await execute(
      `UPDATE orders
       SET payment_status = $1, payment_id = $2, updated_at = $3
       WHERE id = $4`,
      [newPaymentStatus, paymentId || null, now, orderId]
    );
    res.json({
      success: true,
      orderId,
      paymentStatus: newPaymentStatus,
      message: "Payment verification recorded."
    });
  } catch (error) {
    console.error("Payment verification error:", error);
    res.status(500).json({ error: "Payment verification failed." });
  }
});
async function getCashfreeConfig() {
  const activeEnv = await getActiveCashfreeEnvironment();
  return getCashfreeConfigForEnv(activeEnv);
}
app.post("/api/payments/cashfree/create-order", verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { items, deliveryAddress, couponCode } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: "Your cart must contain at least one item." });
      return;
    }
    if (!deliveryAddress || !deliveryAddress.fullName || !deliveryAddress.phone || !deliveryAddress.addressLine || !deliveryAddress.pincode) {
      res.status(400).json({ error: "A complete delivery address with phone number is required." });
      return;
    }
    const phoneDigits = String(deliveryAddress.phone || "").replace(/\D/g, "");
    const cleanPhone = phoneDigits.length > 10 && phoneDigits.startsWith("91") ? phoneDigits.slice(2) : phoneDigits;
    if (cleanPhone.length !== 10) {
      res.status(400).json({ error: "Please provide a valid 10-digit Indian mobile number." });
      return;
    }
    const verifiedItems = [];
    for (const it of items) {
      const prodId = it.product?.id || it.productId;
      if (!prodId) {
        res.status(400).json({ error: "Invalid product item in cart." });
        return;
      }
      const prod = await queryOne(
        "SELECT id, name, sku, slug, price, stock, status, material, finish, images_json, specifications_json FROM products WHERE id = $1",
        [prodId]
      );
      if (!prod) {
        res.status(400).json({ error: `Product is no longer available in the catalog.` });
        return;
      }
      if (prod.status !== "published") {
        res.status(400).json({ error: `Product "${prod.name}" is not currently available for purchase.` });
        return;
      }
      const requestedQty = Math.max(1, Math.round(Number(it.quantity || 1)));
      if (Number(prod.stock || 0) < requestedQty) {
        res.status(400).json({
          error: `Product "${prod.name}" has insufficient stock (${prod.stock} available).`
        });
        return;
      }
      const images = typeof prod.images_json === "string" ? JSON.parse(prod.images_json) : prod.images_json || [];
      const specs = typeof prod.specifications_json === "string" ? JSON.parse(prod.specifications_json) : prod.specifications_json || [];
      const firstValidImage = Array.isArray(images) && images.length > 0 && typeof images[0] === "string" ? images[0] : "";
      verifiedItems.push({
        productId: prod.id,
        name: prod.name,
        sku: prod.sku,
        slug: prod.slug || "",
        price: Number(prod.price),
        quantity: requestedQty,
        selectedColor: it.selectedColor || void 0,
        material: prod.material || void 0,
        finish: prod.finish || void 0,
        image: firstValidImage,
        images,
        specifications: specs
      });
    }
    const settingsRow = await queryOne("SELECT * FROM store_settings WHERE id = $1", ["default"]);
    const assemblyCharge = verifiedItems.length > 0 ? Number(settingsRow?.assembly_charge ?? 3e3) : 0;
    const convenienceFeePercent = Number(settingsRow?.convenience_fee_percent ?? 0);
    const gstPercent = Number(settingsRow?.gst_percent ?? 18);
    const subtotal = verifiedItems.reduce((acc, it) => acc + it.price * it.quantity, 0);
    const convenienceFee = Math.round(subtotal * (convenienceFeePercent / 100) * 100) / 100;
    const gst = Math.round(convenienceFee * (gstPercent / 100) * 100) / 100;
    const baseGrandTotal = Math.round((subtotal + assemblyCharge + convenienceFee + gst) * 100) / 100;
    let appliedCouponCode = couponCode ? String(couponCode).trim().toUpperCase() : null;
    let couponDiscountType = null;
    let couponDiscountValue = null;
    let couponDiscountAmount = 0;
    if (appliedCouponCode) {
      const cpn = await queryOne(
        "SELECT * FROM coupons WHERE code = $1 AND is_active = 1",
        [appliedCouponCode]
      );
      if (cpn) {
        couponDiscountType = String(cpn.discount_type).toLowerCase();
        couponDiscountValue = Number(cpn.discount_value);
        if (couponDiscountType === "percent") {
          couponDiscountAmount = Math.round(baseGrandTotal * (couponDiscountValue / 100) * 100) / 100;
        } else {
          couponDiscountAmount = Math.min(baseGrandTotal, couponDiscountValue);
        }
        couponDiscountAmount = Math.min(baseGrandTotal, couponDiscountAmount);
      } else {
        appliedCouponCode = null;
      }
    }
    const grandTotal = Math.max(0, Math.round((baseGrandTotal - couponDiscountAmount) * 100) / 100);
    const activeEnv = await getActiveCashfreeEnvironment();
    const cf = getCashfreeConfigForEnv(activeEnv);
    if (!cf.isConfigured) {
      console.warn(`[Cashfree] Credentials are not configured on the server for ${activeEnv} mode.`);
      res.status(500).json({
        error: `Cashfree payment gateway credentials are not configured on the server for ${activeEnv} mode. Please configure credentials in your environment variables.`
      });
      return;
    }
    const internalOrderId = `ord_${crypto3.randomUUID()}`;
    const orderNumber = `GM-${(/* @__PURE__ */ new Date()).getFullYear()}-${Math.floor(1e5 + Math.random() * 9e5)}`;
    const dateStr = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10).replace(/-/g, "");
    const shortId = crypto3.randomUUID().replace(/-/g, "").slice(0, 8);
    const cfOrderId = `GMF_${dateStr}_${shortId}`;
    await execute(
      `INSERT INTO orders (
        id, order_number, user_id, subtotal, discount, assembly_charge, convenience_fee,
        convenience_fee_percent, gst, gst_percent, total,
        status, payment_status, payment_method, payment_gateway,
        payment_order_id, delivery_address_json, items_json,
        coupon_code, coupon_discount_type, coupon_discount_value, coupon_discount_amount,
        payment_environment, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
        'pending', 'pending', 'cashfree', 'cashfree',
        $12, $13, $14, $15, $16, $17, $18, $19, NOW(), NOW()
      )`,
      [
        internalOrderId,
        orderNumber,
        userId,
        subtotal,
        couponDiscountAmount,
        assemblyCharge,
        convenienceFee,
        convenienceFeePercent,
        gst,
        gstPercent,
        grandTotal,
        cfOrderId,
        JSON.stringify(deliveryAddress),
        JSON.stringify(verifiedItems),
        appliedCouponCode,
        couponDiscountType,
        couponDiscountValue,
        couponDiscountAmount,
        activeEnv
      ]
    );
    for (const it of verifiedItems) {
      const orderItemId = `item_${crypto3.randomUUID()}`;
      await execute(
        `INSERT INTO order_items (
          id, order_id, product_id, name, sku, price, quantity, selected_color,
          images_json, specifications_json, product_slug, product_image, material, finish, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW())`,
        [
          orderItemId,
          internalOrderId,
          it.productId,
          it.name,
          it.sku,
          it.price,
          it.quantity,
          it.selectedColor || null,
          JSON.stringify(it.images),
          JSON.stringify(it.specifications),
          it.slug || null,
          it.image || (it.images?.[0] ?? null),
          it.material || null,
          it.finish || null
        ]
      );
    }
    const appUrl = getPublicAppUrl(req);
    const returnUrl = `${appUrl}/checkout/payment-return?order_id={order_id}`;
    console.log("[Cashfree] Order initialization diagnostic:", {
      appUrlConfigured: Boolean(process.env.APP_URL),
      appUrlValue: appUrl,
      nodeEnv: process.env.NODE_ENV || "production",
      cashfreeEnvironment: cf.env,
      endpoint: cf.ordersUrl
    });
    console.log(`Cashfree return URL:
${returnUrl}`);
    const cfPayload = {
      order_id: cfOrderId,
      order_amount: grandTotal,
      order_currency: "INR",
      customer_details: {
        customer_id: userId,
        customer_name: deliveryAddress.fullName || req.user.name || "Valued Customer",
        customer_email: req.user.email || "customer@gmfurniture.in",
        customer_phone: cleanPhone
      },
      order_meta: {
        return_url: returnUrl,
        notify_url: `${appUrl}/api/payments/cashfree/webhook`
      },
      order_note: `GM Furniture Order ${orderNumber}`
    };
    const cfRes = await fetch(`${cf.baseUrl}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-client-id": cf.clientId,
        "x-client-secret": cf.clientSecret,
        "x-api-version": cf.apiVersion
      },
      body: JSON.stringify(cfPayload)
    });
    if (!cfRes.ok) {
      const errJson = await cfRes.json().catch(() => ({}));
      console.error("[Cashfree] Create order error:", errJson);
      res.status(502).json({
        error: errJson?.message || "Unable to start payment session with Cashfree. Please try again."
      });
      return;
    }
    const cfData = await cfRes.json();
    const paymentSessionId = cfData?.payment_session_id;
    await execute(
      "UPDATE orders SET payment_session_id = $1, updated_at = NOW() WHERE id = $2",
      [paymentSessionId, internalOrderId]
    );
    res.status(201).json({
      success: true,
      paymentSessionId,
      cfOrderId,
      orderId: internalOrderId,
      orderNumber,
      environment: cf.env,
      grandTotal
    });
  } catch (error) {
    console.error("Create Cashfree order error:", {
      message: error instanceof Error ? error.message : String(error),
      code: error?.code,
      detail: error?.detail,
      hint: error?.hint,
      where: error?.where,
      position: error?.position,
      routine: error?.routine,
      stack: error instanceof Error ? error.stack : void 0
    });
    res.status(500).json({ error: "Failed to initialize Cashfree payment order." });
  }
});
function formatOrderFull(ord) {
  return {
    id: ord.id,
    orderNumber: ord.order_number,
    subtotal: Number(ord.subtotal),
    discount: Number(ord.discount || 0),
    assemblyCharge: Number(ord.assembly_charge || 0),
    convenienceFee: Number(ord.convenience_fee || 0),
    convenienceFeePercent: Number(ord.convenience_fee_percent || 0),
    gst: Number(ord.gst || 0),
    gstPercent: Number(ord.gst_percent || 18),
    total: Number(ord.total),
    status: ord.status,
    paymentStatus: ord.payment_status,
    paymentMethod: ord.payment_method,
    paymentGateway: ord.payment_gateway,
    paymentEnvironment: ord.payment_environment || "sandbox",
    paymentOrderId: ord.payment_order_id,
    paymentTransactionId: ord.payment_transaction_id,
    couponCode: ord.coupon_code || null,
    couponDiscountType: ord.coupon_discount_type || null,
    couponDiscountValue: ord.coupon_discount_value != null ? Number(ord.coupon_discount_value) : null,
    couponDiscountAmount: Number(ord.coupon_discount_amount || 0),
    paidAt: ord.paid_at,
    deliveryAddress: typeof ord.delivery_address_json === "string" ? safeParseJson(ord.delivery_address_json, {}) : ord.delivery_address_json || {},
    items: formatHistoricalItems(ord.items_json),
    createdAt: ord.created_at
  };
}
app.get("/api/payments/cashfree/status", async (req, res) => {
  try {
    const orderIdParam = (req.query.order_id || "").trim();
    if (!orderIdParam) {
      res.status(400).json({ error: "order_id query parameter is required." });
      return;
    }
    const order = await queryOne(
      "SELECT * FROM orders WHERE payment_order_id = $1 OR id = $1 OR order_number = $1",
      [orderIdParam]
    );
    if (!order) {
      res.status(404).json({ error: "Order not found." });
      return;
    }
    if (order.payment_status === "paid") {
      res.json({
        success: true,
        paymentStatus: "SUCCESS",
        order: formatOrderFull(order)
      });
      return;
    }
    const orderEnv = sanitizeEnvironment(order.payment_environment);
    const cf = getCashfreeConfigForEnv(orderEnv);
    if (!cf.isConfigured) {
      res.json({
        success: false,
        paymentStatus: "PENDING",
        message: `Cashfree credentials for ${orderEnv} mode are not configured on the server.`,
        order: formatOrderFull(order)
      });
      return;
    }
    const cfOrderId = order.payment_order_id || order.id;
    const paymentsRes = await fetch(`${cf.baseUrl}/orders/${encodeURIComponent(cfOrderId)}/payments`, {
      headers: {
        "x-client-id": cf.clientId,
        "x-client-secret": cf.clientSecret,
        "x-api-version": cf.apiVersion
      }
    });
    const payments = paymentsRes.ok ? await paymentsRes.json() : [];
    let isSuccess = false;
    let isFailed = false;
    let isPending = true;
    let transactionId = null;
    if (Array.isArray(payments) && payments.length > 0) {
      const successPayment = payments.find((p) => p.payment_status === "SUCCESS");
      if (successPayment) {
        const paidAmount = successPayment.payment_amount != null ? Number(successPayment.payment_amount) : null;
        const expectedTotal = Number(order.total);
        if (paidAmount !== null && !isNaN(paidAmount) && Math.abs(paidAmount - expectedTotal) > 1) {
          console.error(`[Cashfree Security] Payment amount mismatch: paid=${paidAmount}, expected=${expectedTotal}`);
          res.status(400).json({ error: "Payment amount mismatch detected." });
          return;
        }
        isSuccess = true;
        isPending = false;
        transactionId = String(successPayment.cf_payment_id || successPayment.bank_reference || "");
      } else {
        const allFailed = payments.every(
          (p) => ["FAILED", "USER_DROPPED", "CANCELLED"].includes(p.payment_status)
        );
        if (allFailed) {
          isFailed = true;
          isPending = false;
        }
      }
    } else {
      const orderRes = await fetch(`${cf.baseUrl}/orders/${encodeURIComponent(cfOrderId)}`, {
        headers: {
          "x-client-id": cf.clientId,
          "x-client-secret": cf.clientSecret,
          "x-api-version": cf.apiVersion
        }
      });
      if (orderRes.ok) {
        const cfOrder = await orderRes.json();
        if (cfOrder?.order_status === "PAID") {
          const cfAmount = cfOrder.order_amount != null ? Number(cfOrder.order_amount) : null;
          const expectedTotal = Number(order.total);
          if (cfAmount !== null && !isNaN(cfAmount) && Math.abs(cfAmount - expectedTotal) > 1) {
            console.error(`[Cashfree Security] Order amount mismatch: paid=${cfAmount}, expected=${expectedTotal}`);
            res.status(400).json({ error: "Payment amount mismatch detected." });
            return;
          }
          isSuccess = true;
          isPending = false;
        } else if (cfOrder?.order_status === "EXPIRED") {
          isFailed = true;
          isPending = false;
        }
      }
    }
    if (isSuccess) {
      const now = /* @__PURE__ */ new Date();
      const updateResult = await execute(
        `UPDATE orders
         SET payment_status = 'paid', status = 'confirmed', payment_transaction_id = $1, paid_at = $2, updated_at = $2
         WHERE id = $3 AND payment_status != 'paid'`,
        [transactionId || "cf_verified", now, order.id]
      );
      if (updateResult.rowCount > 0) {
        const items = typeof order.items_json === "string" ? JSON.parse(order.items_json) : order.items_json;
        if (Array.isArray(items)) {
          for (const it of items) {
            const prodId = it.product?.id || it.productId;
            const qty = Math.max(1, Math.round(Number(it.quantity || 1)));
            if (prodId) {
              await execute(
                "UPDATE products SET stock = GREATEST(0, stock - $1), updated_at = $2 WHERE id = $3",
                [qty, now, prodId]
              );
            }
          }
        }
        if (order.user_id && Array.isArray(items)) {
          for (const it of items) {
            const prodId = it.product?.id || it.productId;
            const color = it.selectedColor || it.selected_color;
            if (prodId && color) {
              await execute(
                "DELETE FROM cart_items WHERE user_id = $1 AND product_id = $2 AND selected_color = $3",
                [order.user_id, prodId, color]
              );
            } else if (prodId) {
              await execute(
                "DELETE FROM cart_items WHERE user_id = $1 AND product_id = $2",
                [order.user_id, prodId]
              );
            }
          }
        }
      }
      const refreshed = await queryOne("SELECT * FROM orders WHERE id = $1", [order.id]);
      res.json({
        success: true,
        paymentStatus: "SUCCESS",
        order: formatOrderFull(refreshed)
      });
      return;
    }
    if (isFailed) {
      await execute(
        `UPDATE orders SET payment_status = 'failed', status = 'failed', updated_at = NOW() WHERE id = $1 AND payment_status != 'paid'`,
        [order.id]
      );
      const refreshed = await queryOne("SELECT * FROM orders WHERE id = $1", [order.id]);
      res.json({
        success: true,
        paymentStatus: "FAILED",
        message: "Payment was not completed or was cancelled at the gateway.",
        order: formatOrderFull(refreshed)
      });
      return;
    }
    res.json({
      success: true,
      paymentStatus: "PENDING",
      message: "Payment is being verified.",
      order: formatOrderFull(order)
    });
  } catch (error) {
    console.error("Verify Cashfree status error:", error);
    res.status(500).json({ error: "Failed to verify payment status." });
  }
});
app.post("/api/payments/cashfree/webhook", async (req, res) => {
  try {
    const signature = req.headers["x-webhook-signature"];
    const timestamp = req.headers["x-webhook-timestamp"];
    const rawBody = req.rawBody || JSON.stringify(req.body);
    const payload = req.body || {};
    const eventType = payload.type || payload.event;
    const orderData = payload.data?.order || payload.order;
    const paymentData = payload.data?.payment || payload.payment;
    const cfOrderId = orderData?.order_id || payload.order_id;
    if (!cfOrderId) {
      res.status(200).json({ status: "ignored_missing_order_id" });
      return;
    }
    const order = await queryOne(
      "SELECT * FROM orders WHERE payment_order_id = $1 OR id = $1",
      [cfOrderId]
    );
    const orderEnv = sanitizeEnvironment(
      order?.payment_environment || await getActiveCashfreeEnvironment()
    );
    const cf = getCashfreeConfigForEnv(orderEnv);
    if (cf.clientSecret && signature && timestamp) {
      const isValid = verifyCashfreeWebhookSignature(rawBody, signature, timestamp, cf.clientSecret);
      if (!isValid) {
        console.warn("[Cashfree Webhook] Invalid webhook signature detected.");
        res.status(400).json({ error: "Invalid webhook signature." });
        return;
      }
    }
    const isPaid = eventType === "PAYMENT_SUCCESS_WEBHOOK" || eventType === "ORDER_PAID" || paymentData?.payment_status === "SUCCESS";
    if (isPaid) {
      if (order && order.payment_status !== "paid") {
        const txId = String(paymentData?.cf_payment_id || paymentData?.bank_reference || "webhook_verified");
        const now = /* @__PURE__ */ new Date();
        const updateResult = await execute(
          `UPDATE orders
           SET payment_status = 'paid', status = 'confirmed', payment_transaction_id = $1, paid_at = $2, updated_at = $2
           WHERE id = $3 AND payment_status != 'paid'`,
          [txId, now, order.id]
        );
        if (updateResult.rowCount > 0) {
          const items = typeof order.items_json === "string" ? JSON.parse(order.items_json) : order.items_json;
          if (Array.isArray(items)) {
            for (const it of items) {
              const prodId = it.product?.id || it.productId;
              const qty = Math.max(1, Math.round(Number(it.quantity || 1)));
              if (prodId) {
                await execute(
                  "UPDATE products SET stock = GREATEST(0, stock - $1), updated_at = $2 WHERE id = $3",
                  [qty, now, prodId]
                );
              }
            }
          }
          if (order.user_id && Array.isArray(items)) {
            for (const it of items) {
              const prodId = it.product?.id || it.productId;
              const color = it.selectedColor || it.selected_color;
              if (prodId && color) {
                await execute(
                  "DELETE FROM cart_items WHERE user_id = $1 AND product_id = $2 AND selected_color = $3",
                  [order.user_id, prodId, color]
                );
              } else if (prodId) {
                await execute(
                  "DELETE FROM cart_items WHERE user_id = $1 AND product_id = $2",
                  [order.user_id, prodId]
                );
              }
            }
          }
        }
      }
    } else {
      const isFailed = eventType === "PAYMENT_FAILED_WEBHOOK" || eventType === "ORDER_FAILED" || eventType === "PAYMENT_USER_DROPPED_WEBHOOK" || paymentData?.payment_status === "FAILED" || paymentData?.payment_status === "USER_DROPPED" || paymentData?.payment_status === "CANCELLED";
      if (isFailed) {
        await execute(
          `UPDATE orders SET payment_status = 'failed', status = 'failed', updated_at = NOW() WHERE (payment_order_id = $1 OR id = $1) AND payment_status != 'paid'`,
          [cfOrderId]
        );
      }
    }
    res.status(200).json({ status: "processed" });
  } catch (error) {
    console.error("[Cashfree Webhook] Error:", error);
    res.status(500).json({ error: "Webhook processing failed." });
  }
});
app.get("/api/admin/cashfree/status", verifyAdmin, async (_req, res) => {
  try {
    const activeEnv = await getActiveCashfreeEnvironment();
    const statusReport = getCashfreeStatusReport(activeEnv);
    let pendingOrdersCount = 0;
    if (hasDatabaseUrl()) {
      const pendingRow = await queryOne(
        "SELECT COUNT(*) as count FROM orders WHERE payment_status = 'pending'"
      );
      pendingOrdersCount = Number(pendingRow?.count || 0);
    }
    res.json({
      environment: activeEnv,
      sandboxConfigured: statusReport.sandboxConfigured,
      productionConfigured: statusReport.productionConfigured,
      switchPasswordConfigured: statusReport.switchPasswordConfigured,
      pendingOrdersCount
    });
  } catch (error) {
    console.error("Fetch Cashfree admin status error:", error);
    res.status(500).json({ error: "Failed to retrieve Cashfree status." });
  }
});
app.put("/api/admin/cashfree/environment", verifyAdmin, async (req, res) => {
  try {
    const { environment, password } = req.body;
    const rawIp = (req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown").split(",")[0].trim();
    const rateLimitKey = `${req.user?.id || "admin"}_${rawIp}`;
    const pwdCheck = verifyEnvSwitchPassword(password, rateLimitKey);
    if (!pwdCheck.valid) {
      res.status(pwdCheck.status).json({ error: pwdCheck.error });
      return;
    }
    if (!environment || environment !== "sandbox" && environment !== "production") {
      res.status(400).json({
        error: 'Invalid environment. Allowed values are "sandbox" or "production".'
      });
      return;
    }
    const targetEnv = environment;
    const targetConfig = getCashfreeConfigForEnv(targetEnv);
    if (!targetConfig.isConfigured) {
      if (targetEnv === "production") {
        res.status(400).json({
          error: "Cannot switch to Production: Cashfree Production credentials (CASHFREE_PRODUCTION_CLIENT_ID and CASHFREE_PRODUCTION_CLIENT_SECRET, or CASHFREE_CLIENT_ID and CASHFREE_CLIENT_SECRET) are not configured on the server. Please configure them in your environment variables before enabling Live Mode."
        });
      } else {
        res.status(400).json({
          error: "Cannot switch to Sandbox: Cashfree Sandbox credentials (CASHFREE_SANDBOX_CLIENT_ID and CASHFREE_SANDBOX_CLIENT_SECRET, or CASHFREE_CLIENT_ID and CASHFREE_CLIENT_SECRET) are not configured on the server."
        });
      }
      return;
    }
    const currentEnv = await getActiveCashfreeEnvironment();
    if (currentEnv !== targetEnv && hasDatabaseUrl()) {
      const currentConfig = getCashfreeConfigForEnv(currentEnv);
      const pendingOrders = await queryOne(
        "SELECT COUNT(*) as count FROM orders WHERE payment_status = 'pending' AND payment_environment = $1 AND created_at >= NOW() - INTERVAL '30 minutes'",
        [currentEnv]
      );
      const recentPendingCount = Number(pendingOrders?.count || 0);
      if (recentPendingCount > 0 && !currentConfig.isConfigured) {
        res.status(409).json({
          error: `Cannot switch environment: There are ${recentPendingCount} pending payment(s) created in ${currentEnv} mode that cannot be reconciled without ${currentEnv} credentials.`
        });
        return;
      }
    }
    if (hasDatabaseUrl()) {
      await execute(
        `INSERT INTO store_settings (id, cashfree_environment, updated_at)
         VALUES ('default', $1, NOW())
         ON CONFLICT (id) DO UPDATE SET
           cashfree_environment = EXCLUDED.cashfree_environment,
           updated_at = NOW()`,
        [targetEnv]
      );
    }
    console.log(`[Cashfree Security] Payment environment successfully switched to "${targetEnv}" by admin ${req.user?.email}`);
    res.json({
      success: true,
      environment: targetEnv,
      message: `Cashfree environment successfully updated to ${targetEnv === "production" ? "Production (Live)" : "Sandbox (Test)"} mode.`
    });
  } catch (error) {
    console.error("Switch Cashfree environment error:", error);
    res.status(500).json({ error: error.message || "Failed to update Cashfree environment." });
  }
});
app.get("/api/admin/products", verifyAdmin, async (_req, res) => {
  try {
    const rows = await query("SELECT * FROM products ORDER BY created_at DESC");
    const products = rows.map(formatProductRow);
    res.json(products);
  } catch (error) {
    console.error("Admin fetch products error:", error);
    res.status(500).json({ error: "Failed to fetch products for administration." });
  }
});
app.get("/api/admin/products/:id", verifyAdmin, async (req, res) => {
  try {
    const id = String(req.params.id);
    const row = await queryOne("SELECT * FROM products WHERE id = $1 OR slug = $2", [id, id]);
    if (!row) {
      res.status(404).json({ error: "Product not found." });
      return;
    }
    res.json(formatProductRow(row));
  } catch (error) {
    console.error("Admin fetch single product error:", error);
    res.status(500).json({ error: "Failed to retrieve product details." });
  }
});
app.post("/api/admin/products", verifyAdmin, async (req, res) => {
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
      status = "published",
      featured = false,
      newArrival = false,
      stock = 5
    } = req.body;
    if (!name || typeof name !== "string" || !name.trim()) {
      res.status(400).json({ error: "Product name is required." });
      return;
    }
    const sku = rawSku && typeof rawSku === "string" ? rawSku.trim().toUpperCase() : "";
    if (!sku) {
      res.status(400).json({ error: "Product SKU is required." });
      return;
    }
    const slug = rawSlug && typeof rawSlug === "string" && rawSlug.trim() ? rawSlug.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") : name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    if (!slug) {
      res.status(400).json({ error: "Valid product slug is required." });
      return;
    }
    if (!category || typeof category !== "string" || !category.trim()) {
      res.status(400).json({ error: "Product category is required." });
      return;
    }
    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice <= 0) {
      res.status(400).json({ error: "Price must be a valid positive number." });
      return;
    }
    const numMrp = Number(mrp);
    if (isNaN(numMrp) || numMrp < numPrice) {
      res.status(400).json({ error: "MRP must be a valid number greater than or equal to the selling price." });
      return;
    }
    const numStock = Number(stock);
    if (isNaN(numStock) || numStock < 0) {
      res.status(400).json({ error: "Stock units must be 0 or greater." });
      return;
    }
    if (!description || typeof description !== "string" || !description.trim()) {
      res.status(400).json({ error: "Product description is required." });
      return;
    }
    if (!material || typeof material !== "string" || !material.trim()) {
      res.status(400).json({ error: "Material specification is required." });
      return;
    }
    if (!finish || typeof finish !== "string" || !finish.trim()) {
      res.status(400).json({ error: "Finish specification is required." });
      return;
    }
    const validImages = Array.isArray(images) ? images.filter((img) => typeof img === "string" && img.trim()) : [];
    if (validImages.length === 0) {
      res.status(400).json({ error: "At least one product image URL is required." });
      return;
    }
    if (!dimensions || typeof dimensions !== "object") {
      res.status(400).json({ error: "Product dimensions are required." });
      return;
    }
    const existingSku = await queryOne("SELECT id FROM products WHERE sku = $1", [sku]);
    if (existingSku) {
      res.status(400).json({ error: `SKU "${sku}" is already assigned to another product.` });
      return;
    }
    const existingSlug = await queryOne("SELECT id FROM products WHERE slug = $1", [slug]);
    if (existingSlug) {
      res.status(400).json({ error: `URL slug "${slug}" is already in use by another product.` });
      return;
    }
    const calculatedDiscount = discount !== void 0 && !isNaN(Number(discount)) ? Number(discount) : Math.max(0, Math.round((numMrp - numPrice) / numMrp * 100));
    const id = `gm-prod-${Date.now().toString(36)}-${Math.floor(100 + Math.random() * 900)}`;
    const now = /* @__PURE__ */ new Date();
    const colorsArr = Array.isArray(colors) && colors.length > 0 ? colors : [{ name: "Default Finish", hex: "#333333" }];
    const specsArr = Array.isArray(specifications) ? specifications : [];
    const careArr = Array.isArray(careInstructions) ? careInstructions : [];
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
        leadTime || "2-4 Weeks Delivery & Assembly",
        warranty || "5-Year Structural Warranty",
        JSON.stringify(specsArr),
        JSON.stringify(careArr),
        status || "published",
        featured ? 1 : 0,
        newArrival ? 1 : 0,
        5,
        0,
        Math.floor(numStock),
        now,
        now
      ]
    );
    const createdRow = await queryOne("SELECT * FROM products WHERE id = $1", [id]);
    res.status(201).json({
      success: true,
      product: formatProductRow(createdRow),
      message: "Product created successfully."
    });
  } catch (error) {
    console.error("Admin create product error:", error);
    res.status(500).json({ error: error.message || "Failed to create product." });
  }
});
app.put("/api/admin/products/:id", verifyAdmin, async (req, res) => {
  try {
    const id = String(req.params.id);
    const existing = await queryOne("SELECT * FROM products WHERE id = $1", [id]);
    if (!existing) {
      res.status(404).json({ error: "Product not found." });
      return;
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
      stock
    } = req.body;
    if (!name || typeof name !== "string" || !name.trim()) {
      res.status(400).json({ error: "Product name is required." });
      return;
    }
    const sku = rawSku && typeof rawSku === "string" ? rawSku.trim().toUpperCase() : "";
    if (!sku) {
      res.status(400).json({ error: "Product SKU is required." });
      return;
    }
    const slug = rawSlug && typeof rawSlug === "string" && rawSlug.trim() ? rawSlug.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") : name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    if (!slug) {
      res.status(400).json({ error: "Valid product slug is required." });
      return;
    }
    if (!category || typeof category !== "string" || !category.trim()) {
      res.status(400).json({ error: "Product category is required." });
      return;
    }
    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice <= 0) {
      res.status(400).json({ error: "Price must be a valid positive number." });
      return;
    }
    const numMrp = Number(mrp);
    if (isNaN(numMrp) || numMrp < numPrice) {
      res.status(400).json({ error: "MRP must be a valid number greater than or equal to selling price." });
      return;
    }
    const numStock = Number(stock);
    if (isNaN(numStock) || numStock < 0) {
      res.status(400).json({ error: "Stock units must be 0 or greater." });
      return;
    }
    if (!description || typeof description !== "string" || !description.trim()) {
      res.status(400).json({ error: "Product description is required." });
      return;
    }
    if (!material || typeof material !== "string" || !material.trim()) {
      res.status(400).json({ error: "Material specification is required." });
      return;
    }
    if (!finish || typeof finish !== "string" || !finish.trim()) {
      res.status(400).json({ error: "Finish specification is required." });
      return;
    }
    const validImages = Array.isArray(images) ? images.filter((img) => typeof img === "string" && img.trim()) : [];
    if (validImages.length === 0) {
      res.status(400).json({ error: "At least one product image URL is required." });
      return;
    }
    if (!dimensions || typeof dimensions !== "object") {
      res.status(400).json({ error: "Product dimensions are required." });
      return;
    }
    const existingSku = await queryOne("SELECT id FROM products WHERE sku = $1 AND id != $2", [sku, id]);
    if (existingSku) {
      res.status(400).json({ error: `SKU "${sku}" is already assigned to another product.` });
      return;
    }
    const existingSlug = await queryOne("SELECT id FROM products WHERE slug = $1 AND id != $2", [slug, id]);
    if (existingSlug) {
      res.status(400).json({ error: `URL slug "${slug}" is already in use by another product.` });
      return;
    }
    const calculatedDiscount = discount !== void 0 && !isNaN(Number(discount)) ? Number(discount) : Math.max(0, Math.round((numMrp - numPrice) / numMrp * 100));
    const now = /* @__PURE__ */ new Date();
    const colorsArr = Array.isArray(colors) ? colors : safeParseJson(existing.colors_json, []);
    const specsArr = Array.isArray(specifications) ? specifications : safeParseJson(existing.specifications_json, []);
    const careArr = Array.isArray(careInstructions) ? careInstructions : safeParseJson(existing.care_instructions_json, []);
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
        featured !== void 0 ? featured ? 1 : 0 : existing.featured,
        newArrival !== void 0 ? newArrival ? 1 : 0 : existing.new_arrival,
        Math.floor(numStock),
        now,
        id
      ]
    );
    const updatedRow = await queryOne("SELECT * FROM products WHERE id = $1", [id]);
    res.json({
      success: true,
      product: formatProductRow(updatedRow),
      message: "Product updated successfully."
    });
  } catch (error) {
    console.error("Admin update product error:", error);
    res.status(500).json({ error: error.message || "Failed to update product." });
  }
});
app.delete("/api/admin/products/:id", verifyAdmin, async (req, res) => {
  try {
    const id = String(req.params.id);
    const existing = await queryOne(
      "SELECT id, name FROM products WHERE id = $1",
      [id]
    );
    if (!existing) {
      res.status(404).json({ error: "Product not found." });
      return;
    }
    await execute("DELETE FROM cart_items WHERE product_id = $1", [id]);
    await execute("DELETE FROM wishlist_items WHERE product_id = $1", [id]);
    await execute("DELETE FROM products WHERE id = $1", [id]);
    res.json({
      success: true,
      message: `Product "${existing.name}" successfully deleted. Historical orders remain intact.`
    });
  } catch (error) {
    console.error("Admin delete product error:", error);
    res.status(500).json({ error: "Failed to delete product." });
  }
});
app.patch("/api/admin/products/:id/stock", verifyAdmin, async (req, res) => {
  try {
    const id = String(req.params.id);
    const { delta } = req.body;
    if (delta === void 0 || typeof delta !== "number") {
      res.status(400).json({ error: "delta (number) is required." });
      return;
    }
    const existing = await queryOne(
      "SELECT id, stock FROM products WHERE id = $1",
      [id]
    );
    if (!existing) {
      res.status(404).json({ error: "Product not found." });
      return;
    }
    const newStock = Math.max(0, Number(existing.stock) + delta);
    const now = /* @__PURE__ */ new Date();
    await execute(
      "UPDATE products SET stock = $1, updated_at = $2 WHERE id = $3",
      [newStock, now, id]
    );
    res.json({ success: true, stock: newStock });
  } catch (error) {
    console.error("Admin stock patch error:", error);
    res.status(500).json({ error: "Failed to update stock." });
  }
});
app.put("/api/admin/settings", verifyAdmin, async (req, res) => {
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
      gstPercent
    } = req.body;
    const cleanGstin = gstin ? String(gstin).trim().toUpperCase() : "36AFNPV7079J1ZG";
    const cleanAssembly = Number(assemblyCharge) >= 0 ? Math.round(Number(assemblyCharge)) : 3e3;
    const cleanConvFee = Number(convenienceFeePercent) >= 0 ? Number(convenienceFeePercent) : 0;
    const cleanGst = Number(gstPercent) >= 0 ? Number(gstPercent) : 18;
    await execute(
      `INSERT INTO store_settings (
        id, store_name, brand_tagline, support_email, support_phone,
        registered_address, gstin, pan, currency,
        assembly_charge, convenience_fee_percent, gst_percent, updated_at
      ) VALUES (
        'default', $1, $2, $3, $4, $5, $6, $7, 'INR (\u20B9)', $8, $9, $10, NOW()
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
        storeName ? String(storeName).trim() : "GM Furniture",
        brandTagline ? String(brandTagline).trim() : "Handcrafted Solid Wood Furniture for Modern Living",
        supportEmail ? String(supportEmail).trim() : "support@gmfurniture.in",
        supportPhone ? String(supportPhone).trim() : "+91 (011) 4920-8000",
        registeredAddress ? String(registeredAddress).trim() : "Studio GM, Sector 44, Institutional Area, Gurugram, Haryana 122003, India",
        cleanGstin,
        pan ? String(pan).trim().toUpperCase() : "AAACG1234F",
        cleanAssembly,
        cleanConvFee,
        cleanGst
      ]
    );
    const updated = await queryOne("SELECT * FROM store_settings WHERE id = $1", ["default"]);
    res.json({
      success: true,
      message: "Store settings successfully saved.",
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
        gstPercent: Number(updated.gst_percent)
      }
    });
  } catch (error) {
    console.error("Save settings error:", error);
    res.status(500).json({ error: error.message || "Failed to save store settings." });
  }
});
app.post("/api/admin/categories", verifyAdmin, async (req, res) => {
  try {
    const { name, slug: rawSlug, description = "", image = "" } = req.body;
    if (!name || !name.trim()) {
      res.status(400).json({ error: "Category name is required." });
      return;
    }
    const slug = rawSlug && rawSlug.trim() ? rawSlug.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") : name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const id = `cat-${Date.now().toString(36)}`;
    await execute(
      `INSERT INTO categories (id, slug, name, description, image, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
      [id, slug, name.trim(), description.trim(), image.trim()]
    );
    const created = await queryOne("SELECT * FROM categories WHERE id = $1", [id]);
    res.status(201).json({ success: true, category: created });
  } catch (error) {
    console.error("Create category error:", error);
    res.status(500).json({ error: error.message || "Failed to create category." });
  }
});
app.put("/api/admin/categories/:id", verifyAdmin, async (req, res) => {
  try {
    const id = String(req.params.id);
    const { name, slug: rawSlug, description, image } = req.body;
    const existing = await queryOne("SELECT * FROM categories WHERE id = $1", [id]);
    if (!existing) {
      res.status(404).json({ error: "Category not found." });
      return;
    }
    const slug = rawSlug && rawSlug.trim() ? rawSlug.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") : existing.slug;
    await execute(
      `UPDATE categories
       SET name = COALESCE($1, name),
           slug = COALESCE($2, slug),
           description = COALESCE($3, description),
           image = COALESCE($4, image),
           updated_at = NOW()
       WHERE id = $5`,
      [name?.trim() || null, slug || null, description !== void 0 ? description.trim() : null, image !== void 0 ? image.trim() : null, id]
    );
    const updated = await queryOne("SELECT * FROM categories WHERE id = $1", [id]);
    res.json({ success: true, category: updated });
  } catch (error) {
    console.error("Update category error:", error);
    res.status(500).json({ error: error.message || "Failed to update category." });
  }
});
app.delete("/api/admin/categories/:id", verifyAdmin, async (req, res) => {
  try {
    const id = String(req.params.id);
    await execute("DELETE FROM categories WHERE id = $1", [id]);
    res.json({ success: true, message: "Category deleted successfully." });
  } catch (error) {
    console.error("Delete category error:", error);
    res.status(500).json({ error: error.message || "Failed to delete category." });
  }
});
app.post("/api/admin/rooms", verifyAdmin, async (req, res) => {
  try {
    const { name, slug: rawSlug, tagline = "", description = "", image = "", comingSoon = false } = req.body;
    if (!name || !name.trim()) {
      res.status(400).json({ error: "Room name is required." });
      return;
    }
    const slug = rawSlug && rawSlug.trim() ? rawSlug.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") : name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const id = `room-${Date.now().toString(36)}`;
    await execute(
      `INSERT INTO rooms (id, slug, name, tagline, description, image, coming_soon, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
      [id, slug, name.trim(), tagline.trim(), description.trim(), image.trim(), comingSoon ? 1 : 0]
    );
    const created = await queryOne("SELECT * FROM rooms WHERE id = $1", [id]);
    res.status(201).json({ success: true, room: created });
  } catch (error) {
    console.error("Create room error:", error);
    res.status(500).json({ error: error.message || "Failed to create room." });
  }
});
app.put("/api/admin/rooms/:id", verifyAdmin, async (req, res) => {
  try {
    const id = String(req.params.id);
    const { name, slug: rawSlug, tagline, description, image, comingSoon } = req.body;
    const existing = await queryOne("SELECT * FROM rooms WHERE id = $1", [id]);
    if (!existing) {
      res.status(404).json({ error: "Room not found." });
      return;
    }
    const slug = rawSlug && rawSlug.trim() ? rawSlug.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") : existing.slug;
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
        tagline !== void 0 ? tagline.trim() : null,
        description !== void 0 ? description.trim() : null,
        image !== void 0 ? image.trim() : null,
        comingSoon !== void 0 ? comingSoon ? 1 : 0 : null,
        id
      ]
    );
    const updated = await queryOne("SELECT * FROM rooms WHERE id = $1", [id]);
    res.json({ success: true, room: updated });
  } catch (error) {
    console.error("Update room error:", error);
    res.status(500).json({ error: error.message || "Failed to update room." });
  }
});
app.delete("/api/admin/rooms/:id", verifyAdmin, async (req, res) => {
  try {
    const id = String(req.params.id);
    await execute("DELETE FROM rooms WHERE id = $1", [id]);
    res.json({ success: true, message: "Room deleted successfully." });
  } catch (error) {
    console.error("Delete room error:", error);
    res.status(500).json({ error: error.message || "Failed to delete room." });
  }
});
app.post("/api/admin/collections", verifyAdmin, async (req, res) => {
  try {
    const { name, slug: rawSlug, tagline = "", description = "", image = "" } = req.body;
    if (!name || !name.trim()) {
      res.status(400).json({ error: "Collection name is required." });
      return;
    }
    const slug = rawSlug && rawSlug.trim() ? rawSlug.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") : name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const id = `col-${Date.now().toString(36)}`;
    await execute(
      `INSERT INTO collections (id, slug, name, tagline, description, image, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
      [id, slug, name.trim(), tagline.trim(), description.trim(), image.trim()]
    );
    const created = await queryOne("SELECT * FROM collections WHERE id = $1", [id]);
    res.status(201).json({ success: true, collection: created });
  } catch (error) {
    console.error("Create collection error:", error);
    res.status(500).json({ error: error.message || "Failed to create collection." });
  }
});
app.put("/api/admin/collections/:id", verifyAdmin, async (req, res) => {
  try {
    const id = String(req.params.id);
    const { name, slug: rawSlug, tagline, description, image } = req.body;
    const existing = await queryOne("SELECT * FROM collections WHERE id = $1", [id]);
    if (!existing) {
      res.status(404).json({ error: "Collection not found." });
      return;
    }
    const slug = rawSlug && rawSlug.trim() ? rawSlug.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") : existing.slug;
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
        tagline !== void 0 ? tagline.trim() : null,
        description !== void 0 ? description.trim() : null,
        image !== void 0 ? image.trim() : null,
        id
      ]
    );
    const updated = await queryOne("SELECT * FROM collections WHERE id = $1", [id]);
    res.json({ success: true, collection: updated });
  } catch (error) {
    console.error("Update collection error:", error);
    res.status(500).json({ error: error.message || "Failed to update collection." });
  }
});
app.delete("/api/admin/collections/:id", verifyAdmin, async (req, res) => {
  try {
    const id = String(req.params.id);
    await execute("DELETE FROM collections WHERE id = $1", [id]);
    res.json({ success: true, message: "Collection deleted successfully." });
  } catch (error) {
    console.error("Delete collection error:", error);
    res.status(500).json({ error: error.message || "Failed to delete collection." });
  }
});
app.get("/api/admin/stats", verifyAdmin, async (_req, res) => {
  try {
    const totalProdRow = await queryOne("SELECT COUNT(*) as count FROM products");
    const pubProdRow = await queryOne("SELECT COUNT(*) as count FROM products WHERE status = 'published'");
    const draftProdRow = await queryOne("SELECT COUNT(*) as count FROM products WHERE status != 'published'");
    const lowStockRow = await queryOne("SELECT COUNT(*) as count FROM products WHERE stock <= 3");
    const custRow = await queryOne("SELECT COUNT(*) as count FROM users WHERE role != 'admin'");
    const ordRow = await queryOne(
      `SELECT COUNT(*) as count FROM orders
       WHERE (payment_status IN ('paid', 'success') OR status IN ('confirmed', 'shipped', 'in_transit', 'out_for_delivery', 'delivered'))
         AND payment_status != 'failed'
         AND status != 'failed'
         AND status != 'pending'`
    );
    const revRow = await queryOne(
      `SELECT COALESCE(SUM(total), 0) as revenue FROM orders
       WHERE (payment_status IN ('paid', 'success') OR status IN ('confirmed', 'shipped', 'in_transit', 'out_for_delivery', 'delivered'))
         AND payment_status != 'failed'
         AND status != 'failed'
         AND status != 'pending'`
    );
    const totalProducts = Number(totalProdRow?.count || 0);
    const publishedProducts = Number(pubProdRow?.count || 0);
    const draftProducts = Number(draftProdRow?.count || 0);
    const lowStockProducts = Number(lowStockRow?.count || 0);
    const totalCustomers = Number(custRow?.count || 0);
    const totalOrders = Number(ordRow?.count || 0);
    const totalRevenue = Number(revRow?.revenue || 0);
    const recentOrderRows = await query(
      `SELECT o.id, o.order_number, o.total, o.status, o.created_at, u.name as customer_name, u.email as customer_email
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       WHERE (o.payment_status IN ('paid', 'success') OR o.status IN ('confirmed', 'shipped', 'in_transit', 'out_for_delivery', 'delivered'))
         AND o.payment_status != 'failed'
         AND o.status != 'failed'
         AND o.status != 'pending'
       ORDER BY o.created_at DESC
       LIMIT 5`
    );
    const recentOrders = recentOrderRows.map((r) => ({
      id: r.id,
      orderNumber: r.order_number,
      customer: {
        name: r.customer_name || "Store Guest",
        email: r.customer_email || "guest@example.com"
      },
      date: new Date(r.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }),
      total: Number(r.total),
      status: r.status
    }));
    const lowStockRows = await query(
      `SELECT * FROM products WHERE stock <= 3 ORDER BY stock ASC LIMIT 6`
    );
    const lowStockItems = lowStockRows.map(formatProductRow);
    res.json({
      totalProducts,
      publishedProducts,
      draftProducts,
      lowStockProducts,
      totalCustomers,
      totalOrders,
      totalRevenue,
      recentOrders,
      lowStockItems
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    res.status(500).json({ error: "Failed to fetch dashboard metrics." });
  }
});
app.get("/api/admin/orders", verifyAdmin, async (req, res) => {
  try {
    const searchParam = typeof req.query.search === "string" ? req.query.search.trim() : "";
    let querySql = `
      SELECT
        o.*,
        u.name as customer_name,
        u.email as customer_email
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE (o.payment_status IN ('paid', 'success') OR o.status IN ('confirmed', 'shipped', 'in_transit', 'out_for_delivery', 'delivered'))
        AND o.payment_status != 'failed'
        AND o.status != 'failed'
        AND o.status != 'pending'
    `;
    const params = [];
    if (searchParam) {
      params.push(`%${searchParam.toLowerCase()}%`);
      querySql += `
        AND (
          LOWER(o.order_number) LIKE $1
          OR LOWER(o.id) LIKE $1
          OR LOWER(COALESCE(u.name, '')) LIKE $1
          OR LOWER(COALESCE(u.email, '')) LIKE $1
          OR LOWER(COALESCE(o.delivery_address_json, '')) LIKE $1
          OR LOWER(COALESCE(o.items_json, '')) LIKE $1
        )
      `;
    }
    querySql += ` ORDER BY o.created_at DESC`;
    const rows = await query(querySql, params);
    const orders = rows.map((r) => {
      const parsedAddr = safeParseJson(r.delivery_address_json, {});
      return {
        id: r.id,
        orderNumber: r.order_number || r.id,
        date: r.created_at ? new Date(r.created_at).toLocaleDateString("en-IN", {
          month: "short",
          day: "numeric",
          year: "numeric"
        }) : "",
        createdAt: r.created_at,
        customer: {
          id: r.user_id || "",
          name: r.customer_name || parsedAddr.fullName || "Store Client",
          email: r.customer_email || parsedAddr.email || "",
          phone: parsedAddr.phone || r.customer_phone || r.phone || ""
        },
        items: formatHistoricalItems(r.items_json),
        subtotal: Number(r.subtotal || 0),
        discount: Number(r.discount || 0),
        total: Number(r.total || 0),
        status: r.status || "confirmed",
        paymentStatus: r.payment_status || "paid",
        paymentGateway: r.payment_gateway || "cashfree",
        couponCode: r.coupon_code || null,
        couponDiscountAmount: Number(r.coupon_discount_amount || 0),
        deliveryAddress: parsedAddr
      };
    });
    res.json(orders);
  } catch (error) {
    console.error("Admin fetch orders error:", error);
    res.status(500).json({ error: "Failed to fetch orders." });
  }
});
app.get("/api/admin/orders/:id", verifyAdmin, async (req, res) => {
  try {
    const id = String(req.params.id).trim();
    const r = await queryOne(
      `SELECT
        o.*,
        u.name as customer_name,
        u.email as customer_email
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE (o.id = $1 OR o.order_number = $1)
        AND (o.payment_status IN ('paid', 'success') OR o.status IN ('confirmed', 'shipped', 'in_transit', 'out_for_delivery', 'delivered'))
        AND o.payment_status != 'failed'
        AND o.status != 'failed'
        AND o.status != 'pending'`,
      [id]
    );
    if (!r) {
      res.status(404).json({ error: "Order not found." });
      return;
    }
    const historicalItems = await query(
      `SELECT * FROM order_items WHERE order_id = $1 ORDER BY created_at ASC`,
      [r.id]
    );
    let formattedItems = [];
    if (historicalItems.length > 0) {
      formattedItems = historicalItems.map((item) => {
        const images = safeParseJson(item.images_json, []);
        const firstValidImg = typeof item.product_image === "string" && item.product_image.trim() ? item.product_image.trim() : images[0] || "";
        return {
          id: item.id,
          productId: item.product_id,
          name: item.name,
          sku: item.sku,
          slug: item.product_slug || "",
          price: Number(item.price),
          quantity: Number(item.quantity),
          lineTotal: Number(item.price) * Number(item.quantity),
          selectedColor: item.selected_color || "",
          material: item.material || "",
          finish: item.finish || "",
          image: firstValidImg,
          images: images.length > 0 ? images : firstValidImg ? [firstValidImg] : [],
          product: {
            id: item.product_id,
            name: item.name,
            sku: item.sku,
            images: images.length > 0 ? images : firstValidImg ? [firstValidImg] : []
          }
        };
      });
    } else {
      formattedItems = formatHistoricalItems(r.items_json);
    }
    const statusHistory = await query(
      `SELECT id, order_id, old_status, new_status, changed_by, changed_at
       FROM order_status_history
       WHERE order_id = $1
       ORDER BY changed_at ASC`,
      [r.id]
    );
    const parsedAddr = safeParseJson(r.delivery_address_json, {});
    res.json({
      id: r.id,
      orderNumber: r.order_number,
      date: new Date(r.created_at).toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric",
        year: "numeric"
      }),
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      status: r.status || "pending",
      paymentStatus: r.payment_status || "pending",
      paymentGateway: r.payment_gateway || "cashfree",
      paymentOrderId: r.payment_order_id || null,
      paymentTransactionId: r.payment_transaction_id || null,
      paidAt: r.paid_at || null,
      customer: {
        id: r.user_id || "",
        name: r.customer_name || parsedAddr.fullName || "Store Client",
        email: r.customer_email || parsedAddr.email || "",
        phone: parsedAddr.phone || r.customer_phone || r.phone || ""
      },
      deliveryAddress: {
        fullName: parsedAddr.fullName || "",
        phone: parsedAddr.phone || "",
        address: parsedAddr.address || parsedAddr.street || "",
        city: parsedAddr.city || "",
        state: parsedAddr.state || "",
        pinCode: parsedAddr.pinCode || parsedAddr.postalCode || "",
        addressType: parsedAddr.addressType || "Home"
      },
      items: formattedItems,
      pricing: {
        subtotal: Number(r.subtotal),
        assemblyCharge: Number(r.assembly_charge || 0),
        convenienceFee: Number(r.convenience_fee || 0),
        gst: Number(r.gst || 0),
        couponCode: r.coupon_code || null,
        couponDiscountType: r.coupon_discount_type || null,
        couponDiscountValue: r.coupon_discount_value != null ? Number(r.coupon_discount_value) : null,
        couponDiscountAmount: Number(r.coupon_discount_amount || 0),
        discount: Number(r.discount || 0),
        total: Number(r.total)
      },
      statusHistory: statusHistory.map((sh) => ({
        id: sh.id,
        oldStatus: sh.old_status,
        newStatus: sh.new_status,
        changedBy: sh.changed_by,
        changedAt: sh.changed_at
      }))
    });
  } catch (error) {
    console.error("Admin fetch order detail error:", error);
    res.status(500).json({ error: "Failed to fetch order." });
  }
});
app.patch("/api/admin/orders/:id/status", verifyAdmin, async (req, res) => {
  try {
    const id = String(req.params.id);
    const { status } = req.body;
    const allowed = ["confirmed", "shipped", "in_transit", "out_for_delivery", "delivered"];
    const normalizedStatus = status ? String(status).toLowerCase().trim() : "";
    if (!normalizedStatus || !allowed.includes(normalizedStatus)) {
      res.status(400).json({ error: `Invalid status. Must be one of: ${allowed.join(", ")}` });
      return;
    }
    const existing = await queryOne(
      "SELECT id, status FROM orders WHERE id = $1",
      [id]
    );
    if (!existing) {
      res.status(404).json({ error: "Order not found." });
      return;
    }
    const oldStatus = existing.status || "pending";
    const now = /* @__PURE__ */ new Date();
    if (oldStatus !== normalizedStatus) {
      const historyId = `osh_${crypto3.randomUUID()}`;
      const adminName = req.user?.email || req.user?.name || "Admin";
      await execute(
        `INSERT INTO order_status_history (id, order_id, old_status, new_status, changed_by, changed_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [historyId, existing.id, oldStatus, normalizedStatus, adminName, now]
      );
    }
    await execute("UPDATE orders SET status = $1, updated_at = $2 WHERE id = $3", [
      normalizedStatus,
      now,
      existing.id
    ]);
    res.json({ success: true, status: normalizedStatus, message: "Order status updated successfully." });
  } catch (error) {
    console.error("Admin update order status error:", error);
    res.status(500).json({ error: "Failed to update order status." });
  }
});
app.post("/api/coupons/validate", async (req, res) => {
  try {
    const { code, grandTotal, subtotal = 0, assemblyCharge = 0, convenienceFee = 0, gst = 0 } = req.body;
    if (!code || typeof code !== "string" || !code.trim()) {
      res.status(400).json({ valid: false, error: "Coupon code is required." });
      return;
    }
    const normalizedCode = code.trim().toUpperCase();
    const coupon = await queryOne(
      "SELECT * FROM coupons WHERE code = $1 AND is_active = 1",
      [normalizedCode]
    );
    if (!coupon) {
      res.status(404).json({ valid: false, error: "Invalid or inactive coupon code." });
      return;
    }
    const baseTotal = grandTotal != null ? Number(grandTotal) : Math.round((Number(subtotal) + Number(assemblyCharge) + Number(convenienceFee) + Number(gst)) * 100) / 100;
    if (baseTotal <= 0) {
      res.status(400).json({ valid: false, error: "Order total must be greater than zero to apply coupon." });
      return;
    }
    const discountType = String(coupon.discount_type).toLowerCase();
    const discountValue = Number(coupon.discount_value);
    let discountAmount = 0;
    if (discountType === "percent") {
      discountAmount = Math.round(baseTotal * (discountValue / 100) * 100) / 100;
    } else {
      discountAmount = Math.min(baseTotal, discountValue);
    }
    discountAmount = Math.min(baseTotal, Math.max(0, discountAmount));
    const finalPayable = Math.max(0, Math.round((baseTotal - discountAmount) * 100) / 100);
    res.json({
      valid: true,
      code: coupon.code,
      discountType,
      discountValue,
      discountAmount,
      finalPayable,
      message: `Coupon "${coupon.code}" applied! You saved \u20B9${discountAmount.toLocaleString("en-IN")}`
    });
  } catch (error) {
    console.error("Coupon validation error:", error);
    res.status(500).json({ valid: false, error: "Failed to validate coupon." });
  }
});
app.get("/api/admin/coupons", verifyAdmin, async (_req, res) => {
  try {
    const rows = await query("SELECT * FROM coupons ORDER BY created_at DESC");
    const coupons = rows.map((c) => ({
      id: c.id,
      code: c.code,
      discountType: c.discount_type,
      discountValue: Number(c.discount_value),
      isActive: c.is_active === 1 || c.is_active === true,
      createdAt: c.created_at,
      updatedAt: c.updated_at
    }));
    res.json(coupons);
  } catch (error) {
    console.error("Admin get coupons error:", error);
    res.status(500).json({ error: "Failed to fetch coupons." });
  }
});
app.post("/api/admin/coupons", verifyAdmin, async (req, res) => {
  try {
    const { code, discountType, discountValue, isActive = true } = req.body;
    if (!code || typeof code !== "string" || !code.trim()) {
      res.status(400).json({ error: "Coupon code is required." });
      return;
    }
    const normalizedCode = code.trim().toUpperCase();
    const normType = String(discountType || "").toLowerCase().trim();
    if (normType !== "percent" && normType !== "fixed") {
      res.status(400).json({ error: 'Discount type must be either "percent" or "fixed".' });
      return;
    }
    const numValue = Number(discountValue);
    if (isNaN(numValue) || numValue <= 0) {
      res.status(400).json({ error: "Discount value must be a positive number." });
      return;
    }
    if (normType === "percent" && numValue > 100) {
      res.status(400).json({ error: "Percentage discount cannot exceed 100%." });
      return;
    }
    const existing = await queryOne("SELECT id FROM coupons WHERE code = $1", [normalizedCode]);
    if (existing) {
      res.status(400).json({ error: `Coupon code "${normalizedCode}" already exists.` });
      return;
    }
    const id = `cpn_${crypto3.randomUUID()}`;
    const activeInt = isActive ? 1 : 0;
    const now = /* @__PURE__ */ new Date();
    await execute(
      `INSERT INTO coupons (id, code, discount_type, discount_value, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id, normalizedCode, normType, numValue, activeInt, now, now]
    );
    const created = await queryOne("SELECT * FROM coupons WHERE id = $1", [id]);
    res.status(201).json({
      success: true,
      coupon: {
        id: created.id,
        code: created.code,
        discountType: created.discount_type,
        discountValue: Number(created.discount_value),
        isActive: created.is_active === 1,
        createdAt: created.created_at,
        updatedAt: created.updated_at
      }
    });
  } catch (error) {
    console.error("Admin create coupon error:", error);
    res.status(500).json({ error: "Failed to create coupon." });
  }
});
app.patch("/api/admin/coupons/:id", verifyAdmin, async (req, res) => {
  try {
    const id = String(req.params.id);
    const existing = await queryOne("SELECT * FROM coupons WHERE id = $1", [id]);
    if (!existing) {
      res.status(404).json({ error: "Coupon not found." });
      return;
    }
    const { code, discountType, discountValue, isActive } = req.body;
    let normalizedCode = existing.code;
    if (code !== void 0) {
      if (typeof code !== "string" || !code.trim()) {
        res.status(400).json({ error: "Coupon code cannot be empty." });
        return;
      }
      normalizedCode = code.trim().toUpperCase();
      const dup = await queryOne("SELECT id FROM coupons WHERE code = $1 AND id != $2", [normalizedCode, id]);
      if (dup) {
        res.status(400).json({ error: `Coupon code "${normalizedCode}" already in use.` });
        return;
      }
    }
    let normType = existing.discount_type;
    if (discountType !== void 0) {
      normType = String(discountType).toLowerCase().trim();
      if (normType !== "percent" && normType !== "fixed") {
        res.status(400).json({ error: 'Discount type must be "percent" or "fixed".' });
        return;
      }
    }
    let numVal = Number(existing.discount_value);
    if (discountValue !== void 0) {
      numVal = Number(discountValue);
      if (isNaN(numVal) || numVal <= 0) {
        res.status(400).json({ error: "Discount value must be positive." });
        return;
      }
      if (normType === "percent" && numVal > 100) {
        res.status(400).json({ error: "Percentage discount cannot exceed 100%." });
        return;
      }
    }
    let activeInt = existing.is_active;
    if (isActive !== void 0) {
      activeInt = isActive ? 1 : 0;
    }
    const now = /* @__PURE__ */ new Date();
    await execute(
      `UPDATE coupons
       SET code = $1, discount_type = $2, discount_value = $3, is_active = $4, updated_at = $5
       WHERE id = $6`,
      [normalizedCode, normType, numVal, activeInt, now, id]
    );
    const updated = await queryOne("SELECT * FROM coupons WHERE id = $1", [id]);
    res.json({
      success: true,
      coupon: {
        id: updated.id,
        code: updated.code,
        discountType: updated.discount_type,
        discountValue: Number(updated.discount_value),
        isActive: updated.is_active === 1,
        createdAt: updated.created_at,
        updatedAt: updated.updated_at
      }
    });
  } catch (error) {
    console.error("Admin update coupon error:", error);
    res.status(500).json({ error: "Failed to update coupon." });
  }
});
app.delete("/api/admin/coupons/:id", verifyAdmin, async (req, res) => {
  try {
    const id = String(req.params.id);
    const existing = await queryOne("SELECT id, code FROM coupons WHERE id = $1", [id]);
    if (!existing) {
      res.status(404).json({ error: "Coupon not found." });
      return;
    }
    await execute("DELETE FROM coupons WHERE id = $1", [id]);
    res.json({ success: true, message: "Coupon deleted successfully." });
  } catch (error) {
    console.error("Admin delete coupon error:", error);
    res.status(500).json({ error: "Failed to delete coupon." });
  }
});
app.post("/api/contact", async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;
    if (!name || typeof name !== "string" || !name.trim()) {
      res.status(400).json({ error: "Your name is required." });
      return;
    }
    if (!email || typeof email !== "string" || !email.trim() || !email.includes("@")) {
      res.status(400).json({ error: "A valid email address is required." });
      return;
    }
    if (!message || typeof message !== "string" || !message.trim()) {
      res.status(400).json({ error: "Message content is required." });
      return;
    }
    const id = `inq_${crypto3.randomUUID()}`;
    const now = /* @__PURE__ */ new Date();
    await execute(
      `INSERT INTO contact_inquiries (id, name, email, phone, subject, message, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'new', $7, $8)`,
      [
        id,
        name.trim(),
        email.trim().toLowerCase(),
        phone ? String(phone).trim() : null,
        subject ? String(subject).trim() : null,
        message.trim(),
        now,
        now
      ]
    );
    res.status(201).json({
      success: true,
      message: "Thank you for contacting GM Furniture. We have received your message and will get back to you soon."
    });
  } catch (error) {
    console.error("Contact submission error:", error);
    res.status(500).json({ error: "Failed to submit your inquiry. Please try again later." });
  }
});
app.get("/api/admin/inquiries", verifyAdmin, async (_req, res) => {
  try {
    const rows = await query("SELECT * FROM contact_inquiries ORDER BY created_at DESC");
    const inquiries = rows.map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      phone: r.phone || "",
      subject: r.subject || "General Inquiry",
      message: r.message,
      status: r.status || "new",
      createdAt: r.created_at,
      updatedAt: r.updated_at
    }));
    res.json(inquiries);
  } catch (error) {
    console.error("Admin get inquiries error:", error);
    res.status(500).json({ error: "Failed to fetch contact inquiries." });
  }
});
app.get("/api/admin/inquiries/:id", verifyAdmin, async (req, res) => {
  try {
    const id = String(req.params.id);
    const r = await queryOne("SELECT * FROM contact_inquiries WHERE id = $1", [id]);
    if (!r) {
      res.status(404).json({ error: "Inquiry not found." });
      return;
    }
    res.json({
      id: r.id,
      name: r.name,
      email: r.email,
      phone: r.phone || "",
      subject: r.subject || "General Inquiry",
      message: r.message,
      status: r.status || "new",
      createdAt: r.created_at,
      updatedAt: r.updated_at
    });
  } catch (error) {
    console.error("Admin get single inquiry error:", error);
    res.status(500).json({ error: "Failed to fetch inquiry details." });
  }
});
app.patch("/api/admin/inquiries/:id/status", verifyAdmin, async (req, res) => {
  try {
    const id = String(req.params.id);
    const { status } = req.body;
    const allowed = ["new", "read", "resolved"];
    const normalizedStatus = status ? String(status).toLowerCase().trim() : "";
    if (!normalizedStatus || !allowed.includes(normalizedStatus)) {
      res.status(400).json({ error: `Invalid status. Must be one of: ${allowed.join(", ")}` });
      return;
    }
    const existing = await queryOne("SELECT id FROM contact_inquiries WHERE id = $1", [id]);
    if (!existing) {
      res.status(404).json({ error: "Inquiry not found." });
      return;
    }
    const now = /* @__PURE__ */ new Date();
    await execute("UPDATE contact_inquiries SET status = $1, updated_at = $2 WHERE id = $3", [
      normalizedStatus,
      now,
      id
    ]);
    res.json({ success: true, status: normalizedStatus, message: "Inquiry status updated successfully." });
  } catch (error) {
    console.error("Admin update inquiry status error:", error);
    res.status(500).json({ error: "Failed to update inquiry status." });
  }
});
app.get("/api/admin/customers", verifyAdmin, async (_req, res) => {
  try {
    const users = await query(
      `SELECT id, name, email, provider, created_at
       FROM users
       WHERE role != 'admin'
       ORDER BY created_at DESC`
    );
    const customers = await Promise.all(
      users.map(async (u) => {
        const orderAgg = await queryOne(
          `SELECT COUNT(*) as total_orders, COALESCE(SUM(total), 0) as total_spent,
                  MAX(created_at) as last_order_date
           FROM orders
           WHERE user_id = $1
             AND (payment_status IN ('paid', 'success') OR status IN ('confirmed', 'shipped', 'in_transit', 'out_for_delivery', 'delivered'))
             AND payment_status != 'failed'
             AND status != 'failed'
             AND status != 'pending'`,
          [u.id]
        );
        return {
          id: u.id,
          name: u.name,
          email: u.email,
          provider: u.provider,
          joinedDate: new Date(u.created_at).toLocaleDateString("en-IN", {
            month: "short",
            day: "numeric",
            year: "numeric"
          }),
          totalOrders: Number(orderAgg?.total_orders || 0),
          totalSpent: Number(orderAgg?.total_spent || 0),
          lastOrderDate: orderAgg?.last_order_date ? new Date(orderAgg.last_order_date).toLocaleDateString("en-IN", {
            month: "short",
            day: "numeric",
            year: "numeric"
          }) : null
        };
      })
    );
    res.json(customers);
  } catch (error) {
    console.error("Admin fetch customers error:", error);
    res.status(500).json({ error: "Failed to fetch customers." });
  }
});
app.get("/api/admin/analytics", verifyAdmin, async (req, res) => {
  try {
    const { from, to, granularity } = req.query;
    const now = /* @__PURE__ */ new Date();
    const defaultTo = now.toISOString().split("T")[0];
    const past30 = new Date(now);
    past30.setDate(past30.getDate() - 29);
    const defaultFrom = past30.toISOString().split("T")[0];
    let cleanFrom = typeof from === "string" && /^\d{4}-\d{2}-\d{2}$/.test(from.trim()) ? from.trim() : defaultFrom;
    let cleanTo = typeof to === "string" && /^\d{4}-\d{2}-\d{2}$/.test(to.trim()) ? to.trim() : defaultTo;
    if (cleanFrom > cleanTo) {
      const tmp = cleanFrom;
      cleanFrom = cleanTo;
      cleanTo = tmp;
    }
    const selectedGranularity = granularity === "monthly" ? "monthly" : "daily";
    const dateParams = [cleanFrom, cleanTo];
    const kpiRow = await queryOne(
      `SELECT
        COUNT(*)                            AS total_orders,
        COALESCE(SUM(o.total), 0)          AS total_revenue,
        COALESCE(AVG(o.total), 0)          AS avg_order_value
      FROM orders o
      WHERE DATE(o.created_at AT TIME ZONE 'Asia/Kolkata') >= $1::date
        AND DATE(o.created_at AT TIME ZONE 'Asia/Kolkata') <= $2::date
        AND (o.payment_status IN ('paid', 'success') OR o.status IN ('confirmed', 'shipped', 'in_transit', 'out_for_delivery', 'delivered'))
        AND o.payment_status != 'failed'
        AND o.status != 'failed'
        AND o.status != 'pending'`,
      dateParams
    );
    const totalOrders = Number(kpiRow?.total_orders || 0);
    const totalRevenue = Number(kpiRow?.total_revenue || 0);
    const avgOrderValue = Number(kpiRow?.avg_order_value || 0);
    const custRow = await queryOne(
      "SELECT COUNT(*) as c FROM users WHERE role != 'admin'"
    );
    const totalCustomers = Number(custRow?.c || 0);
    const repeatRow = await queryOne(
      `SELECT
        COUNT(CASE WHEN order_count > 1 THEN 1 END) AS repeat_customers,
        COUNT(*) AS customers_with_orders
      FROM (
        SELECT user_id, COUNT(*) AS order_count
        FROM orders
        WHERE user_id IS NOT NULL
          AND (payment_status IN ('paid', 'success') OR status IN ('confirmed', 'shipped', 'in_transit', 'out_for_delivery', 'delivered'))
          AND payment_status != 'failed'
          AND status != 'failed'
          AND status != 'pending'
        GROUP BY user_id
      ) sub`
    );
    const custWithOrders = Number(repeatRow?.customers_with_orders || 0);
    const repCust = Number(repeatRow?.repeat_customers || 0);
    const repeatRatio = custWithOrders > 0 ? Math.round(repCust / custWithOrders * 100) : 0;
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const timeSeries = [];
    if (selectedGranularity === "monthly") {
      const monthlyRows = await query(
        `SELECT
          TO_CHAR(o.created_at AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM') AS month_key,
          COUNT(*) AS orders,
          COALESCE(SUM(o.total), 0) AS revenue,
          COALESCE(AVG(o.total), 0) AS avg_order_value
        FROM orders o
        WHERE DATE(o.created_at AT TIME ZONE 'Asia/Kolkata') >= $1::date
          AND DATE(o.created_at AT TIME ZONE 'Asia/Kolkata') <= $2::date
          AND (o.payment_status IN ('paid', 'success') OR o.status IN ('confirmed', 'shipped', 'in_transit', 'out_for_delivery', 'delivered'))
          AND o.payment_status != 'failed'
          AND o.status != 'failed'
          AND o.status != 'pending'
        GROUP BY month_key
        ORDER BY month_key ASC`,
        dateParams
      );
      const rowMap = /* @__PURE__ */ new Map();
      for (const r of monthlyRows) {
        rowMap.set(r.month_key, r);
      }
      const startMonth = /* @__PURE__ */ new Date(cleanFrom + "T00:00:00Z");
      const endMonth = /* @__PURE__ */ new Date(cleanTo + "T00:00:00Z");
      startMonth.setUTCDate(1);
      endMonth.setUTCDate(1);
      const curr = new Date(startMonth);
      while (curr <= endMonth) {
        const yyyy = curr.getUTCFullYear();
        const mm = String(curr.getUTCMonth() + 1).padStart(2, "0");
        const monthKey = `${yyyy}-${mm}`;
        const label = `${monthNames[curr.getUTCMonth()]} ${yyyy}`;
        const found = rowMap.get(monthKey);
        timeSeries.push({
          date: monthKey,
          label,
          formattedDate: label,
          revenue: found ? Number(found.revenue) : 0,
          orders: found ? Number(found.orders) : 0,
          avgOrderValue: found ? Math.round(Number(found.avg_order_value)) : 0
        });
        curr.setUTCMonth(curr.getUTCMonth() + 1);
      }
    } else {
      const dailyRows = await query(
        `SELECT
          TO_CHAR(o.created_at AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD') AS day_key,
          COUNT(*) AS orders,
          COALESCE(SUM(o.total), 0) AS revenue,
          COALESCE(AVG(o.total), 0) AS avg_order_value
        FROM orders o
        WHERE DATE(o.created_at AT TIME ZONE 'Asia/Kolkata') >= $1::date
          AND DATE(o.created_at AT TIME ZONE 'Asia/Kolkata') <= $2::date
          AND (o.payment_status IN ('paid', 'success') OR o.status IN ('confirmed', 'shipped', 'in_transit', 'out_for_delivery', 'delivered'))
          AND o.payment_status != 'failed'
          AND o.status != 'failed'
          AND o.status != 'pending'
        GROUP BY day_key
        ORDER BY day_key ASC`,
        dateParams
      );
      const rowMap = /* @__PURE__ */ new Map();
      for (const r of dailyRows) {
        rowMap.set(r.day_key, r);
      }
      const curr = /* @__PURE__ */ new Date(cleanFrom + "T00:00:00Z");
      const end = /* @__PURE__ */ new Date(cleanTo + "T00:00:00Z");
      while (curr <= end) {
        const yyyy = curr.getUTCFullYear();
        const mm = String(curr.getUTCMonth() + 1).padStart(2, "0");
        const dd = String(curr.getUTCDate()).padStart(2, "0");
        const dateKey = `${yyyy}-${mm}-${dd}`;
        const label = `${dd} ${monthNames[curr.getUTCMonth()]}`;
        const formattedDate = `${dd} ${monthNames[curr.getUTCMonth()]} ${yyyy}`;
        const found = rowMap.get(dateKey);
        timeSeries.push({
          date: dateKey,
          label,
          formattedDate,
          revenue: found ? Number(found.revenue) : 0,
          orders: found ? Number(found.orders) : 0,
          avgOrderValue: found ? Math.round(Number(found.avg_order_value)) : 0
        });
        curr.setUTCDate(curr.getUTCDate() + 1);
      }
    }
    const allOrders = await query(
      `SELECT o.items_json, o.total
       FROM orders o
       WHERE DATE(o.created_at AT TIME ZONE 'Asia/Kolkata') >= $1::date
         AND DATE(o.created_at AT TIME ZONE 'Asia/Kolkata') <= $2::date
         AND (o.payment_status IN ('paid', 'success') OR o.status IN ('confirmed', 'shipped', 'in_transit', 'out_for_delivery', 'delivered'))
         AND o.payment_status != 'failed'
         AND o.status != 'failed'
         AND o.status != 'pending'`,
      dateParams
    );
    const categoryMap = {};
    const productMap = {};
    for (const order of allOrders) {
      const items = safeParseJson(order.items_json, []);
      for (const item of items) {
        const lineTotal = Number(item.price || item.product?.price || 0) * Number(item.quantity || 1);
        const prodId = item.productId || item.product?.id || "";
        const prodSku = item.sku || item.product?.sku || "";
        let category = "dining";
        let firstImg = "";
        if (prodId || prodSku) {
          const prod = await queryOne(
            "SELECT category, images_json FROM products WHERE id = $1 OR sku = $2",
            [prodId, prodSku]
          );
          if (prod) {
            category = prod.category || "dining";
            const imgs = safeParseJson(prod.images_json, []);
            firstImg = imgs[0] || "";
          }
        }
        categoryMap[category] = (categoryMap[category] || 0) + lineTotal;
        const key = prodId || prodSku || item.name || "product";
        if (!productMap[key]) {
          productMap[key] = {
            name: item.name || item.product?.name || "Product",
            sku: prodSku,
            image: firstImg,
            revenue: 0,
            units: 0
          };
        }
        productMap[key].revenue += lineTotal;
        productMap[key].units += Number(item.quantity || 1);
      }
    }
    const categorySales = Object.entries(categoryMap).map(([category, value]) => ({ category, value })).sort((a, b) => b.value - a.value);
    const topProducts = Object.values(productMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
    const monthlyRevenue = timeSeries.map((t) => ({
      month: t.label,
      revenue: t.revenue,
      orders: t.orders
    }));
    res.json({
      totalOrders,
      totalRevenue,
      avgOrderValue: Math.round(avgOrderValue),
      totalCustomers,
      repeatRatio,
      granularity: selectedGranularity,
      timeSeries,
      dailyMetrics: timeSeries,
      monthlyRevenue,
      categorySales,
      topProducts
    });
  } catch (error) {
    console.error("Admin analytics error:", error);
    res.status(500).json({ error: "Failed to compute analytics." });
  }
});
app.use("/api", (req, res) => {
  res.status(404).json({
    error: `API endpoint not found: ${req.method} ${req.originalUrl || req.url}`,
    path: req.originalUrl || req.url
  });
});
app.use((err, _req, res, _next) => {
  console.error("[Unhandled Server Error]", err);
  res.status(500).json({
    error: err.message || "Internal server error."
  });
});
var app_default = app;
export {
  app,
  app_default as default,
  getActiveCashfreeEnvironment,
  getCashfreeConfig,
  getPublicAppUrl
};
