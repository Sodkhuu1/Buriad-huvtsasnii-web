// payments.controller.js — QPay-ээр захиалгын төлбөр хүлээж авах

const pool = require('../db')
const { createError } = require('../middleware/errorHandler')
const qpay = require('../services/qpay')
const notify = require('../services/notifications')

// POST /api/payments/orders/:id/invoice
// Zahialagch torlog jendlee tolboriin invoice usgenee
const createInvoice = async (req, res, next) => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // Zahialga uurinh esehiig + statusiig shalgaa
    const orderRes = await client.query(
      `SELECT id, order_number, status, total_amount
       FROM orders WHERE id = $1 AND customer_id = $2`,
      [req.params.id, req.user.id]
    )
    if (!orderRes.rows.length) throw createError(404, 'Захиалга олдсонгүй')

    const order = orderRes.rows[0]
    if (order.status !== 'accepted') {
      throw createError(400, 'Зөвхөн оёдолчин баталсан захиалгад төлбөр хийнэ')
    }

    // Aldartai pending tolbor baival uunig dahin avna — duplicate invoice usgehgui
    const existing = await client.query(
      `SELECT id, transaction_reference FROM payments
       WHERE order_id = $1 AND status = 'pending'
       ORDER BY created_at DESC LIMIT 1`,
      [order.id]
    )

    let payment
    let invoiceData

    if (existing.rows.length) {
      // QPay-aas dakhin QR avah shaardlaga baikhgu — meshen invoice-iig dahin durdana
      // Tegehguu mock horimd qrImage-iig nemj uusgeh kheregtei tul shineer khiine
      payment = existing.rows[0]
      invoiceData = await qpay.createInvoice({
        orderId: order.id,
        orderNumber: order.order_number,
        amount: parseFloat(order.total_amount),
        description: `Захиалга ${order.order_number}`,
      })
      // transaction_reference-ee solnoo
      await client.query(
        `UPDATE payments SET transaction_reference = $1 WHERE id = $2`,
        [invoiceData.invoiceId, payment.id]
      )
    } else {
      invoiceData = await qpay.createInvoice({
        orderId: order.id,
        orderNumber: order.order_number,
        amount: parseFloat(order.total_amount),
        description: `Захиалга ${order.order_number}`,
      })

      const insertRes = await client.query(
        `INSERT INTO payments (order_id, amount, method, status, transaction_reference)
         VALUES ($1, $2, 'qpay', 'pending', $3)
         RETURNING id`,
        [order.id, order.total_amount, invoiceData.invoiceId]
      )
      payment = insertRes.rows[0]
    }

    await client.query('COMMIT')

    res.status(201).json({
      success: true,
      payment_id: payment.id,
      qr_image: invoiceData.qrImage,
      qr_text: invoiceData.qrText,
      urls: invoiceData.urls,
      is_mock: invoiceData.isMock,
    })
  } catch (err) {
    await client.query('ROLLBACK')
    next(err)
  } finally {
    client.release()
  }
}

// GET /api/payments/:paymentId/check
// Frontend-ees 3 sek tutamd duudana, paid bolson bol order-iig deposit_paid bolgono
const checkPayment = async (req, res, next) => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // Tölbör + zahialga uurinh esehiig shalgaa
    const payRes = await client.query(
      `SELECT p.id, p.order_id, p.status, p.transaction_reference, p.amount,
              o.customer_id, o.status AS order_status
       FROM payments p
       JOIN orders o ON o.id = p.order_id
       WHERE p.id = $1`,
      [req.params.paymentId]
    )
    if (!payRes.rows.length) throw createError(404, 'Төлбөр олдсонгүй')

    const pay = payRes.rows[0]
    if (pay.customer_id !== req.user.id) throw createError(403, 'Хандах эрхгүй')

    // Aldartai paid bol davtaad shalgah ch hereggui
    if (pay.status === 'paid') {
      await client.query('COMMIT')
      return res.json({ success: true, paid: true, order_status: pay.order_status })
    }

    // QPay-d shalgaa
    const result = await qpay.checkPayment(pay.transaction_reference)

    if (!result.paid) {
      await client.query('COMMIT')
      return res.json({ success: true, paid: false })
    }

    // Tölögdsön — payment + order-iig shineechelnee
    await client.query(
      `UPDATE payments SET status = 'paid', paid_at = $1 WHERE id = $2`,
      [result.paidAt || new Date(), pay.id]
    )

    // Zaval accepted baigaa esehiig dahin shalga (race condition baival)
    if (pay.order_status === 'accepted') {
      await client.query(
        `UPDATE orders SET status = 'deposit_paid', updated_at = NOW() WHERE id = $1`,
        [pay.order_id]
      )
      await client.query(
        `INSERT INTO order_status_history (order_id, from_status, to_status, changed_by_id, note)
         VALUES ($1, 'accepted', 'deposit_paid', $2, 'QPay-ээр төлбөр хийгдлээ')`,
        [pay.order_id, req.user.id]
      )

      // Oyodolchind medeglel
      const tRes = await client.query(
        `SELECT tailor_id, order_number FROM orders WHERE id = $1`,
        [pay.order_id]
      )
      if (tRes.rows[0]?.tailor_id) {
        await notify.send(client, {
          userId: tRes.rows[0].tailor_id,
          orderId: pay.order_id,
          title: 'Урьдчилгаа төлбөр ирлээ',
          content: `${tRes.rows[0].order_number} захиалга төлөгдсөн. Үйлдвэрлэлээ эхлүүлж болно.`,
        })
      }
    }

    await client.query('COMMIT')
    res.json({ success: true, paid: true, order_status: 'deposit_paid' })
  } catch (err) {
    await client.query('ROLLBACK')
    next(err)
  } finally {
    client.release()
  }
}

module.exports = { createInvoice, checkPayment }
