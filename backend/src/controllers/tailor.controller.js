// tailor.controller.js — Оёдолчины dashboard-н API

const pool = require('../db')
const { createError } = require('../middleware/errorHandler')

// Зөвшөөрөгдсөн статус шилжилт (DB lowercase ENUM-тай таарна)
const ALLOWED_TRANSITIONS = {
  submitted:     ['accepted', 'rejected'],
  deposit_paid:  ['in_production'],
  in_production: ['ready'],
  ready:         ['shipped'],
}

// ─── GET /api/tailor/stats ───────────────────────────────────────────────────
const getStats = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'submitted')                                                           AS new_orders,
         COUNT(*) FILTER (WHERE status = 'in_production')                                                       AS in_production,
         COUNT(*) FILTER (WHERE status = 'ready')                                                               AS ready,
         COUNT(*) FILTER (WHERE status = 'completed'
                            AND DATE_TRUNC('month', updated_at) = DATE_TRUNC('month', NOW()))                  AS completed_this_month
       FROM orders
       WHERE tailor_id = $1`,
      [req.user.id]
    )

    const row = result.rows[0]
    res.json({
      success: true,
      new_orders:           parseInt(row.new_orders),
      in_production:        parseInt(row.in_production),
      ready:                parseInt(row.ready),
      completed_this_month: parseInt(row.completed_this_month),
    })
  } catch (err) {
    next(err)
  }
}

// ─── GET /api/tailor/orders ──────────────────────────────────────────────────
// Query params: ?status=submitted  &limit=5
const getOrders = async (req, res, next) => {
  try {
    const { status, limit } = req.query
    const params = [req.user.id]
    const conditions = ['o.tailor_id = $1']

    if (status) {
      params.push(status)
      conditions.push(`o.status = $${params.length}`)
    }

    const limitClause = limit ? `LIMIT ${parseInt(limit)}` : ''

    const result = await pool.query(
      `SELECT
         o.id,
         o.order_number,
         o.status,
         o.total_amount,
         o.created_at,
         u.full_name  AS customer_name,
         gd.name      AS design_name
       FROM orders o
       JOIN users u        ON u.id  = o.customer_id
       JOIN order_items oi ON oi.order_id = o.id
       JOIN garment_designs gd ON gd.id = oi.design_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY o.created_at DESC
       ${limitClause}`,
      params
    )

    res.json({ success: true, orders: result.rows })
  } catch (err) {
    next(err)
  }
}

// ─── GET /api/tailor/orders/:id ──────────────────────────────────────────────
const getOrderById = async (req, res, next) => {
  try {
    const orderResult = await pool.query(
      `SELECT
         o.id,
         o.order_number,
         o.status,
         o.total_amount,
         o.created_at,
         u.full_name  AS customer_name,
         u.phone      AS customer_phone,
         u.email      AS customer_email,
         gd.name      AS design_name,
         gc.name      AS design_category
       FROM orders o
       JOIN users u           ON u.id  = o.customer_id
       JOIN order_items oi    ON oi.order_id = o.id
       JOIN garment_designs gd ON gd.id = oi.design_id
       LEFT JOIN garment_categories gc ON gc.id = gd.category_id
       WHERE o.id = $1 AND o.tailor_id = $2`,
      [req.params.id, req.user.id]
    )

    if (!orderResult.rows.length) {
      return next(createError(404, 'Захиалга олдсонгүй'))
    }

    // Хэмжээс татах
    const measResult = await pool.query(
      `SELECT sm.metric_code, sm.metric_value
       FROM measurement_snapshots ms
       JOIN snapshot_measurements sm ON sm.snapshot_id = ms.id
       WHERE ms.order_id = $1`,
      [req.params.id]
    )

    const measurements = {}
    measResult.rows.forEach(r => { measurements[r.metric_code] = r.metric_value })

    res.json({
      success: true,
      order: { ...orderResult.rows[0], measurements },
    })
  } catch (err) {
    next(err)
  }
}

// ─── PUT /api/tailor/orders/:id/status ───────────────────────────────────────
const updateOrderStatus = async (req, res, next) => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const { status: nextStatus, note } = req.body

    if (!nextStatus) {
      return next(createError(400, 'status заавал шаардлагатай'))
    }

    // Одоогийн захиалга авах
    const orderResult = await client.query(
      'SELECT id, status FROM orders WHERE id = $1 AND tailor_id = $2',
      [req.params.id, req.user.id]
    )

    if (!orderResult.rows.length) {
      return next(createError(404, 'Захиалга олдсонгүй'))
    }

    const currentStatus = orderResult.rows[0].status
    const allowed = ALLOWED_TRANSITIONS[currentStatus] ?? []

    if (!allowed.includes(nextStatus)) {
      return next(createError(400, `${currentStatus} → ${nextStatus} шилжих боломжгүй`))
    }

    // Статус шинэчлэх
    const updated = await client.query(
      `UPDATE orders
       SET status = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, order_number, status, total_amount, created_at`,
      [nextStatus, req.params.id]
    )

    // Түүх бичих
    await client.query(
      `INSERT INTO order_status_history (order_id, from_status, to_status, changed_by_id, note)
       VALUES ($1, $2, $3, $4, $5)`,
      [req.params.id, currentStatus, nextStatus, req.user.id, note || null]
    )

    await client.query('COMMIT')
    res.json({ success: true, order: updated.rows[0] })
  } catch (err) {
    await client.query('ROLLBACK')
    next(err)
  } finally {
    client.release()
  }
}

module.exports = { getStats, getOrders, getOrderById, updateOrderStatus }
