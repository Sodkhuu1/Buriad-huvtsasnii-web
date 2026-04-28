// orders.controller.js
// Uses a database transaction so that if any step fails,
// NOTHING is saved — keeping data consistent.

const pool = require('../db')
const { createError } = require('../middleware/errorHandler')
const notify = require('../services/notifications')

const REQUIRED_MEASUREMENTS = {
  height:   { min: 80, max: 230, label: 'Өндөр' },
  chest:    { min: 40, max: 180, label: 'Цээж' },
  waist:    { min: 35, max: 170, label: 'Бүсэлхий' },
  hip:      { min: 40, max: 190, label: 'Ташаа' },
  sleeve:   { min: 20, max: 100, label: 'Гарын урт' },
  shoulder: { min: 20, max: 80, label: 'Мөрний өргөн' },
}

const normalizeMeasurements = (measurements) => {
  if (!measurements || typeof measurements !== 'object' || Array.isArray(measurements)) {
    throw createError(400, 'Хэмжээсийн мэдээлэл шаардлагатай')
  }

  const normalized = {}

  for (const [key, rule] of Object.entries(REQUIRED_MEASUREMENTS)) {
    const rawValue = measurements[key]
    if (rawValue === undefined || rawValue === null || rawValue === '') {
      throw createError(400, `${rule.label} хэмжээс шаардлагатай`)
    }

    const value = Number(rawValue)
    if (!Number.isFinite(value)) {
      throw createError(400, `${rule.label} зөв тоон утга байх ёстой`)
    }

    if (value < rule.min || value > rule.max) {
      throw createError(400, `${rule.label} ${rule.min}-${rule.max} см хооронд байх ёстой`)
    }

    normalized[key] = Number(value.toFixed(2))
  }

  return normalized
}

// POST /api/orders
const createOrder = async (req, res, next) => {
  // Get a dedicated client from the pool for the transaction
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    const { design_id, material_option_id, measurements, custom_note } = req.body
    const customer_id = req.user.id

    // ── Validate input ────────────────────────────────────────────────────────

    if (!design_id || !measurements) {
      throw createError(400, 'design_id and measurements are required')
    }

    const normalizedMeasurements = normalizeMeasurements(measurements)

    // ── Check design exists ───────────────────────────────────────────────────

    const designResult = await client.query(
      'SELECT id, name, base_price, tailor_id FROM garment_designs WHERE id = $1 AND active = true',
      [design_id]
    )
    if (!designResult.rows.length) {
      throw createError(404, 'Garment design not found')
    }
    const design = designResult.rows[0]
    const tailor_id = design.tailor_id

    if (!tailor_id) {
      throw createError(400, 'Энэ загварт оёдолчин тохируулагдаагүй байна')
    }

    // ── Calculate price ───────────────────────────────────────────────────────

    let extraCost = 0
    if (material_option_id) {
      const matResult = await client.query(
        'SELECT extra_cost FROM material_options WHERE id = $1 AND design_id = $2 AND available = true',
        [material_option_id, design_id]
      )
      if (!matResult.rows.length) {
        throw createError(400, 'Сонгосон материал энэ загварт хамаарахгүй эсвэл идэвхгүй байна')
      }
      extraCost = parseFloat(matResult.rows[0].extra_cost)
    }

    const unitPrice = parseFloat(design.base_price) + extraCost
    const orderNumber = `ORD-${Date.now().toString().slice(-8)}`

    // ── Create the order ──────────────────────────────────────────────────────

    const orderResult = await client.query(
      `INSERT INTO orders (order_number, customer_id, tailor_id, status, subtotal, total_amount)
       VALUES ($1, $2, $3, 'submitted', $4, $4)
       RETURNING id, order_number, status, total_amount, created_at`,
      [orderNumber, customer_id, tailor_id, unitPrice]
    )
    const order = orderResult.rows[0]

    // ── Create order item ─────────────────────────────────────────────────────

    await client.query(
      `INSERT INTO order_items (order_id, design_id, material_option_id, quantity, custom_note, unit_price)
       VALUES ($1, $2, $3, 1, $4, $5)`,
      [order.id, design_id, material_option_id || null, custom_note || null, unitPrice]
    )

    // ── Freeze measurements as a snapshot ─────────────────────────────────────
    // This is important: even if the customer later updates their measurement
    // profile, the order always remembers the measurements at time of ordering.

    const snapshotResult = await client.query(
      'INSERT INTO measurement_snapshots (order_id) VALUES ($1) RETURNING id',
      [order.id]
    )
    const snapshotId = snapshotResult.rows[0].id

    for (const [metricCode, metricValue] of Object.entries(normalizedMeasurements)) {
      await client.query(
        `INSERT INTO snapshot_measurements (snapshot_id, metric_code, metric_value)
         VALUES ($1, $2, $3)`,
        [snapshotId, metricCode, parseFloat(metricValue)]
      )
    }

    // ── Record status history ─────────────────────────────────────────────────

    await client.query(
      `INSERT INTO order_status_history (order_id, to_status, changed_by_id, note)
       VALUES ($1, 'submitted', $2, 'Захиалга үүсгэгдлээ')`,
      [order.id, customer_id]
    )

    // Oyodolchin shine zahialga avlaa gej medeglel
    await notify.send(client, {
      userId: tailor_id,
      orderId: order.id,
      title: 'Шинэ захиалга',
      content: `${order.order_number} дугаартай захиалга ирлээ.`,
    })

    await client.query('COMMIT')

    res.status(201).json({
      success: true,
      message: 'Захиалга амжилттай үүсгэгдлээ',
      order,
    })
  } catch (err) {
    await client.query('ROLLBACK')
    next(err)
  } finally {
    client.release()
  }
}

// GET /api/orders/my — get current user's orders
const getMyOrders = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT
         o.id, o.order_number, o.status, o.total_amount, o.created_at,
         u.full_name AS tailor_name,
         gd.name    AS design_name
       FROM orders o
       LEFT JOIN users u ON u.id = o.tailor_id
       LEFT JOIN order_items oi ON oi.order_id = o.id
       LEFT JOIN garment_designs gd ON gd.id = oi.design_id
       WHERE o.customer_id = $1
       ORDER BY o.created_at DESC`,
      [req.user.id]
    )

    res.json({ success: true, orders: result.rows })
  } catch (err) {
    next(err)
  }
}

// GET /api/orders/my/:id — get one of the current user's orders (detail)
const getMyOrderById = async (req, res, next) => {
  try {
    const orderResult = await pool.query(
      `SELECT
         o.id, o.order_number, o.status,
         o.subtotal, o.delivery_fee, o.total_amount,
         o.expected_delivery_at, o.created_at, o.updated_at,
         u.id         AS tailor_id,
         u.full_name  AS tailor_name,
         u.phone      AS tailor_phone,
         u.email      AS tailor_email,
         tp.business_name AS tailor_business_name,
         gd.name      AS design_name,
         gd.image_url AS design_image_url,
         gc.name      AS design_category,
         oi.quantity,
         oi.custom_note,
         oi.unit_price,
         mo.material_name,
         mo.color AS material_color
       FROM orders o
       LEFT JOIN users u ON u.id = o.tailor_id
       LEFT JOIN tailor_profiles tp ON tp.user_id = u.id
       JOIN order_items oi ON oi.order_id = o.id
       JOIN garment_designs gd ON gd.id = oi.design_id
       LEFT JOIN garment_categories gc ON gc.id = gd.category_id
       LEFT JOIN material_options mo ON mo.id = oi.material_option_id
       WHERE o.id = $1 AND o.customer_id = $2`,
      [req.params.id, req.user.id]
    )

    if (!orderResult.rows.length) {
      return next(createError(404, 'Захиалга олдсонгүй'))
    }

    const measResult = await pool.query(
      `SELECT sm.metric_code, sm.metric_value
       FROM measurement_snapshots ms
       JOIN snapshot_measurements sm ON sm.snapshot_id = ms.id
       WHERE ms.order_id = $1`,
      [req.params.id]
    )

    const measurements = {}
    measResult.rows.forEach(r => { measurements[r.metric_code] = r.metric_value })

    const historyResult = await pool.query(
      `SELECT from_status, to_status, note, changed_at
       FROM order_status_history
       WHERE order_id = $1
       ORDER BY changed_at ASC`,
      [req.params.id]
    )

    // Hurgeltiin medeellig nemed
    const shipResult = await pool.query(
      `SELECT mode, carrier_name, tracking_code, note, status,
              shipped_at, delivered_at
       FROM shipments WHERE order_id = $1`,
      [req.params.id]
    )

    // Aldartai uldeesen review baival hamtad nih avah
    const reviewResult = await pool.query(
      `SELECT rating, comment, created_at FROM reviews WHERE order_id = $1`,
      [req.params.id]
    )

    res.json({
      success: true,
      order: {
        ...orderResult.rows[0],
        measurements,
        history: historyResult.rows,
        shipment: shipResult.rows[0] ?? null,
        review: reviewResult.rows[0] ?? null,
      },
    })
  } catch (err) {
    next(err)
  }
}

// PATCH /api/orders/my/:id/cancel — хэрэглэгч өөрийн submitted захиалгаа цуцлах
const cancelOrder = async (req, res, next) => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const { note } = req.body || {}

    // Өөрийн захиалга мөн үү, одоогийн статус нь юу вэ
    const orderResult = await client.query(
      'SELECT id, status FROM orders WHERE id = $1 AND customer_id = $2',
      [req.params.id, req.user.id]
    )

    if (!orderResult.rows.length) {
      throw createError(404, 'Захиалга олдсонгүй')
    }

    const currentStatus = orderResult.rows[0].status

    // Зөвхөн оёдолчин хүлээж аваагүй байхад цуцлах боломжтой
    if (currentStatus !== 'submitted') {
      throw createError(400, 'Зөвхөн хүлээгдэж буй захиалгыг цуцлах боломжтой')
    }

    const updated = await client.query(
      `UPDATE orders
       SET status = 'cancelled', updated_at = NOW()
       WHERE id = $1
       RETURNING id, order_number, status, total_amount, created_at`,
      [req.params.id]
    )

    await client.query(
      `INSERT INTO order_status_history (order_id, from_status, to_status, changed_by_id, note)
       VALUES ($1, $2, 'cancelled', $3, $4)`,
      [req.params.id, currentStatus, req.user.id, note || 'Захиалагч цуцаллаа']
    )

    // Tailor-d medeglel — gehgu tailor_id baigaa esekhig shalga
    const tailorRes = await client.query(
      `SELECT tailor_id, order_number FROM orders WHERE id = $1`,
      [req.params.id]
    )
    if (tailorRes.rows[0]?.tailor_id) {
      await notify.send(client, {
        userId: tailorRes.rows[0].tailor_id,
        orderId: req.params.id,
        title: 'Захиалга цуцлагдлаа',
        content: `${tailorRes.rows[0].order_number} захиалгыг захиалагч цуцаллаа.`,
      })
    }

    await client.query('COMMIT')
    res.json({ success: true, order: updated.rows[0] })
  } catch (err) {
    await client.query('ROLLBACK')
    next(err)
  } finally {
    client.release()
  }
}

// PATCH /api/orders/my/:id/confirm-delivery
// Zahialagch zahialgaa hulen avlaa gej batalgaajuulna: delivered -> completed
const confirmDelivery = async (req, res, next) => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const orderResult = await client.query(
      'SELECT id, status FROM orders WHERE id = $1 AND customer_id = $2',
      [req.params.id, req.user.id]
    )
    if (!orderResult.rows.length) throw createError(404, 'Захиалга олдсонгүй')

    if (orderResult.rows[0].status !== 'delivered') {
      throw createError(400, 'Зөвхөн "Хүргэгдсэн" төлөвт байгаа захиалгыг батлах боломжтой')
    }

    const updated = await client.query(
      `UPDATE orders SET status = 'completed', updated_at = NOW()
       WHERE id = $1
       RETURNING id, order_number, status, total_amount, created_at`,
      [req.params.id]
    )

    await client.query(
      `INSERT INTO order_status_history (order_id, from_status, to_status, changed_by_id, note)
       VALUES ($1, 'delivered', 'completed', $2, 'Захиалагч хүлээн авсныг баталгаажууллаа')`,
      [req.params.id, req.user.id]
    )

    // Oyodolchind medeglel
    const tRes = await client.query(
      `SELECT tailor_id, order_number FROM orders WHERE id = $1`,
      [req.params.id]
    )
    if (tRes.rows[0]?.tailor_id) {
      await notify.send(client, {
        userId: tRes.rows[0].tailor_id,
        orderId: req.params.id,
        title: 'Захиалга дууслаа',
        content: `${tRes.rows[0].order_number} захиалгыг захиалагч хүлээн авлаа.`,
      })
    }

    await client.query('COMMIT')
    res.json({ success: true, order: updated.rows[0] })
  } catch (err) {
    await client.query('ROLLBACK')
    next(err)
  } finally {
    client.release()
  }
}

// POST /api/orders/my/:id/review
// Zovkhon completed zahialgand 1-5 od + setgegdsel ulgeenee, oyodolchni ratingiig dahin tootsno
const createReview = async (req, res, next) => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const { rating, comment } = req.body

    // Rating validation
    const ratingNum = parseInt(rating)
    if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      throw createError(400, 'Үнэлгээ 1-5 хооронд байх ёстой')
    }

    // Zahialgа uurinh esehiig + completed esehiig + tailor_id-iig avah
    const orderResult = await client.query(
      `SELECT id, status, tailor_id FROM orders WHERE id = $1 AND customer_id = $2`,
      [req.params.id, req.user.id]
    )
    if (!orderResult.rows.length) throw createError(404, 'Захиалга олдсонгүй')

    const order = orderResult.rows[0]
    if (order.status !== 'completed') {
      throw createError(400, 'Зөвхөн дууссан захиалгад үнэлгээ өгөх боломжтой')
    }
    if (!order.tailor_id) throw createError(400, 'Оёдолчинтой холбоогүй захиалга')

    // Aldartai review baival davhar uldeehgui (schema-d order_id UNIQUE)
    const existing = await client.query(
      `SELECT id FROM reviews WHERE order_id = $1`,
      [req.params.id]
    )
    if (existing.rows.length) {
      throw createError(409, 'Энэ захиалгад үнэлгээ үлдээгдсэн байна')
    }

    // Review insert (auto-approve)
    const inserted = await client.query(
      `INSERT INTO reviews (order_id, customer_id, tailor_id, rating, comment, approved)
       VALUES ($1, $2, $3, $4, $5, TRUE)
       RETURNING rating, comment, created_at`,
      [req.params.id, req.user.id, order.tailor_id, ratingNum, comment || null]
    )

    // Tailor-iin durlaj rating-iig dahin tootsoo (zovkhon approved review-uudaas)
    await client.query(
      `UPDATE tailor_profiles
       SET rating = COALESCE(
         (SELECT ROUND(AVG(rating)::numeric, 2)
          FROM reviews
          WHERE tailor_id = $1 AND approved = TRUE),
         0
       )
       WHERE user_id = $1`,
      [order.tailor_id]
    )

    // Oyodolchind medeglel — shine uneglee
    await notify.send(client, {
      userId: order.tailor_id,
      orderId: req.params.id,
      title: 'Шинэ үнэлгээ',
      content: `Захиалгад ${ratingNum}/5 одтой үнэлгээ ирлээ.`,
    })

    await client.query('COMMIT')
    res.status(201).json({ success: true, review: inserted.rows[0] })
  } catch (err) {
    await client.query('ROLLBACK')
    next(err)
  } finally {
    client.release()
  }
}

module.exports = { createOrder, getMyOrders, getMyOrderById, cancelOrder, confirmDelivery, createReview }
