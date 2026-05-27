// orders.controller.js — захиалгын HTTP layer
const pool = require('../db')
const { Customer, Order, Review } = require('../models')
const { createError } = require('../middleware/errorHandler')
const notify = require('../services/notifications')

const getDesignListTitle = (items) => {
  if (!items.length) return null
  if (items.length === 1) return items[0].design_name
  return `${items[0].design_name} + ${items.length - 1}`
}

// POST /api/orders — Customer.placeOrder() ашиглана
const createOrder = async (req, res, next) => {
  try {
    const { measurements, items: rawItems, design_id, material_option_id, custom_note } = req.body

    // Customer instance үүсгэнэ — placeOrder() дуудна
    const customer = new Customer({ id: req.user.id, role: 'customer' })

    const items = Array.isArray(rawItems)
      ? rawItems
      : [{ design_id, material_option_id, quantity: 1, custom_note }]

    if (!items.length || items.some(i => !i.design_id) || !measurements) {
      return next(createError(400, 'items болон measurements шаардлагатай'))
    }

    const order = await customer.placeOrder(items, measurements)

    res.status(201).json({
      success: true,
      message: 'Захиалга амжилттай үүсгэгдлээ',
      order:   {
        ...order.toJSON(),
        item_count:  order.items.length,
        design_name: getDesignListTitle(order.items),
      },
    })
  } catch (err) {
    next(err)
  }
}

// GET /api/orders/my
const getMyOrders = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT
         o.id, o.order_number, o.status, o.total_amount, o.created_at,
         u.full_name AS tailor_name,
         COUNT(oi.id)::int AS item_count,
         STRING_AGG(gd.name, ', ' ORDER BY oi.id) AS design_name
       FROM orders o
       LEFT JOIN users u ON u.id = o.tailor_id
       LEFT JOIN order_items oi ON oi.order_id = o.id
       LEFT JOIN garment_designs gd ON gd.id = oi.design_id
       WHERE o.customer_id = $1
       GROUP BY o.id, u.full_name
       ORDER BY o.created_at DESC`,
      [req.user.id]
    )
    res.json({ success: true, orders: result.rows })
  } catch (err) {
    next(err)
  }
}

// GET /api/orders/my/:id
const getMyOrderById = async (req, res, next) => {
  try {
    const orderResult = await pool.query(
      `SELECT
         o.id, o.order_number, o.status,
         o.subtotal, o.delivery_fee, o.total_amount,
         o.expected_delivery_at, o.created_at, o.updated_at,
         u.id AS tailor_id, u.full_name AS tailor_name,
         u.phone AS tailor_phone, u.email AS tailor_email,
         tp.business_name AS tailor_business_name,
         gd.name AS design_name, gd.image_url AS design_image_url,
         gc.name AS design_category,
         oi.quantity, oi.custom_note, oi.unit_price,
         mo.material_name, mo.color AS material_color
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
    if (!orderResult.rows.length) return next(createError(404, 'Захиалга олдсонгүй'))

    const itemsResult = await pool.query(
      `SELECT oi.id, oi.quantity, oi.custom_note, oi.unit_price,
              gd.id AS design_id, gd.name AS design_name, gd.image_url AS design_image_url,
              gc.name AS design_category, mo.material_name, mo.color AS material_color
       FROM order_items oi
       JOIN garment_designs gd ON gd.id = oi.design_id
       LEFT JOIN garment_categories gc ON gc.id = gd.category_id
       LEFT JOIN material_options mo ON mo.id = oi.material_option_id
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

    const historyResult = await pool.query(
      `SELECT h.from_status, h.to_status, h.note, h.changed_at,
              u.full_name AS changed_by_name, u.role AS changed_by_role
       FROM order_status_history h
       LEFT JOIN users u ON u.id = h.changed_by_id
       WHERE h.order_id = $1 ORDER BY h.changed_at ASC`,
      [req.params.id]
    )

    const shipResult = await pool.query(
      `SELECT mode, carrier_name, tracking_code, note, status, shipped_at, delivered_at
       FROM shipments WHERE order_id = $1`,
      [req.params.id]
    )

    const reviewResult = await pool.query(
      `SELECT rating, comment, created_at FROM reviews WHERE order_id = $1`,
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
        history:     historyResult.rows,
        shipment:    shipResult.rows[0] ?? null,
        review:      reviewResult.rows[0] ?? null,
      },
    })
  } catch (err) {
    next(err)
  }
}

// PATCH /api/orders/my/:id/cancel — Order.cancel() ашиглана
const cancelOrder = async (req, res, next) => {
  try {
    const { note } = req.body || {}

    // захиалгаа олж, cancel() дуудна
    const orderRes = await pool.query(
      'SELECT * FROM orders WHERE id = $1 AND customer_id = $2',
      [req.params.id, req.user.id]
    )
    if (!orderRes.rows.length) return next(createError(404, 'Захиалга олдсонгүй'))

    const order = new Order(orderRes.rows[0])
    const updated = await order.cancel(req.user.id, note)

    res.json({ success: true, order: updated })
  } catch (err) {
    next(err)
  }
}

// PATCH /api/orders/my/:id/confirm-delivery — Order.changeStatus() ашиглана
const confirmDelivery = async (req, res, next) => {
  try {
    const orderRes = await pool.query(
      'SELECT * FROM orders WHERE id = $1 AND customer_id = $2',
      [req.params.id, req.user.id]
    )
    if (!orderRes.rows.length) return next(createError(404, 'Захиалга олдсонгүй'))

    const order = new Order(orderRes.rows[0])
    const updated = await order.changeStatus('completed', req.user.id, 'Захиалагч хүлээн авсныг баталгаажууллаа')

    // оёдолчинд мэдэгдэл
    if (orderRes.rows[0].tailor_id) {
      const client = await pool.connect()
      try {
        await notify.send(client, {
          userId:  orderRes.rows[0].tailor_id,
          orderId: req.params.id,
          title:   'Захиалга дууслаа',
          content: `${orderRes.rows[0].order_number} захиалгыг захиалагч хүлээн авлаа.`,
        })
      } finally { client.release() }
    }

    res.json({ success: true, order: updated })
  } catch (err) {
    next(err)
  }
}

// POST /api/orders/my/:id/review — Customer.leaveReview() ашиглана
const createReview = async (req, res, next) => {
  try {
    const { rating, comment } = req.body

    // Customer instance — leaveReview() дуудна
    const customer = new Customer({ id: req.user.id, role: 'customer' })
    const review = await customer.leaveReview(req.params.id, { rating, comment })

    res.status(201).json({ success: true, review })
  } catch (err) {
    next(err)
  }
}

module.exports = { createOrder, getMyOrders, getMyOrderById, cancelOrder, confirmDelivery, createReview }
