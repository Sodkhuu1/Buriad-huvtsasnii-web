const fs = require('fs')
const path = require('path')
const pool = require('../src/db')

const migrationsDir = path.resolve(__dirname, '../../database/migrations')

const run = async () => {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        filename TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)

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
    console.error('Migration failed:', err.message)
    process.exitCode = 1
  } finally {
    client.release()
    await pool.end()
  }
}

run()
