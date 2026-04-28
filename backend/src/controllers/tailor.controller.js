// tailor.controller.js — Оёдолчины dashboard-н API

const pool = require('../db')
const { createError } = require('../middleware/errorHandler')
const notify = require('../services/notifications')

// Status -> medeglelin gar utga (zahialagchid harah)
const STATUS_NOTIFY_TEXT = {
  accepted:      { title: 'Захиалга батлагдлаа',     content: 'Оёдолчин таны захиалгыг хүлээн авлаа. Та урьдчилгаа төлбөрөө хийж эхэлж болно.' },
  rejected:      { title: 'Захиалга татгалзагдлаа',  content: 'Уучлаарай, оёдолчин таны захиалгыг хүлээж аваагүй.' },
  in_production: { title: 'Үйлдвэрлэлд орлоо',       content: 'Таны хувцасны үйлдвэрлэл эхэллээ.' },
  ready:         { title: 'Захиалга бэлэн',          content: 'Таны хувцас бэлэн боллоо. Удахгүй хүргэлтэд гарна.' },
  delivered:     { title: 'Хүргэгдлээ',              content: 'Таны захиалга хүргэгдсэн гэж тэмдэглэгдлээ. Хүлээн авсан бол баталгаажуулна уу.' },
}

// Zovshoorogdson status shilijill (DB lowercase ENUM-tai taarna)
// Anhaar: ready -> shipped statusiig 'shipOrder' endpoint-d shipment data-tai hamtad nih ajilluulna
const ALLOWED_TRANSITIONS = {
  submitted:     ['accepted', 'rejected'],
  deposit_paid:  ['in_production'],
  in_production: ['ready'],
  shipped:       ['delivered'],
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

    // Hurgeltiin medeellig hamtad nih avah
    const shipRes = await pool.query(
      `SELECT mode, carrier_name, tracking_code, note, status,
              shipped_at, delivered_at
       FROM shipments WHERE order_id = $1`,
      [req.params.id]
    )
    const shipment = shipRes.rows[0] ?? null

    res.json({
      success: true,
      order: { ...orderResult.rows[0], measurements, shipment },
    })
  } catch (err) {
    next(err)
  }
}

// ─── POST /api/tailor/orders/:id/ship ──────────────────────────────────────
// Захиалгыг "ready" -> "shipped" болгох + shipments mörd hadgalna
// Body: { mode: 'pickup'|'courier', carrier_name?, tracking_code?, note? }
const shipOrder = async (req, res, next) => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const { mode, carrier_name, tracking_code, note } = req.body
    if (!['pickup', 'courier'].includes(mode)) {
      throw createError(400, "mode = 'pickup' эсвэл 'courier' байх ёстой")
    }
    if (mode === 'courier' && (!carrier_name || !tracking_code)) {
      throw createError(400, 'Хүргэлтийн нэр болон tracking код шаардлагатай')
    }
    if (mode === 'pickup' && !note) {
      throw createError(400, 'Очиж авах нөхцөлийг (огноо, цаг, утас) бичнэ үү')
    }

    // Zahialga uurinh esehiig + statusiig shalgaa
    const orderRes = await client.query(
      `SELECT id, status FROM orders WHERE id = $1 AND tailor_id = $2`,
      [req.params.id, req.user.id]
    )
    if (!orderRes.rows.length) throw createError(404, 'Захиалга олдсонгүй')
    if (orderRes.rows[0].status !== 'ready') {
      throw createError(400, 'Зөвхөн "Бэлэн" төлөвт байгаа захиалгыг илгээх боломжтой')
    }

    // Shipment mor (UPSERT — аль хэдийн зурвас үүсгэсэн ч хэвээр шинэчлэгдэх боломжтой)
    await client.query(
      `INSERT INTO shipments (order_id, mode, carrier_name, tracking_code, note, status, shipped_at)
       VALUES ($1, $2, $3, $4, $5, 'in_transit', NOW())
       ON CONFLICT (order_id) DO UPDATE
         SET mode = EXCLUDED.mode,
             carrier_name = EXCLUDED.carrier_name,
             tracking_code = EXCLUDED.tracking_code,
             note = EXCLUDED.note,
             status = 'in_transit',
             shipped_at = NOW()`,
      [
        req.params.id,
        mode,
        mode === 'courier' ? carrier_name : null,
        mode === 'courier' ? tracking_code : null,
        note || null,
      ]
    )

    // Order toloviig 'shipped' bolgono
    const updated = await client.query(
      `UPDATE orders SET status = 'shipped', updated_at = NOW()
       WHERE id = $1
       RETURNING id, order_number, status, total_amount, created_at`,
      [req.params.id]
    )

    // Tuuh
    const noteForHistory = mode === 'pickup'
      ? `Очиж авах: ${note}`
      : `Хүргэлт: ${carrier_name} (${tracking_code})`

    await client.query(
      `INSERT INTO order_status_history (order_id, from_status, to_status, changed_by_id, note)
       VALUES ($1, 'ready', 'shipped', $2, $3)`,
      [req.params.id, req.user.id, noteForHistory]
    )

    // Zahialagchid medeglel — pickup esvel courier-eer ilgeegdle
    const customerRes = await client.query(
      `SELECT customer_id, order_number FROM orders WHERE id = $1`,
      [req.params.id]
    )
    if (customerRes.rows[0]) {
      await notify.send(client, {
        userId: customerRes.rows[0].customer_id,
        orderId: req.params.id,
        title: mode === 'pickup' ? 'Захиалга бэлэн — авч очно уу' : 'Захиалга хүргэлтэд гарлаа',
        content: mode === 'pickup'
          ? `Авах нөхцөл: ${note}`
          : `${carrier_name}-аар илгээгдлээ. Tracking: ${tracking_code}`,
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

    // Hereg bol shipment-iig delivered bolgoh
    if (nextStatus === 'delivered') {
      await client.query(
        `UPDATE shipments SET status = 'delivered', delivered_at = NOW()
         WHERE order_id = $1`,
        [req.params.id]
      )
    }

    // Tuuh bichih
    await client.query(
      `INSERT INTO order_status_history (order_id, from_status, to_status, changed_by_id, note)
       VALUES ($1, $2, $3, $4, $5)`,
      [req.params.id, currentStatus, nextStatus, req.user.id, note || null]
    )

    // Zahialagchid medeglel ilgeene (statusiin daguu)
    if (STATUS_NOTIFY_TEXT[nextStatus]) {
      const cRes = await client.query(
        `SELECT customer_id FROM orders WHERE id = $1`,
        [req.params.id]
      )
      if (cRes.rows[0]) {
        await notify.send(client, {
          userId: cRes.rows[0].customer_id,
          orderId: req.params.id,
          ...STATUS_NOTIFY_TEXT[nextStatus],
        })
      }
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

module.exports = { getStats, getOrders, getOrderById, updateOrderStatus, shipOrder, getDesigns, createDesign, updateDesign, deleteDesign }
