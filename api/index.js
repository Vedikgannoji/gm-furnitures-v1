// server/app.ts
import express from "express";
import cors from "cors";
import dotenv3 from "dotenv";
import crypto2 from "node:crypto";

// server/db.ts
import pg from "pg";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import dotenv from "dotenv";

// src/data/canonicalProducts.ts
var CANONICAL_PRODUCTS = [
  {
    id: "gm-prod-04",
    slug: "atelier-solid-walnut-dining-table",
    name: "Atelier Solid Walnut Dining Table",
    sku: "GM-DIN-004",
    category: "dining",
    collection: "considered-classics",
    room: "dining-room",
    price: 195e3,
    mrp: 23e4,
    discount: 15,
    description: "An expansive centerpiece benchcrafted from wide-plank American black walnut. The chamfered perimeter and tapered trestle base offer generous legroom for eight to ten guests.",
    shortDescription: "Solid American black walnut 8-seater dining table.",
    images: [
      "https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1544457070-4cd773b4d71e?auto=format&fit=crop&w=1200&q=80"
    ],
    colors: [
      { name: "Natural American Walnut", hex: "#533B2B" },
      { name: "Ebonized Dark Walnut", hex: "#222222" }
    ],
    dimensions: {
      width: "240 cm",
      depth: "100 cm",
      height: "75 cm",
      weight: "78 kg"
    },
    material: "FSC-Certified American Black Walnut",
    finish: "Natural Matte Hardwax Oil",
    leadTime: "2-3 Weeks White-Glove Installation",
    warranty: "10-Year Framework Structural Warranty",
    specifications: [
      { label: "Timber Origin", value: "Sustainably Managed Appalachian Hardwoods" },
      { label: "Joinery Type", value: "Mortise & Tenon with Through-Dowels" },
      { label: "Seating Capacity", value: "8-10 Guests" },
      { label: "Finish System", value: "Zero-VOC Food-Safe Plant Wax" }
    ],
    careInstructions: [
      "Wipe down with a damp lint-free cotton cloth.",
      "Avoid placing hot pans directly without trivets.",
      "Re-apply natural hardwax oil annually to maintain rich patina."
    ],
    status: "published",
    tags: ["Dining Table", "Walnut", "Solid Wood", "Dining"],
    featured: true,
    newArrival: false,
    rating: 4.9,
    reviewCount: 18,
    stock: 8,
    stockStatus: "in_stock"
  },
  {
    id: "gm-prod-14",
    slug: "column-marble-dining-table",
    name: "Column Round Carrara Marble Dining Table",
    sku: "GM-DIN-014",
    category: "dining",
    collection: "architectural-series",
    room: "dining-room",
    price: 188e3,
    mrp: 22e4,
    discount: 15,
    description: "A majestic 140cm diameter round dining table highlighting a seamless honed Italian Carrara marble disc anchored atop a monolithic cast architectural ribbed concrete base.",
    shortDescription: "140cm round Carrara marble tabletop on ribbed fluted pedestal.",
    images: [
      "https://images.unsplash.com/photo-1544457070-4cd773b4d71e?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=1200&q=80"
    ],
    colors: [
      { name: "White Carrara Marble", hex: "#EDEAE6" },
      { name: "Arabescato Dark Marble", hex: "#63625F" }
    ],
    dimensions: {
      width: "140 cm",
      depth: "140 cm",
      height: "75 cm",
      weight: "115 kg"
    },
    material: "Honed Carrara Marble & Cast Fluted Concrete",
    finish: "Penetrating Matte Nano-Sealant",
    leadTime: "2-3 Weeks White-Glove Installation",
    warranty: "10-Year Framework Structural Warranty",
    specifications: [
      { label: "Stone Origin", value: "Carrara Region, Tuscany, Italy" },
      { label: "Base Construction", value: "Steel-Reinforced Cast Architectural Concrete" },
      { label: "Seating Capacity", value: "4-6 Guests" },
      { label: "Stone Thickness", value: "25mm Solid Honed Slab" }
    ],
    careInstructions: [
      "Clean spills immediately to prevent marble etching.",
      "Use pH-neutral stone cleaner only.",
      "Do not use acidic cleaners or abrasive scouring pads."
    ],
    status: "published",
    tags: ["Dining Table", "Marble", "Round Table", "Carrara"],
    featured: true,
    newArrival: true,
    rating: 5,
    reviewCount: 14,
    stock: 5,
    stockStatus: "in_stock"
  },
  {
    id: "gm-prod-22",
    slug: "nordic-oak-dining-table",
    name: "Nordic Atelier Solid White Oak Dining Table",
    sku: "GM-DIN-022",
    category: "dining",
    collection: "nordic-atelier",
    room: "dining-room",
    price: 172e3,
    mrp: 205e3,
    discount: 16,
    description: "Minimalist Nordic dining table sculpted from European white oak with soft radius pillowed edges and concealed mortise-and-tenon structural framing.",
    shortDescription: "Solid European white oak 6-8 seater architectural dining table.",
    images: [
      "https://images.unsplash.com/photo-1577140917170-285929fb55b7?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=1200&q=80"
    ],
    colors: [
      { name: "White-Pigmented Oak", hex: "#E2D7C5" },
      { name: "Smoked Grey Oak", hex: "#686055" }
    ],
    dimensions: {
      width: "210 cm",
      depth: "95 cm",
      height: "75 cm",
      weight: "64 kg"
    },
    material: "Solid European White Oak",
    finish: "White-Pigmented Matte Hardwax Oil",
    leadTime: "2-3 Weeks White-Glove Installation",
    warranty: "10-Year Framework Structural Warranty",
    specifications: [
      { label: "Timber Origin", value: "FSC-Certified French White Oak" },
      { label: "Edge Profile", value: "Soft Bullnose Radius" },
      { label: "Seating Capacity", value: "6-8 Guests" },
      { label: "Eco Certification", value: "FSC 100% Verified Chain of Custody" }
    ],
    careInstructions: [
      "Dust with dry microfiber cloth.",
      "Protect surface from prolonged moisture exposure."
    ],
    status: "published",
    tags: ["Dining Table", "Oak", "White Oak", "Minimalist"],
    featured: true,
    newArrival: false,
    rating: 4.9,
    reviewCount: 11,
    stock: 7,
    stockStatus: "in_stock"
  },
  {
    id: "gm-prod-23",
    slug: "monolith-travertine-dining-table",
    name: "Monolith Smoked Oak & Travertine Dining Table",
    sku: "GM-DIN-023",
    category: "dining",
    collection: "architectural-series",
    room: "dining-room",
    price: 215e3,
    mrp: 25e4,
    discount: 14,
    description: "A commanding monumental dining table featuring an uncurated Roman travertine slab inset into a deep smoked oak perimeter with twin monolithic pillar legs.",
    shortDescription: "Smoked oak and honed Roman travertine stone dining table.",
    images: [
      "https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1544457070-4cd773b4d71e?auto=format&fit=crop&w=1200&q=80"
    ],
    colors: [
      { name: "Smoked Oak & Travertine", hex: "#3B332B" },
      { name: "Bleached Oak & Travertine", hex: "#C7B9A5" }
    ],
    dimensions: {
      width: "260 cm",
      depth: "105 cm",
      height: "76 cm",
      weight: "130 kg"
    },
    material: "Smoked European Oak & Italian Roman Travertine",
    finish: "Zero-VOC Natural Matte Finish",
    leadTime: "3-4 Weeks White-Glove Installation",
    warranty: "10-Year Framework Structural Warranty",
    specifications: [
      { label: "Stone Origin", value: "Tivoli, Italy" },
      { label: "Timber Finish", value: "Fumed Smoked Oak" },
      { label: "Seating Capacity", value: "10-12 Guests" },
      { label: "Pedestal Construction", value: "Dual Hollow-Core Weighted Monoliths" }
    ],
    careInstructions: [
      "Wipe down with stone-safe natural cleansers.",
      "Periodically apply breathable stone impregnator."
    ],
    status: "published",
    tags: ["Dining Table", "Travertine", "Smoked Oak", "Monolith"],
    featured: false,
    newArrival: true,
    rating: 5,
    reviewCount: 9,
    stock: 4,
    stockStatus: "in_stock"
  }
];

// server/db.ts
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
function hasDatabaseUrl() {
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL || "";
  return connectionString.trim().length > 0;
}
async function testDatabaseConnection() {
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
  if (!hasDatabaseUrl()) {
    throw new Error("Database is not configured. DATABASE_URL is missing.");
  }
  const p = getPool();
  const result = await p.query(text, params);
  return { rowCount: result.rowCount || 0 };
}
var initPromise = null;
function ensureDatabaseInitialized() {
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
  `);
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
  `);
  await seedAdminUser();
  await seedInitialProducts();
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
async function seedInitialProducts() {
  const row = await queryOne(
    "SELECT COUNT(*) as count FROM products"
  );
  const count = Number(row?.count || 0);
  if (count > 0) {
    return;
  }
  console.log("[Database] Seeding initial canonical architectural dining table products...");
  for (const p of CANONICAL_PRODUCTS) {
    const now = /* @__PURE__ */ new Date();
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
        p.leadTime || "2-3 Weeks White-Glove Installation",
        p.warranty || "10-Year Framework Structural Warranty",
        JSON.stringify(p.specifications || []),
        JSON.stringify(p.careInstructions || []),
        p.status || "published",
        p.featured ? 1 : 0,
        p.newArrival ? 1 : 0,
        p.rating || 5,
        p.reviewCount || 0,
        p.stock !== void 0 ? p.stock : 10,
        now,
        now
      ]
    );
  }
  console.log(`[Database] Successfully seeded ${CANONICAL_PRODUCTS.length} canonical products.`);
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

// server/app.ts
dotenv3.config();
var app = express();
app.set("trust proxy", true);
var allowedOrigins = [
  process.env.APP_URL || "https://gmfurniture.vercel.app",
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
app.use(express.json());
app.use((req, _res, next) => {
  const originalPath = req.headers["x-matched-path"] || req.headers["x-forwarded-uri"];
  if (originalPath && originalPath.startsWith("/api") && (req.url === "/api" || req.url === "/api/" || req.url.startsWith("/api/index"))) {
    req.url = originalPath;
  } else if (!req.url.startsWith("/api")) {
    req.url = "/api" + (req.url.startsWith("/") ? req.url : "/" + req.url);
  }
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
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    sku: row.sku,
    category: row.category,
    collection: row.collection,
    room: row.room,
    price: Number(row.price),
    mrp: Number(row.mrp),
    discount: Number(row.discount || 0),
    description: row.description,
    shortDescription: row.short_description,
    images: safeParseJson(row.images_json, []),
    colors: safeParseJson(row.colors_json, []),
    dimensions: safeParseJson(row.dimensions_json, {}),
    material: row.material,
    finish: row.finish,
    leadTime: row.lead_time,
    warranty: row.warranty,
    specifications: safeParseJson(row.specifications_json, []),
    careInstructions: safeParseJson(row.care_instructions_json, []),
    status: row.status,
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
  res.json({
    status: dbTest.ok ? "ok" : "degraded",
    environment: process.env.NODE_ENV || "production",
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
  try {
    await ensureDatabaseInitialized();
    next();
  } catch (err) {
    console.error("[Database Middleware Error]", err);
    if (!hasDatabaseUrl()) {
      res.status(503).json({
        error: "Database not configured. Please set DATABASE_URL (Neon PostgreSQL) in your Vercel project environment variables."
      });
      return;
    }
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
    const userId = `usr_${crypto2.randomUUID()}`;
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
      const userId = `usr_${crypto2.randomUUID()}`;
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
    let sql = "SELECT * FROM products WHERE status = 'published'";
    const params = [];
    let pIdx = 1;
    if (featured === "true" || featured === "1") {
      sql += ` AND featured = 1`;
    }
    if (newArrival === "true" || newArrival === "1") {
      sql += ` AND new_arrival = 1`;
    }
    if (category && typeof category === "string") {
      sql += ` AND category = $${pIdx++}`;
      params.push(category);
    }
    if (room && typeof room === "string") {
      sql += ` AND room = $${pIdx++}`;
      params.push(room);
    }
    if (collection && typeof collection === "string") {
      sql += ` AND collection = $${pIdx++}`;
      params.push(collection);
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
    const slugOrId = String(req.params.slugOrId);
    const row = await queryOne(
      "SELECT * FROM products WHERE slug = $1 OR id = $2",
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
    const product = await queryOne("SELECT id FROM products WHERE id = $1", [productId]);
    if (!product) {
      res.status(404).json({ error: "Product not found." });
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
        [Number(quantity), now, existing.id]
      );
    } else {
      const cartItemId = `cart_${crypto2.randomUUID()}`;
      await execute(
        `INSERT INTO cart_items (id, user_id, product_id, quantity, selected_color, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [cartItemId, userId, productId, Number(quantity), selectedColor, now, now]
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
          const cartItemId = `cart_${crypto2.randomUUID()}`;
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
    const id = `wish_${crypto2.randomUUID()}`;
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
    const addressId = `addr_${crypto2.randomUUID()}`;
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
app.get("/api/orders", verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const rows = await query(
      `SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );
    const orders = rows.map((r) => ({
      id: r.id,
      orderNumber: r.order_number,
      subtotal: Number(r.subtotal),
      discount: Number(r.discount || 0),
      total: Number(r.total),
      status: r.status,
      paymentStatus: r.payment_status || "pending",
      paymentMethod: r.payment_method || "cod",
      deliveryAddress: safeParseJson(r.delivery_address_json, {}),
      items: safeParseJson(r.items_json, []),
      createdAt: r.created_at
    }));
    res.json(orders);
  } catch (error) {
    console.error("Fetch orders error:", error);
    res.status(500).json({ error: "Failed to fetch orders." });
  }
});
app.post("/api/orders", verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { items, subtotal, discount = 0, paymentMethod = "cod" } = req.body;
    const deliveryAddress = req.body.deliveryAddress || req.body.shippingAddress;
    const total = req.body.total || req.body.grandTotal || subtotal;
    if (!items || !Array.isArray(items) || items.length === 0 || !deliveryAddress) {
      res.status(400).json({ error: "Order must contain items and a delivery address." });
      return;
    }
    const orderId = `ord_${crypto2.randomUUID()}`;
    const orderNumber = `GM-${(/* @__PURE__ */ new Date()).getFullYear()}-${Math.floor(1e5 + Math.random() * 9e5)}`;
    const now = /* @__PURE__ */ new Date();
    await execute(
      `INSERT INTO orders (
        id, order_number, user_id, subtotal, discount, total,
        status, payment_status, payment_method, delivery_address_json, items_json,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, 'confirmed', 'pending', $7, $8, $9, $10, $11)`,
      [
        orderId,
        orderNumber,
        userId,
        Math.round(Number(subtotal)),
        Math.round(Number(discount || 0)),
        Math.round(Number(total)),
        paymentMethod,
        JSON.stringify(deliveryAddress),
        JSON.stringify(items),
        now,
        now
      ]
    );
    for (const item of items) {
      const orderItemId = `item_${crypto2.randomUUID()}`;
      const prodId = item.product?.id || item.productId || null;
      const prodName = item.product?.name || item.name || "Bespoke Furniture Piece";
      const prodSku = item.product?.sku || item.sku || "GM-SKU";
      const prodPrice = Math.round(Number(item.price || item.product?.price || 0));
      const prodQty = Math.max(1, Math.round(Number(item.quantity || 1)));
      const color = item.selectedColor || null;
      const imagesJson = JSON.stringify(item.product?.images || []);
      const specsJson = JSON.stringify(item.product?.specifications || []);
      await execute(
        `INSERT INTO order_items (
          id, order_id, product_id, name, sku, price, quantity, selected_color, images_json, specifications_json, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [orderItemId, orderId, prodId, prodName, prodSku, prodPrice, prodQty, color, imagesJson, specsJson, now]
      );
      if (prodId) {
        await execute(
          `UPDATE products
           SET stock = GREATEST(0, stock - $1), updated_at = $2
           WHERE id = $3`,
          [prodQty, now, prodId]
        );
      }
    }
    await execute("DELETE FROM cart_items WHERE user_id = $1", [userId]);
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
        leadTime || "2-4 Weeks White-Glove Delivery",
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
app.get("/api/admin/stats", verifyAdmin, async (_req, res) => {
  try {
    const totalProdRow = await queryOne("SELECT COUNT(*) as count FROM products");
    const pubProdRow = await queryOne("SELECT COUNT(*) as count FROM products WHERE status = 'published'");
    const draftProdRow = await queryOne("SELECT COUNT(*) as count FROM products WHERE status != 'published'");
    const lowStockRow = await queryOne("SELECT COUNT(*) as count FROM products WHERE stock <= 3");
    const custRow = await queryOne("SELECT COUNT(*) as count FROM users WHERE role != 'admin'");
    const ordRow = await queryOne("SELECT COUNT(*) as count FROM orders");
    const revRow = await queryOne("SELECT SUM(total) as revenue FROM orders");
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
app.get("/api/admin/orders", verifyAdmin, async (_req, res) => {
  try {
    const rows = await query(
      `SELECT
        o.id, o.order_number, o.subtotal, o.discount, o.total,
        o.status, o.payment_status, o.delivery_address_json, o.items_json, o.created_at,
        u.id as user_id, u.name as customer_name, u.email as customer_email
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC`
    );
    const orders = rows.map((r) => ({
      id: r.id,
      orderNumber: r.order_number,
      date: new Date(r.created_at).toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric",
        year: "numeric"
      }),
      createdAt: r.created_at,
      customer: {
        id: r.user_id || "",
        name: r.customer_name || "Store Client",
        email: r.customer_email || ""
      },
      items: safeParseJson(r.items_json, []),
      subtotal: Number(r.subtotal),
      discount: Number(r.discount || 0),
      total: Number(r.total),
      status: r.status,
      paymentStatus: r.payment_status || "pending",
      deliveryAddress: safeParseJson(r.delivery_address_json, {})
    }));
    res.json(orders);
  } catch (error) {
    console.error("Admin fetch orders error:", error);
    res.status(500).json({ error: "Failed to fetch orders." });
  }
});
app.get("/api/admin/orders/:id", verifyAdmin, async (req, res) => {
  try {
    const id = String(req.params.id);
    const r = await queryOne(
      `SELECT
        o.id, o.order_number, o.subtotal, o.discount, o.total,
        o.status, o.payment_status, o.delivery_address_json, o.items_json, o.created_at,
        u.id as user_id, u.name as customer_name, u.email as customer_email
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.id = $1`,
      [id]
    );
    if (!r) {
      res.status(404).json({ error: "Order not found." });
      return;
    }
    const historicalItems = await query(
      `SELECT * FROM order_items WHERE order_id = $1 ORDER BY created_at ASC`,
      [id]
    );
    const items = historicalItems.length > 0 ? historicalItems.map((item) => ({
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
        images: safeParseJson(item.images_json, [])
      }
    })) : safeParseJson(r.items_json, []);
    res.json({
      id: r.id,
      orderNumber: r.order_number,
      date: new Date(r.created_at).toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric",
        year: "numeric"
      }),
      createdAt: r.created_at,
      customer: {
        id: r.user_id || "",
        name: r.customer_name || "Store Client",
        email: r.customer_email || ""
      },
      items,
      subtotal: Number(r.subtotal),
      discount: Number(r.discount || 0),
      total: Number(r.total),
      status: r.status,
      paymentStatus: r.payment_status || "pending",
      deliveryAddress: safeParseJson(r.delivery_address_json, {})
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
    const allowed = ["confirmed", "processing", "shipped", "delivered", "cancelled"];
    if (!status || !allowed.includes(status)) {
      res.status(400).json({ error: `Invalid status. Must be one of: ${allowed.join(", ")}` });
      return;
    }
    const existing = await queryOne("SELECT id FROM orders WHERE id = $1", [id]);
    if (!existing) {
      res.status(404).json({ error: "Order not found." });
      return;
    }
    const now = /* @__PURE__ */ new Date();
    await execute("UPDATE orders SET status = $1, updated_at = $2 WHERE id = $3", [status, now, id]);
    res.json({ success: true, status });
  } catch (error) {
    console.error("Admin update order status error:", error);
    res.status(500).json({ error: "Failed to update order status." });
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
           FROM orders WHERE user_id = $1`,
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
    const { from, to } = req.query;
    let dateFilter = "";
    const params = [];
    let pIdx = 1;
    if (from) {
      dateFilter += ` AND o.created_at >= $${pIdx++}`;
      params.push(from);
    }
    if (to) {
      dateFilter += ` AND o.created_at < $${pIdx++}`;
      const toDate = new Date(to);
      toDate.setDate(toDate.getDate() + 1);
      params.push(toDate.toISOString().split("T")[0]);
    }
    const kpiRow = await queryOne(
      `SELECT
        COUNT(*)                            AS total_orders,
        COALESCE(SUM(o.total), 0)          AS total_revenue,
        COALESCE(AVG(o.total), 0)          AS avg_order_value
      FROM orders o
      WHERE 1=1 ${dateFilter}`,
      params
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
        GROUP BY user_id
      ) sub`
    );
    const custWithOrders = Number(repeatRow?.customers_with_orders || 0);
    const repCust = Number(repeatRow?.repeat_customers || 0);
    const repeatRatio = custWithOrders > 0 ? Math.round(repCust / custWithOrders * 100) : 0;
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
    );
    const allOrders = await query(
      `SELECT o.items_json, o.total FROM orders o WHERE 1=1 ${dateFilter}`,
      params
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
    res.json({
      totalOrders,
      totalRevenue,
      avgOrderValue: Math.round(avgOrderValue),
      totalCustomers,
      repeatRatio,
      monthlyRevenue: monthlyRows.map((r) => ({
        month: r.month,
        revenue: Number(r.revenue),
        orders: Number(r.orders)
      })),
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
  app_default as default
};
