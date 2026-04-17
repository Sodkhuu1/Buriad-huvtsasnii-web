// createAdmin.js — Admin хэрэглэгч нэг удаа үүсгэх script
// Ажиллуулах: node createAdmin.js

const bcrypt = require('bcryptjs')
const pool   = require('./src/db')
require('dotenv').config()

const ADMIN = {
  full_name: 'Систем Администратор',
  email:     'admin@buriad.mn',
  password:  'Admin@1234',
}

async function createAdmin() {
  const client = await pool.connect()
  try {
    // Аль хэдийн байгаа эсэхийг шалгах
    const existing = await client.query(
      'SELECT id, role FROM users WHERE email = $1',
      [ADMIN.email]
    )

    if (existing.rows.length > 0) {
      const u = existing.rows[0]
      if (u.role === 'admin') {
        console.log(`✅ Admin хэрэглэгч аль хэдийн байна: ${ADMIN.email}`)
      } else {
        // Байгаа бол role-г admin болгон шинэчлэх
        await client.query('UPDATE users SET role = $1 WHERE email = $2', ['admin', ADMIN.email])
        console.log(`✅ ${ADMIN.email} хэрэглэгчийн role-г admin болгон шинэчлэлээ`)
      }
      return
    }

    // Шинэ admin үүсгэх
    const hash = await bcrypt.hash(ADMIN.password, 10)

    const result = await client.query(
      `INSERT INTO users (full_name, email, password_hash, role, status)
       VALUES ($1, $2, $3, 'admin', 'active')
       RETURNING id, email, role`,
      [ADMIN.full_name, ADMIN.email, hash]
    )

    console.log('✅ Admin хэрэглэгч амжилттай үүслээ!')
    console.log('─────────────────────────────────')
    console.log(`   И-мэйл  : ${ADMIN.email}`)
    console.log(`   Нууц үг : ${ADMIN.password}`)
    console.log(`   ID      : ${result.rows[0].id}`)
    console.log('─────────────────────────────────')
    console.log('⚠️  Нэвтэрсний дараа нууц үгээ солино уу!')

  } catch (err) {
    console.error('❌ Алдаа:', err.message)
  } finally {
    client.release()
    await pool.end()
  }
}

createAdmin()
