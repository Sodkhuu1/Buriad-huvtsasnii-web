// payments.controller.js — QPay төлбөрийн HTTP layer
const pool = require('../db')
const { Payment } = require('../models')
const { createError } = require('../middleware/errorHandler')
const qpay = require('../services/qpay')

// POST /api/payments/orders/:id/invoice — Payment.capture() ашиглана
const createInvoice = async (req, res, next) => {
  try {
    // захиалгаа шалгана
    const orderRes = await pool.query(
      `SELECT id, order_number, status, total_amount
       FROM orders WHERE id = $1 AND customer_id = $2`,
      [req.params.id, req.user.id]
    )
    if (!orderRes.rows.length) return next(createError(404, 'Захиалга олдсонгүй'))

    const order = orderRes.rows[0]
    if (order.status !== 'accepted') {
      return next(createError(400, 'Зөвхөн оёдолчин баталсан захиалгад төлбөр хийнэ'))
    }

    // Payment instance авна эсвэл шинэ үүсгэнэ
    const payment = await Payment.createOrReuse(order.id, parseFloat(order.total_amount))

    // capture() — QPay invoice үүсгэнэ
    const invoiceData = await payment.capture()

    res.status(201).json({
      success:    true,
      payment_id: payment.id,
      qr_image:   invoiceData.qrImage,
      qr_text:    invoiceData.qrText,
      urls:       invoiceData.urls,
      is_mock:    invoiceData.isMock,
    })
  } catch (err) {
    next(err)
  }
}

// GET /api/payments/:paymentId/check — Payment.verify() ашиглана
const checkPayment = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.paymentId)

    // өөрийн захиалга мөн эсэхийг шалгана
    if (payment.customerId !== req.user.id) return next(createError(403, 'Хандах эрхгүй'))

    // verify() — QPay-д шалгаж, paid бол БД шинэчилнэ
    const result = await payment.verify(req.user.id)

    res.json({
      success:      true,
      paid:         result.paid,
      order_status: result.orderStatus,
    })
  } catch (err) {
    next(err)
  }
}

// POST /api/payments/qpay/callback — QPay webhook
const handleQpayCallback = async (req, res, next) => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const invoiceId = req.body?.invoice_id || req.body?.object_id || req.query?.invoice_id
    const orderId   = req.query?.order_id  || req.body?.order_id

    if (!invoiceId && !orderId) throw createError(400, 'invoice_id эсвэл order_id шаардлагатай')

    const params     = []
    const conditions = ["p.status = 'pending'"]
    if (invoiceId) { params.push(invoiceId); conditions.push(`p.transaction_reference = $${params.length}`) }
    if (orderId)   { params.push(orderId);   conditions.push(`p.order_id = $${params.length}`) }

    const payRes = await client.query(
      `SELECT p.*, o.status AS order_status, o.customer_id, o.order_number
       FROM payments p JOIN orders o ON o.id = p.order_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY p.created_at DESC LIMIT 1`,
      params
    )

    if (!payRes.rows.length) {
      await client.query('COMMIT')
      return res.json({ success: true, message: 'Pending төлбөр олдсонгүй' })
    }

    // Payment instance үүсгэж verify() дуудна
    const payment = new Payment(payRes.rows[0])
    const result  = await qpay.checkPayment(payment.transactionRef)

    if (!result.paid) {
      await client.query('COMMIT')
      return res.status(202).json({ success: true, paid: false })
    }

    await client.query(
      `UPDATE payments SET status='paid', paid_at=$1 WHERE id=$2`,
      [result.paidAt || new Date(), payment.id]
    )

    await client.query('COMMIT')
    res.json({ success: true, paid: true })
  } catch (err) {
    await client.query('ROLLBACK')
    next(err)
  } finally {
    client.release()
  }
}

module.exports = { createInvoice, checkPayment, handleQpayCallback }
