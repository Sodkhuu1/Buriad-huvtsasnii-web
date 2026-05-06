// admin.controller.js — Системийн администраторын API

const bcrypt = require('bcryptjs')
const pool = require('../db')
const { createError } = require('../middleware/errorHandler')
const notify = require('../services/notifications')

// ─── GET /api/admin/stats ──────────────────────────────────────────────────
const getStats = async (req, res, next) => {
  try {
    const [usersRes, ordersRes, monthlyRevenueRes, statusBreakdownRes] = await Promise.all([
      pool.query(`
        SELECT
          COUNT(*)                                          AS total_users,
          COUNT(*) FILTER (WHERE role = 'customer')        AS total_customers,
          COUNT(*) FILTER (WHERE role = 'tailor')          AS total_tailors,
          COUNT(*) FILTER (WHERE status = 'blocked')       AS blocked_users
        FROM users
        WHERE role != 'admin'
      `),
      pool.query(`
        SELECT
          COUNT(*)                                                              AS total_orders,
          COUNT(*) FILTER (WHERE status IN ('submitted','under_review'))        AS pending_orders,
          COUNT(*) FILTER (WHERE status = 'in_production')                      AS active_orders,
          COUNT(*) FILTER (WHERE status IN ('delivered','completed'))           AS completed_orders,
          COALESCE(SUM(total_amount) FILTER (WHERE status IN ('delivered','completed')), 0) AS total_revenue
        FROM orders
      `),
      pool.query(`
        WITH months AS (
          SELECT generate_series(
            date_trunc('month', NOW()) - INTERVAL '11 months',
            date_trunc('month', NOW()),
            INTERVAL '1 month'
          ) AS month_start
        )
        SELECT
          TO_CHAR(months.month_start, 'MM') AS month,
          COALESCE(SUM(o.total_amount) FILTER (WHERE o.status IN ('delivered','completed')), 0) AS revenue
        FROM months
        LEFT JOIN orders o
          ON date_trunc('month', o.created_at) = months.month_start
        GROUP BY months.month_start
        ORDER BY months.month_start
      `),
      pool.query(`
        SELECT
          COUNT(*) FILTER (WHERE status IN ('delivered','completed')) AS completed,
          COUNT(*) FILTER (WHERE status IN ('accepted','deposit_paid','in_production','ready','shipped')) AS in_progress,
          COUNT(*) FILTER (WHERE status IN ('submitted','under_review','needs_clarification')) AS pending,
          COUNT(*) FILTER (WHERE status IN ('rejected','cancelled')) AS stopped
        FROM orders
      `),
    ])

    const u = usersRes.rows[0]
    const o = ordersRes.rows[0]
    const b = statusBreakdownRes.rows[0]

    res.json({
      success: true,
      total_users:       parseInt(u.total_users),
      total_customers:   parseInt(u.total_customers),
      total_tailors:     parseInt(u.total_tailors),
      blocked_users:     parseInt(u.blocked_users),
      total_orders:      parseInt(o.total_orders),
      pending_orders:    parseInt(o.pending_orders),
      active_orders:     parseInt(o.active_orders),
      completed_orders:  parseInt(o.completed_orders),
      total_revenue:     parseFloat(o.total_revenue),
      monthly_revenue:   monthlyRevenueRes.rows.map(row => ({
        month: row.month,
        revenue: parseFloat(row.revenue),
      })),
      order_status_breakdown: {
        completed:   parseInt(b.completed),
        in_progress: parseInt(b.in_progress),
        pending:     parseInt(b.pending),
        stopped:     parseInt(b.stopped),
      },
    })
  } catch (err) {
    next(err)
  }
}

// ─── GET /api/admin/users ──────────────────────────────────────────────────
const getUsers = async (req, res, next) => {
  try {
    const { role, status, limit = 100, offset = 0 } = req.query
    const conditions = ["role != 'admin'"]
    const params = []

    if (role)   { params.push(role);   conditions.push(`role = $${params.length}`) }
    if (status) { params.push(status); conditions.push(`status = $${params.length}`) }

    params.push(parseInt(limit))
    params.push(parseInt(offset))

    const result = await pool.query(
      `SELECT id, full_name, email, phone, role, status, created_at, last_login_at
       FROM users
       WHERE ${conditions.join(' AND ')}
       ORDER BY created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    )

    // Count for pagination (without limit/offset params)
    const countParams = params.slice(0, -2)
    const countRes = await pool.query(
      `SELECT COUNT(*) FROM users WHERE ${conditions.join(' AND ')}`,
      countParams
    )

    res.json({
      success: true,
      users: result.rows,
      total: parseInt(countRes.rows[0].count),
    })
  } catch (err) {
    next(err)
  }
}

// ─── GET /api/admin/recent-users ──────────────────────────────────────────
const getRecentUsers = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT id, full_name, email, role, status, created_at
       FROM users
       WHERE role != 'admin'
       ORDER BY created_at DESC
       LIMIT 8`
    )
    res.json({ success: true, users: result.rows })
  } catch (err) {
    next(err)
  }
}

// ─── PUT /api/admin/users/:id/status ──────────────────────────────────────
const updateUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params
    const { status } = req.body

    const allowed = ['active', 'inactive', 'blocked']
    if (!allowed.includes(status)) {
      return next(createError(400, 'Буруу статус. active | inactive | blocked байх ёстой'))
    }

    const result = await pool.query(
      `UPDATE users SET status = $1
       WHERE id = $2 AND role != 'admin'
       RETURNING id, full_name, status`,
      [status, id]
    )

    if (!result.rows.length) return next(createError(404, 'Хэрэглэгч олдсонгүй'))

    res.json({ success: true, user: result.rows[0] })
  } catch (err) {
    next(err)
  }
}

// ─── GET /api/admin/orders ─────────────────────────────────────────────────
const getAllOrders = async (req, res, next) => {
  try {
    const { status, limit = 100, offset = 0 } = req.query
    const conditions = []
    const params = []

    if (status) { params.push(status); conditions.push(`o.status = $${params.length}`) }

    params.push(parseInt(limit))
    params.push(parseInt(offset))
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

    const result = await pool.query(
      `SELECT
         o.id, o.order_number, o.status, o.total_amount, o.created_at,
         uc.full_name AS customer_name, uc.email AS customer_email,
         ut.id AS tailor_id,
         ut.full_name AS tailor_name,
         (SELECT gd.name
          FROM order_items oi2
          JOIN garment_designs gd ON oi2.design_id = gd.id
          WHERE oi2.order_id = o.id
          LIMIT 1) AS design_name
       FROM orders o
       JOIN   users uc ON o.customer_id = uc.id
       LEFT JOIN users ut ON o.tailor_id  = ut.id
       ${where}
       ORDER BY o.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    )

    res.json({ success: true, orders: result.rows })
  } catch (err) {
    next(err)
  }
}

const assignOrderToTailor = async (req, res, next) => {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    const { id } = req.params
    const { tailor_id } = req.body

    if (!tailor_id) {
      throw createError(400, 'Оёдолчин сонгоно уу')
    }

    const tailorResult = await client.query(
      `SELECT u.id, u.full_name
       FROM users u
       LEFT JOIN tailor_profiles tp ON tp.user_id = u.id
       WHERE u.id = $1
         AND u.role = 'tailor'
         AND u.status = 'active'
         AND COALESCE(tp.verified, false) = true`,
      [tailor_id]
    )

    if (!tailorResult.rows.length) {
      throw createError(404, 'Идэвхтэй, баталгаажсан оёдолчин олдсонгүй')
    }

    const orderResult = await client.query(
      `SELECT id, order_number, status, customer_id
       FROM orders
       WHERE id = $1
       FOR UPDATE`,
      [id]
    )

    if (!orderResult.rows.length) {
      throw createError(404, 'Захиалга олдсонгүй')
    }

    const order = orderResult.rows[0]
    const assignableStatuses = ['submitted', 'under_review', 'accepted']

    if (!assignableStatuses.includes(order.status)) {
      throw createError(400, 'Энэ төлөвтэй захиалгыг хуваарилах боломжгүй')
    }

    const updated = await client.query(
      `UPDATE orders
       SET tailor_id = $1,
           status = 'accepted',
           updated_at = NOW()
       WHERE id = $2
       RETURNING id, order_number, status, total_amount, created_at, tailor_id`,
      [tailor_id, id]
    )

    await client.query(
      `INSERT INTO order_status_history (order_id, from_status, to_status, changed_by_id, note)
       VALUES ($1, $2, 'accepted', $3, $4)`,
      [id, order.status, req.user.id, 'Админ захиалгыг баталж оёдолчинд хуваариллаа']
    )

    await notify.send(client, {
      userId: tailor_id,
      orderId: id,
      title: 'Шинэ захиалга хуваарилагдлаа',
      content: `${order.order_number} дугаартай захиалга танд хуваарилагдлаа.`,
    })

    await notify.send(client, {
      userId: order.customer_id,
      orderId: id,
      title: 'Захиалга батлагдлаа',
      content: `${order.order_number} дугаартай захиалга батлагдаж оёдолчинд хуваарилагдлаа.`,
    })

    await client.query('COMMIT')
    res.json({ success: true, order: { ...updated.rows[0], tailor_name: tailorResult.rows[0].full_name } })
  } catch (err) {
    await client.query('ROLLBACK')
    next(err)
  } finally {
    client.release()
  }
}

const rejectOrder = async (req, res, next) => {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    const { id } = req.params
    const { note } = req.body || {}

    const orderResult = await client.query(
      `SELECT id, order_number, status, customer_id, tailor_id
       FROM orders
       WHERE id = $1
       FOR UPDATE`,
      [id]
    )

    if (!orderResult.rows.length) {
      throw createError(404, 'Захиалга олдсонгүй')
    }

    const order = orderResult.rows[0]
    const rejectableStatuses = ['submitted', 'under_review', 'accepted']

    if (!rejectableStatuses.includes(order.status)) {
      throw createError(400, 'Энэ төлөвтэй захиалгыг татгалзах боломжгүй')
    }

    const updated = await client.query(
      `UPDATE orders
       SET status = 'rejected',
           tailor_id = NULL,
           updated_at = NOW()
       WHERE id = $1
       RETURNING id, order_number, status, total_amount, created_at`,
      [id]
    )

    await client.query(
      `INSERT INTO order_status_history (order_id, from_status, to_status, changed_by_id, note)
       VALUES ($1, $2, 'rejected', $3, $4)`,
      [id, order.status, req.user.id, note || 'Админ захиалгыг татгалзлаа']
    )

    await notify.send(client, {
      userId: order.customer_id,
      orderId: id,
      title: 'Захиалга татгалзагдлаа',
      content: `${order.order_number} дугаартай захиалга татгалзагдлаа.`,
    })

    if (order.tailor_id) {
      await notify.send(client, {
        userId: order.tailor_id,
        orderId: id,
        title: 'Захиалга татгалзагдлаа',
        content: `${order.order_number} дугаартай захиалга админаар татгалзагдлаа.`,
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

// ─── GET /api/admin/tailors ────────────────────────────────────────────────
const getTailors = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT
         u.id, u.full_name, u.email, u.status, u.created_at,
         tp.business_name, tp.rating, tp.verified, tp.specialization,
         (SELECT COUNT(*) FROM orders o WHERE o.tailor_id = u.id) AS order_count
       FROM users u
       LEFT JOIN tailor_profiles tp ON tp.user_id = u.id
       WHERE u.role = 'tailor'
       ORDER BY u.created_at DESC`
    )
    res.json({ success: true, tailors: result.rows })
  } catch (err) {
    next(err)
  }
}

// ─── POST /api/admin/tailors ──────────────────────────────────────────────
const createTailor = async (req, res, next) => {
  try {
    const { full_name, email, phone, password, business_name, specialization } = req.body

    if (!full_name || !email || !password) {
      return next(createError(400, 'Нэр, и-мэйл, нууц үг заавал шаардлагатай'))
    }

    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email])
    if (existing.rows.length) return next(createError(409, 'И-мэйл аль хэдийн бүртгэлтэй байна'))

    const passwordHash = await bcrypt.hash(password, 10)

    const userResult = await pool.query(
      `INSERT INTO users (full_name, email, phone, password_hash, role)
       VALUES ($1, $2, $3, $4, 'tailor')
       RETURNING id, full_name, email, phone, role, status, created_at`,
      [full_name, email, phone || null, passwordHash]
    )
    const newUser = userResult.rows[0]

    await pool.query(
      `INSERT INTO tailor_profiles (user_id, business_name, specialization)
       VALUES ($1, $2, $3)`,
      [newUser.id, business_name || null, specialization || null]
    )

    res.status(201).json({ success: true, tailor: { ...newUser, business_name, specialization, verified: false, order_count: 0 } })
  } catch (err) {
    next(err)
  }
}

// ─── PUT /api/admin/tailors/:id/verify ────────────────────────────────────
const verifyTailor = async (req, res, next) => {
  try {
    const { id } = req.params
    const { verified = true } = req.body

    const result = await pool.query(
      `UPDATE tailor_profiles SET verified = $1
       WHERE user_id = $2
       RETURNING user_id, verified`,
      [verified, id]
    )

    if (!result.rows.length) return next(createError(404, 'Оёдолчин олдсонгүй'))

    res.json({ success: true, tailor: result.rows[0] })
  } catch (err) {
    next(err)
  }
}

module.exports = {
  getStats, getUsers, getRecentUsers, updateUserStatus,
  getAllOrders, assignOrderToTailor, rejectOrder, getTailors, createTailor, verifyTailor,
}
