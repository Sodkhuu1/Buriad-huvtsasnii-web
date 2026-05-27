// tailor.controller.js — оёдолчны dashboard
const pool = require('../db')
const { Tailor, Order } = require('../models')
const { createError } = require('../middleware/errorHandler')
const notify = require('../services/notifications')

const STATUS_NOTIFY_TEXT = {
  accepted:      { title: 'Захиалга хүлээн авагдлаа', content: 'Таны захиалгыг оёдолчин хүлээн авлаа.' },
  rejected:      { title: 'Захиалга татгалзагдлаа',   content: 'Таны захиалгыг оёдолчин татгалзлаа.' },
  in_production: { title: 'Захиалга хийгдэж эхэллээ', content: 'Таны захиалгын үйлдвэрлэл эхэллээ.' },
  ready:         { title: 'Захиалга хүргэлтэд бэлэн', content: 'Таны захиалга бэлэн болж хүргэлтийн шатанд шилжлээ.' },
  delivered:     { title: 'Захиалга хүргэгдлээ',       content: 'Таны захиалга хүргэгдсэн төлөвт орлоо.' },
}

const getDesignListTitle = (items) => {
  if (!items.length) return null
  if (items.length === 1) return items[0].design_name
  return `${items[0].design_name} + ${items.length - 1}`
}

// GET /api/tailor/stats
const getStats = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'accepted')                              AS new_orders,
         COUNT(*) FILTER (WHERE status = 'in_production')                         AS in_production,
         COUNT(*) FILTER (WHERE status IN ('delivered','completed'))               AS delivered_orders,
         COUNT(*) FILTER (
           WHERE status IN ('delivered','completed')
             AND DATE_TRUNC('month', updated_at) = DATE_TRUNC('month', NOW()))    AS delivered_this_month
       FROM orders WHERE tailor_id = $1`,
      [req.user.id]
    )
    const row = result.rows[0]
    res.json({
      success: true,
      new_orders:           parseInt(row.new_orders),
      in_production:        parseInt(row.in_production),
      delivered_orders:     parseInt(row.delivered_orders),
      delivered_this_month: parseInt(row.delivered_this_month),
    })
  } catch (err) {
    next(err)
  }
}

// GET /api/tailor/orders
const getOrders = async (req, res, next) => {
  try {
    const { status, limit } = req.query
    const params = [req.user.id]
    const conditions = ['o.tailor_id = $1']

    if (status) {
      if (status === 'accepted') {
        conditions.push("o.status IN ('accepted','deposit_paid')")
      } else if (status === 'delivered') {
        conditions.push("o.status IN ('ready','shipped','delivered','completed')")
      } else {
        params.push(status)
        conditions.push(`o.status = $${params.length}`)
      }
    }

    const limitClause = limit ? `LIMIT ${parseInt(limit)}` : ''

    const result = await pool.query(
      `SELECT o.id, o.order_number, o.status, o.total_amount, o.created_at,
              u.full_name AS customer_name,
              COUNT(oi.id)::int AS item_count,
              STRING_AGG(gd.name, ', ' ORDER BY oi.id) AS design_name
       FROM orders o
       JOIN users u ON u.id = o.customer_id
       JOIN order_items oi ON oi.order_id = o.id
       JOIN garment_designs gd ON gd.id = oi.design_id
       WHERE ${conditions.join(' AND ')}
       GROUP BY o.id, u.full_name
       ORDER BY o.created_at DESC ${limitClause}`,
      params
    )
    res.json({ success: true, orders: result.rows })
  } catch (err) {
    next(err)
  }
}

// GET /api/tailor/orders/:id
const getOrderById = async (req, res, next) => {
  try {
    const orderResult = await pool.query(
      `SELECT o.id, o.order_number, o.status, o.total_amount, o.created_at,
              u.full_name AS customer_name, u.phone AS customer_phone, u.email AS customer_email,
              gd.name AS design_name, gc.name AS design_category
       FROM orders o
       JOIN users u ON u.id = o.customer_id
       JOIN order_items oi ON oi.order_id = o.id
       JOIN garment_designs gd ON gd.id = oi.design_id
       LEFT JOIN garment_categories gc ON gc.id = gd.category_id
       WHERE o.id = $1 AND o.tailor_id = $2`,
      [req.params.id, req.user.id]
    )
    if (!orderResult.rows.length) return next(createError(404, 'Захиалга олдсонгүй'))

    const itemsResult = await pool.query(
      `SELECT oi.id, oi.quantity, oi.custom_note, oi.unit_price,
              gd.id AS design_id, gd.name AS design_name, gd.image_url AS design_image_url,
              gc.name AS design_category
       FROM order_items oi
       JOIN garment_designs gd ON gd.id = oi.design_id
       LEFT JOIN garment_categories gc ON gc.id = gd.category_id
       WHERE oi.order_id = $1 ORDER BY oi.id`,
      [req.params.id]
    )

    const measResult = await pool.query(
      `SELECT sm.metric_code, sm.metric_value
       FROM measurement_snapshots ms
       JOIN snapshot_measurements sm ON sm.snapshot_id = ms.id
       WHERE ms.order_id = $1`,
      [req.params.id]
    )
    const measurements = {}
    measResult.rows.forEach(r => { measurements[r.metric_code] = r.metric_value })

    const shipRes = await pool.query(
      `SELECT mode, carrier_name, tracking_code, note, status, shipped_at, delivered_at
       FROM shipments WHERE order_id = $1`,
      [req.params.id]
    )

    const historyRes = await pool.query(
      `SELECT h.from_status, h.to_status, h.note, h.changed_at,
              u.full_name AS changed_by_name, u.role AS changed_by_role
       FROM order_status_history h
       LEFT JOIN users u ON u.id = h.changed_by_id
       WHERE h.order_id = $1 ORDER BY h.changed_at ASC`,
      [req.params.id]
    )

    res.json({
      success: true,
      order: {
        ...orderResult.rows[0],
        design_name: getDesignListTitle(itemsResult.rows),
        item_count:  itemsResult.rows.length,
        items:       itemsResult.rows,
        measurements,
        shipment:    shipRes.rows[0] ?? null,
        history:     historyRes.rows,
      },
    })
  } catch (err) {
    next(err)
  }
}

// PUT /api/tailor/orders/:id/status — Tailor.reviewOrder() ашиглана
const updateOrderStatus = async (req, res, next) => {
  try {
    const { status: nextStatus, note } = req.body
    if (!nextStatus) return next(createError(400, 'status шаардлагатай'))

    // Tailor instance үүсгэж reviewOrder() дуудна
    const tailor = new Tailor({ id: req.user.id, role: 'tailor' })
    const updated = await tailor.reviewOrder(req.params.id, nextStatus, note)

    // delivered болвол shipments шинэчилнэ
    if (nextStatus === 'delivered') {
      await pool.query(
        `INSERT INTO shipments (order_id, mode, note, status, delivered_at)
         VALUES ($1, 'pickup', $2, 'delivered', NOW())
         ON CONFLICT (order_id) DO UPDATE
           SET status = 'delivered', delivered_at = NOW(),
               note = COALESCE(shipments.note, EXCLUDED.note)`,
        [req.params.id, note || 'Захиалгыг хүлээлгэж өгсөн']
      )
    }

    // захиалагчид мэдэгдэл
    if (STATUS_NOTIFY_TEXT[nextStatus]) {
      const cRes = await pool.query(`SELECT customer_id FROM orders WHERE id = $1`, [req.params.id])
      if (cRes.rows[0]) {
        const client = await pool.connect()
        try {
          await notify.send(client, {
            userId:  cRes.rows[0].customer_id,
            orderId: req.params.id,
            ...STATUS_NOTIFY_TEXT[nextStatus],
          })
        } finally { client.release() }
      }
    }

    res.json({ success: true, order: updated })
  } catch (err) {
    next(err)
  }
}

// POST /api/tailor/orders/:id/ship
const shipOrder = async (req, res, next) => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const { mode, carrier_name, tracking_code, note } = req.body
    if (!['pickup', 'courier'].includes(mode)) throw createError(400, "mode = 'pickup' эсвэл 'courier' байх ёстой")
    if (mode === 'courier' && (!carrier_name || !tracking_code)) throw createError(400, 'Хүргэлтийн нэр болон tracking код шаардлагатай')
    if (mode === 'pickup'  && !note) throw createError(400, 'Очиж авах нөхцөлийг бичнэ үү')

    const orderRes = await client.query(
      `SELECT o.id, o.status FROM orders o
       JOIN order_items oi ON oi.order_id = o.id
       JOIN garment_designs gd ON gd.id = oi.design_id
       WHERE o.id = $1 AND o.tailor_id = $2`,
      [req.params.id, req.user.id]
    )
    if (!orderRes.rows.length) throw createError(404, 'Захиалга олдсонгүй')
    if (orderRes.rows[0].status !== 'ready') throw createError(400, 'Зөвхөн "Бэлэн" төлөвт байгаа захиалгыг илгээнэ')

    await client.query(
      `INSERT INTO shipments (order_id, mode, carrier_name, tracking_code, note, status, shipped_at)
       VALUES ($1,$2,$3,$4,$5,'in_transit',NOW())
       ON CONFLICT (order_id) DO UPDATE
         SET mode=EXCLUDED.mode, carrier_name=EXCLUDED.carrier_name,
             tracking_code=EXCLUDED.tracking_code, note=EXCLUDED.note,
             status='in_transit', shipped_at=NOW()`,
      [req.params.id, mode, mode==='courier'?carrier_name:null, mode==='courier'?tracking_code:null, note||null]
    )

    const updated = await client.query(
      `UPDATE orders SET status='shipped', updated_at=NOW() WHERE id=$1
       RETURNING id, order_number, status, total_amount, created_at`,
      [req.params.id]
    )

    const noteHistory = mode==='pickup' ? `Очиж авах: ${note}` : `Хүргэлт: ${carrier_name} (${tracking_code})`
    await client.query(
      `INSERT INTO order_status_history (order_id, from_status, to_status, changed_by_id, note)
       VALUES ($1,'ready','shipped',$2,$3)`,
      [req.params.id, req.user.id, noteHistory]
    )

    const customerRes = await client.query(
      `SELECT customer_id, order_number FROM orders WHERE id=$1`, [req.params.id]
    )
    if (customerRes.rows[0]) {
      await notify.send(client, {
        userId:  customerRes.rows[0].customer_id,
        orderId: req.params.id,
        title:   mode==='pickup' ? 'Захиалга бэлэн — авч очно уу' : 'Захиалга хүргэлтэд гарлаа',
        content: mode==='pickup' ? `Авах нөхцөл: ${note}` : `${carrier_name}-аар илгээгдлээ. Tracking: ${tracking_code}`,
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

// GET /api/tailor/designs
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

// POST /api/tailor/designs — Tailor.publishDesign() ашиглана
const createDesign = async (req, res, next) => {
  try {
    const { name, category_id, base_price, ceremonial_use, silhouette, image_url, flat_image_url } = req.body

    // Tailor instance үүсгэж publishDesign() дуудна
    const tailor = new Tailor({ id: req.user.id, role: 'tailor' })
    const design = await tailor.publishDesign({
      name, categoryId: category_id, basePrice: base_price,
      ceremonialUse: ceremonial_use, silhouette, imageUrl: image_url, flatImageUrl: flat_image_url,
    })

    res.status(201).json({ success: true, design })
  } catch (err) {
    next(err)
  }
}

// PUT /api/tailor/designs/:id
const updateDesign = async (req, res, next) => {
  try {
    const { name, category_id, base_price, ceremonial_use, silhouette, image_url, flat_image_url, active } = req.body
    const result = await pool.query(
      `UPDATE garment_designs
       SET name=COALESCE($1,name), category_id=COALESCE($2,category_id),
           base_price=COALESCE($3,base_price), ceremonial_use=COALESCE($4,ceremonial_use),
           silhouette=COALESCE($5,silhouette), image_url=COALESCE($6,image_url),
           flat_image_url=COALESCE($7,flat_image_url), active=COALESCE($8,active)
       WHERE id=$9 AND tailor_id=$10 RETURNING *`,
      [name, category_id, base_price, ceremonial_use, silhouette, image_url, flat_image_url, active,
       req.params.id, req.user.id]
    )
    if (!result.rows.length) return next(createError(404, 'Загвар олдсонгүй'))
    res.json({ success: true, design: result.rows[0] })
  } catch (err) {
    next(err)
  }
}

// DELETE /api/tailor/designs/:id
const deleteDesign = async (req, res, next) => {
  try {
    const result = await pool.query(
      'DELETE FROM garment_designs WHERE id=$1 AND tailor_id=$2 RETURNING id',
      [req.params.id, req.user.id]
    )
    if (!result.rows.length) return next(createError(404, 'Загвар олдсонгүй'))
    res.json({ success: true })
  } catch (err) {
    next(err)
  }
}

module.exports = { getStats, getOrders, getOrderById, updateOrderStatus, shipOrder, getDesigns, createDesign, updateDesign, deleteDesign }
