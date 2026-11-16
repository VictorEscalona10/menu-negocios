import fs from 'fs'
import path from 'path'
import pg from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const { Client } = pg

async function run() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    console.error('DATABASE_URL is not set in .env')
    process.exit(1)
  }

  const client = new Client({
    connectionString,
    connectionTimeoutMillis: 15000,
  })

  await client.connect()
  console.log('Connected to database.')

  // 1. orders-realtime.sql
  const ordersSqlPath = path.join(process.cwd(), 'prisma', 'sql', 'orders-realtime.sql')
  if (fs.existsSync(ordersSqlPath)) {
    console.log('Applying prisma/sql/orders-realtime.sql...')
    const sql = fs.readFileSync(ordersSqlPath, 'utf8')
    await client.query(sql)
    console.log('orders-realtime.sql applied successfully!')
  }

  // 2. tables-realtime.sql
  const tablesSqlPath = path.join(process.cwd(), 'prisma', 'sql', 'tables-realtime.sql')
  if (fs.existsSync(tablesSqlPath)) {
    console.log('Applying prisma/sql/tables-realtime.sql...')
    const sql = fs.readFileSync(tablesSqlPath, 'utf8')
    await client.query(sql)
    console.log('tables-realtime.sql applied successfully!')
  }

  // 3. advanced-customization-rls.sql
  const advRlsPath = path.join(process.cwd(), 'prisma', 'sql', 'advanced-customization-rls.sql')
  if (fs.existsSync(advRlsPath)) {
    console.log('Applying prisma/sql/advanced-customization-rls.sql...')
    try {
      const sql = fs.readFileSync(advRlsPath, 'utf8')
      await client.query(sql)
      console.log('advanced-customization-rls.sql applied successfully!')
    } catch (e) {
      console.warn('advanced-customization-rls warning:', e.message)
    }
  }

  // 4. models-3d-bucket.sql
  const models3dPath = path.join(process.cwd(), 'prisma', 'sql', 'models-3d-bucket.sql')
  if (fs.existsSync(models3dPath)) {
    console.log('Applying prisma/sql/models-3d-bucket.sql...')
    try {
      const sql = fs.readFileSync(models3dPath, 'utf8')
      await client.query(sql)
      console.log('models-3d-bucket.sql applied successfully!')
    } catch (e) {
      console.warn('models-3d-bucket warning:', e.message)
    }
  }

  // 5. Check plans seeded
  const plansCheck = await client.query('SELECT COUNT(*)::int as count FROM "Plan";')
  console.log('Total plans in Plan table:', plansCheck.rows[0].count)

  await client.end()
  console.log('Database setup completed cleanly.')
}

run().catch((err) => {
  console.error('Error running setup:', err)
  process.exit(1)
})
