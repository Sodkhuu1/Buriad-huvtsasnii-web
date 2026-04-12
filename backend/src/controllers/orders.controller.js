// orders.controller.js
// Uses a database transaction so that if any step fails,
// NOTHING is saved — keeping data consistent.

const pool = require('../db')
const { createError } = require('../middleware/errorHandler')

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
      return next(createError(400, 'design_id and measurements are required'))
    }

    const requiredMeasurements = ['height', 'chest', 'waist', 'hip', 'sleeve', 'shoulder']
    for (const key of requiredMeasurements) {
      if (!measurements[key]) {
        return next(createError(400, `Missing measurement: ${key}`))
      }
    }

    // ── Check design exists ───────────────────────────────────────────────────

    const designResult = await client.query(
      'SELECT id, name, base_price FROM garment_designs WHERE id = $1 AND active = true',
      [design_id]
    )
    if (!designResult.rows.length) {
      return next(createError(404, 'Garment design not found'))
    }
    const design = designResult.rows[0]

    // ── Calculate price ───────────────────────────────────────────────────────

    let extraCost = 0
    if (material_option_id) {
      const matResult = await client.query(
        'SELECT extra_cost FROM material_options WHERE id = $1 AND available = true',
        [material_option_id]
      )
      if (matResult.rows.length) {
        extraCost = parseFloat(matResult.rows[0].extra_cost)
      }
    }

    const unitPrice = parseFloat(design.base_price) + extraCost
    const orderNumber = `ORD-${Date.now().toString().slice(-8)}`

    // ── Create the order ──────────────────────────────────────────────────────

    const orderResult = await client.query(
      `INSERT INTO orders (order_number, customer_id, status, subtotal, total_amount)
       VALUES ($1, $2, 'submitted', $3, $3)
       RETURNING id, order_number, status, total_amount, created_at`,
      [orderNumber, customer_id, unitPrice]
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

    for (const [metricCode, metricValue] of Object.entries(measurements)) {
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
       JOIN users u ON u.id = o.tailor_id
       JOIN order_items oi ON oi.order_id = o.id
       JOIN garment_designs gd ON gd.id = oi.design_id
       WHERE o.customer_id = $1
       ORDER BY o.created_at DESC`,
      [req.user.id]
    )

    res.json({ success: true, orders: result.rows })
  } catch (err) {
    next(err)
  }
}

module.exports = { createOrder, getMyOrders }
