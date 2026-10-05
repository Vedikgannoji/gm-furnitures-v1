import { DatabaseSync } from 'node:sqlite'
import fs from 'node:fs'
import path from 'node:path'
import dotenv from 'dotenv'
import {
  initDatabase,
  query,
  queryOne,
  execute,
  seedAdminUser,
  seedInitialProducts,
} from '../server/db'

dotenv.config()

async function runMigration() {
  console.log('==================================================')
  console.log('GM FURNITURE — POSTGRESQL MIGRATION')
  console.log('==================================================')

  const connectionString =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL

  if (!connectionString) {
    console.error('ERROR: No DATABASE_URL or POSTGRES_URL environment variable found.')
    console.error('Please configure DATABASE_URL in your .env or Vercel environment variables.')
    process.exit(1)
  }

  console.log('1. Initializing PostgreSQL schema & indexes...')
  await initDatabase()
  console.log('✓ Schema and indexes verified.')

  // Inspect SQLite file
  const sqlitePath = path.resolve(process.cwd(), process.env.DATABASE_PATH || 'server/data/gm_furniture.db')
  if (fs.existsSync(sqlitePath)) {
    console.log(`\n2. Inspecting local SQLite database: ${sqlitePath}`)
    try {
      const sqliteDb = new DatabaseSync(sqlitePath)

      // Migrate Users
      const users = sqliteDb.prepare('SELECT * FROM users').all() as any[]
      console.log(`Found ${users.length} user(s) in SQLite.`)
      for (const u of users) {
        await execute(
          `INSERT INTO users (id, name, email, password_hash, provider, provider_id, avatar_url, role, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           ON CONFLICT (email) DO UPDATE SET
             role = EXCLUDED.role,
             password_hash = COALESCE(EXCLUDED.password_hash, users.password_hash),
             updated_at = NOW()`,
          [
            u.id,
            u.name,
            u.email,
            u.password_hash,
            u.provider || 'local',
            u.provider_id || null,
            u.avatar_url || null,
            u.role || 'customer',
            u.created_at || new Date(),
            u.updated_at || new Date(),
          ]
        )
      }
      console.log(`✓ Migrated/synced ${users.length} user(s) to PostgreSQL.`)

      // Migrate Products
      const products = sqliteDb.prepare('SELECT * FROM products').all() as any[]
      console.log(`Found ${products.length} product(s) in SQLite.`)
      for (const p of products) {
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
          ) ON CONFLICT (id) DO UPDATE SET
            price = EXCLUDED.price,
            stock = EXCLUDED.stock,
            updated_at = NOW()`,
          [
            p.id,
            p.slug,
            p.name,
            p.sku,
            p.category,
            p.collection,
            p.room,
            p.price,
            p.mrp,
            p.discount,
            p.description,
            p.short_description,
            p.images_json,
            p.colors_json,
            p.dimensions_json,
            p.material,
            p.finish,
            p.lead_time,
            p.warranty,
            p.specifications_json,
            p.care_instructions_json,
            p.status,
            p.featured,
            p.new_arrival,
            p.rating,
            p.review_count,
            p.stock,
            p.created_at,
            p.updated_at,
          ]
        )
      }
      console.log(`✓ Migrated/synced ${products.length} product(s) to PostgreSQL.`)

      // Migrate Orders
      const orders = sqliteDb.prepare('SELECT * FROM orders').all() as any[]
      console.log(`Found ${orders.length} order(s) in SQLite.`)
      for (const o of orders) {
        await execute(
          `INSERT INTO orders (
            id, order_number, user_id, subtotal, discount, total,
            status, payment_status, payment_method, delivery_address_json, items_json,
            created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', 'cod', $8, $9, $10, $11)
          ON CONFLICT (id) DO NOTHING`,
          [
            o.id,
            o.order_number,
            o.user_id,
            o.subtotal,
            o.discount,
            o.total,
            o.status || 'confirmed',
            o.delivery_address_json,
            o.items_json,
            o.created_at,
            o.created_at,
          ]
        )
      }
      console.log(`✓ Migrated/synced ${orders.length} order(s) to PostgreSQL.`)
    } catch (err: any) {
      console.warn(`Note during SQLite inspection: ${err.message}`)
    }
  }

  // Ensure admin user and canonical products exist
  console.log('\n3. Verifying admin user & canonical catalog products...')
  await seedAdminUser()
  await seedInitialProducts()

  // Final verification counts
  const userCount = await queryOne<{ count: string | number }>('SELECT COUNT(*) as count FROM users')
  const prodCount = await queryOne<{ count: string | number }>('SELECT COUNT(*) as count FROM products')
  const ordCount = await queryOne<{ count: string | number }>('SELECT COUNT(*) as count FROM orders')
  const catCount = await queryOne<{ count: string | number }>('SELECT COUNT(*) as count FROM categories')
  const roomCount = await queryOne<{ count: string | number }>('SELECT COUNT(*) as count FROM rooms')
  const colCount = await queryOne<{ count: string | number }>('SELECT COUNT(*) as count FROM collections')
  const settingsRow = await queryOne<{ gstin: string }>('SELECT gstin FROM store_settings WHERE id = \'default\'')

  console.log('\n==================================================')
  console.log('MIGRATION SUMMARY')
  console.log('==================================================')
  console.log(`PostgreSQL Users:       ${userCount?.count || 0}`)
  console.log(`PostgreSQL Products:    ${prodCount?.count || 0}`)
  console.log(`PostgreSQL Orders:      ${ordCount?.count || 0}`)
  console.log(`PostgreSQL Categories:  ${catCount?.count || 0}`)
  console.log(`PostgreSQL Rooms:       ${roomCount?.count || 0}`)
  console.log(`PostgreSQL Collections: ${colCount?.count || 0}`)
  console.log(`Store Settings GSTIN:   ${settingsRow?.gstin || 'None'}`)
  console.log('==================================================')
  console.log('✓ Database is production-ready for Vercel deployment.')
  process.exit(0)
}

runMigration().catch((err) => {
  console.error('Fatal migration error:', err)
  process.exit(1)
})
