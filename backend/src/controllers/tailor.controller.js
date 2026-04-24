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
      throw createError(400, 'status заавал шаардлагатай')
    }

    // Одоогийн захиалга авах
    const orderResult = await client.query(
      'SELECT id, status FROM orders WHERE id = $1 AND tailor_id = $2',
      [req.params.id, req.user.id]
    )

    if (!orderResult.rows.length) {
      throw createError(404, 'Захиалга олдсонгүй')
    }

    const currentStatus = orderResult.rows[0].status
    const allowed = ALLOWED_TRANSITIONS[currentStatus] ?? []

    if (!allowed.includes(nextStatus)) {
      throw createError(400, `${currentStatus} → ${nextStatus} шилжих боломжгүй`)
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

// ─── GET /api/tailor/designs ─────────────────────────────────────────────────
const getDesigns = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT gd.id, gd.name, gd.ceremonial_use, gd.silhouette,
              gd.base_price, gd.image_url, gd.flat_image_url,
              gd.active, gd.created_at,
              gc.id AS category_id, gc.name AS category_name
       FROM garment_designs gd
       LEFT JOIN garment_categories gc ON gc.id = gd.category_id
       WHERE gd.tailor_id = $1
       ORDER BY gd.created_at DESC`,
      [req.user.id]
    )
    res.json({ success: true, designs: result.rows })
  } catch (err) {
    next(err)
  }
}

// ─── POST /api/tailor/designs ─────────────────────────────────────────────────
const createDesign = async (req, res, next) => {
  try {
    const { name, category_id, base_price, ceremonial_use, silhouette, image_url, flat_image_url } = req.body
    if (!name || !base_price) {
      return next(createError(400, 'Нэр болон үндсэн үнэ заавал шаардлагатай'))
    }
    const result = await pool.query(
      `INSERT INTO garment_designs
         (tailor_id, category_id, name, ceremonial_use, silhouette, base_price, image_url, flat_image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [req.user.id, category_id || null, name, ceremonial_use || null,
       silhouette || null, base_price, image_url || null, flat_image_url || null]
    )
    res.status(201).json({ success: true, design: result.rows[0] })
  } catch (err) {
    next(err)
  }
}

// ─── PUT /api/tailor/designs/:id ──────────────────────────────────────────────
const updateDesign = async (req, res, next) => {
  try {
    const { name, category_id, base_price, ceremonial_use, silhouette, image_url, flat_image_url, active } = req.body
    const result = await pool.query(
      `UPDATE garment_designs
       SET name = COALESCE($1, name),
           category_id = COALESCE($2, category_id),
           base_price = COALESCE($3, base_price),
           ceremonial_use = COALESCE($4, ceremonial_use),
           silhouette = COALESCE($5, silhouette),
           image_url = COALESCE($6, image_url),
           flat_image_url = COALESCE($7, flat_image_url),
           active = COALESCE($8, active)
       WHERE id = $9 AND tailor_id = $10
       RETURNING *`,
      [name, category_id, base_price, ceremonial_use, silhouette, image_url, flat_image_url, active,
       req.params.id, req.user.id]
    )
    if (!result.rows.length) return next(createError(404, 'Загвар олдсонгүй'))
    res.json({ success: true, design: result.rows[0] })
  } catch (err) {
    next(err)
  }
}

// ─── DELETE /api/tailor/designs/:id ───────────────────────────────────────────
const deleteDesign = async (req, res, next) => {
  try {
    const result = await pool.query(
      'DELETE FROM garment_designs WHERE id = $1 AND tailor_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    )
    if (!result.rows.length) return next(createError(404, 'Загвар олдсонгүй'))
    res.json({ success: true })
  } catch (err) {
    next(err)
  }
}

module.exports = { getStats, getOrders, getOrderById, updateOrderStatus, getDesigns, createDesign, updateDesign, deleteDesign }
