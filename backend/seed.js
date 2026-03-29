// seed.js — fills the database with test data
// Run once: node seed.js

const bcrypt = require('bcryptjs')
const pool = require('./src/db')
require('dotenv').config()

async function seed() {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    console.log('🌱 Seeding database...')

    // Add image_url and avatar_url columns if they don't exist yet
    await client.query(`ALTER TABLE garment_designs  ADD COLUMN IF NOT EXISTS image_url TEXT`)
    await client.query(`ALTER TABLE tailor_profiles  ADD COLUMN IF NOT EXISTS avatar_url TEXT`)

    // ── Garment categories ──────────────────────────────────────────────────

    const catResult = await client.query(`
      INSERT INTO garment_categories (name, audience, description) VALUES
        ('Эмэгтэй хувцас',   'women',    'Эмэгтэйчүүдэд зориулсан буриад уламжлалт хувцас'),
        ('Эрэгтэй хувцас',   'men',      'Эрэгтэйчүүдэд зориулсан буриад уламжлалт хувцас'),
        ('Хүүхдийн хувцас',  'children', 'Хүүхдэд зориулсан буриад уламжлалт хувцас')
      RETURNING id, name
    `)

    const cats = {}
    catResult.rows.forEach(r => { cats[r.name] = r.id })
    console.log('✅ Garment categories created')

    // ── Garment designs ─────────────────────────────────────────────────────

    const designResult = await client.query(`
      INSERT INTO garment_designs (category_id, name, ceremonial_use, silhouette, base_price, image_url) VALUES
        ($1, 'Дэгэл',           'Баяр ёслол, гэрлэлтийн ёслол',        'A-line, урт',       280000,
         'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&auto=format&fit=crop&q=80'),
        ($1, 'Хантааз',         'Өдөр тутмын болон ёслолын хувцас',    'Богино, нягт',      180000,
         'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop&q=80'),
        ($2, 'Тэрлэг',          'Баяр ёслол, Цагаан сар',              'Шулуун, урт',       220000,
         'https://images.unsplash.com/photo-1594038984077-b46b5f9ac9bc?w=600&auto=format&fit=crop&q=80'),
        ($3, 'Хүүхдийн дэгэл', 'Баяр ёслол, Цагаан сар',              'A-line, богино',    120000,
         'https://images.unsplash.com/photo-1503944583220-79d4dd0955e5?w=600&auto=format&fit=crop&q=80')
      RETURNING id, name
    `, [cats['Эмэгтэй хувцас'], cats['Эрэгтэй хувцас'], cats['Хүүхдийн хувцас']])

    const designs = {}
    designResult.rows.forEach(r => { designs[r.name] = r.id })
    console.log('✅ Garment designs created')

    // ── Material options ────────────────────────────────────────────────────

    await client.query(`
      INSERT INTO material_options (design_id, material_name, color, extra_cost) VALUES
        ($1, 'Торго',    'Улаан',      30000),
        ($1, 'Торго',    'Цэнхэр',     30000),
        ($1, 'Даавуу',   'Хар',             0),
        ($2, 'Торго',    'Ягаан',      25000),
        ($2, 'Даавуу',   'Цагаан',          0),
        ($3, 'Торго',    'Хөх',        25000),
        ($3, 'Ноос',     'Бор',        35000),
        ($4, 'Даавуу',   'Улаан',           0),
        ($4, 'Торго',    'Шар',        20000)
    `, [designs['Дэгэл'], designs['Хантааз'], designs['Тэрлэг'], designs['Хүүхдийн дэгэл']])
    console.log('✅ Material options created')

    // ── Tailor users ────────────────────────────────────────────────────────

    const passwordHash = await bcrypt.hash('test1234', 10)

    const tailor1 = await client.query(`
      INSERT INTO users (full_name, email, phone, password_hash, role)
      VALUES ('Цэцэгмаа Батсайхан', 'tsetsegmaa@test.com', '99001122', $1, 'tailor')
      RETURNING id
    `, [passwordHash])

    const tailor2 = await client.query(`
      INSERT INTO users (full_name, email, phone, password_hash, role)
      VALUES ('Батбаяр Дорж', 'batbayar@test.com', '99003344', $1, 'tailor')
      RETURNING id
    `, [passwordHash])

    const tailor3 = await client.query(`
      INSERT INTO users (full_name, email, phone, password_hash, role)
      VALUES ('Номинчимэг Сүрэн', 'nominchimeg@test.com', '99005566', $1, 'tailor')
      RETURNING id
    `, [passwordHash])

    // ── Tailor profiles ─────────────────────────────────────────────────────

    await client.query(`
      INSERT INTO tailor_profiles
        (user_id, business_name, specialization, rating, verified, min_lead_days, max_lead_days, introduction, avatar_url)
      VALUES ($1, 'Цэцэг оёдлын газар', 'Эмэгтэй болон хүүхдийн буриад хувцас', 4.9, true, 10, 14,
        'Буриад хувцасны чиглэлээр 12 жил ажилласан туршлагатай. Торго болон ноосон материалаар мэргэшсэн.',
        'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80')
    `, [tailor1.rows[0].id])

    await client.query(`
      INSERT INTO tailor_profiles
        (user_id, business_name, specialization, rating, verified, min_lead_days, max_lead_days, introduction, avatar_url)
      VALUES ($1, 'Батбаяр дархны газар', 'Эрэгтэй буриад хувцас, тэрлэг', 4.7, true, 7, 10,
        'Уламжлалт эрэгтэй буриад хувцасанд мэргэшсэн. Хурдан хугацаанд чанарлаг ажил хийдэг.',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80')
    `, [tailor2.rows[0].id])

    await client.query(`
      INSERT INTO tailor_profiles
        (user_id, business_name, specialization, rating, verified, min_lead_days, max_lead_days, introduction, avatar_url)
      VALUES ($1, 'Номин оёдол', 'Бүх төрлийн буриад хувцас', 4.8, true, 14, 21,
        'Дархан хотод суурьтай. Уламжлалт аргаар гараар оёдог. Ёслолын хувцасанд тусгайлан мэргэшсэн.',
        'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80')
    `, [tailor3.rows[0].id])

    console.log('✅ Tailors created (email: tsetsegmaa@test.com / batbayar@test.com, password: test1234)')

    // ── Test customer ───────────────────────────────────────────────────────

    const customer = await client.query(`
      INSERT INTO users (full_name, email, phone, password_hash, role)
      VALUES ('Тест Хэрэглэгч', 'customer@test.com', '88001111', $1, 'customer')
      RETURNING id
    `, [passwordHash])

    await client.query(
      'INSERT INTO customer_profiles (user_id) VALUES ($1)',
      [customer.rows[0].id]
    )

    console.log('✅ Test customer created (email: customer@test.com, password: test1234)')

    await client.query('COMMIT')
    console.log('\n🎉 Seed complete!')
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('❌ Seed failed:', err.message)
    process.exit(1)
  } finally {
    client.release()
    pool.end()
  }
}

seed()
