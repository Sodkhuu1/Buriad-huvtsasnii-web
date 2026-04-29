const fs = require('fs')
const path = require('path')
const pool = require('../src/db')

const migrationsDir = path.resolve(__dirname, '../../database/migrations')
const schemaFile = path.resolve(__dirname, '../../database/schema.sql')
const baseSchemaMarker = '000_base_schema.sql'

const runMigrations = async ({ closePool = false } = {}) => {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        filename TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)

    const schemaState = await client.query(`
      SELECT
        to_regclass('public.users') AS users_table,
        to_regclass('public.garment_designs') AS garment_designs_table
    `)

    const hasUsersTable = Boolean(schemaState.rows[0].users_table)
    const hasGarmentDesignsTable = Boolean(schemaState.rows[0].garment_designs_table)

    if (!hasUsersTable && !hasGarmentDesignsTable) {
      if (!fs.existsSync(schemaFile)) {
        throw new Error(`Schema file not found: ${schemaFile}`)
      }

      console.log('Applying base schema: database/schema.sql')
      const baseSchemaSql = fs.readFileSync(schemaFile, 'utf8')
      await client.query(baseSchemaSql)
      await client.query(
        `
          INSERT INTO schema_migrations (filename)
          VALUES ($1)
          ON CONFLICT (filename) DO NOTHING
        `,
        [baseSchemaMarker]
      )
    } else if (hasUsersTable && !hasGarmentDesignsTable) {
      throw new Error(
        'Database schema is incomplete: users exists but garment_designs is missing. Apply database/schema.sql once or add a backfill migration for the missing catalog tables.'
      )
    }

    if (!fs.existsSync(migrationsDir)) {
      throw new Error(`Migrations directory not found: ${migrationsDir}`)
    }

    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort()

    for (const file of files) {
      const alreadyApplied = await client.query(
        'SELECT 1 FROM schema_migrations WHERE filename = $1',
        [file]
      )
      if (alreadyApplied.rows.length) continue

      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8')
      console.log(`Applying migration: ${file}`)
      await client.query(sql)
      await client.query(
        'INSERT INTO schema_migrations (filename) VALUES ($1)',
        [file]
      )
    }

    await client.query('COMMIT')
    console.log('Migrations complete')
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
    if (closePool) {
      await pool.end()
    }
  }
}

if (require.main === module) {
  runMigrations({ closePool: true }).catch((err) => {
    console.error('Migration failed:', err.message)
    process.exitCode = 1
  })
}

module.exports = { runMigrations }
