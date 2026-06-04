// Payment.js — төлбөрийн класс
const pool   = require('../db')
const qpay   = require('../services/qpay')
const notify = require('../services/notifications')
const { createError } = require('../middleware/errorHandler')

class Payment {
  constructor(data) {
    this.id             = data.id
    this.orderId        = data.order_id
    this.amount         = parseFloat(data.amount)
    this.method         = data.method
    this.status         = data.status
    this.transactionRef = data.transaction_reference
    this.paidAt         = data.paid_at
    // хэрэгцээт нэмэлт талбарууд — join-оос ирэх
    this.orderStatus    = data.order_status
    this.customerId     = data.customer_id
    this.orderNumber    = data.order_number
  }

  // QPay invoice үүсгэж QR код буцаана
  async capture() {
    const invoiceData = await qpay.createInvoice({
      orderId:     this.orderId,
      orderNumber: this.orderNumber,
      amount:      this.amount,
      description: `Захиалга ${this.orderNumber || this.orderId}`,
    })

    await pool.query(
      `UPDATE payments SET transaction_reference = $1 WHERE id = $2`,
      [invoiceData.invoiceId, this.id]
    )
    this.transactionRef = invoiceData.invoiceId
    return invoiceData
  }

  // QPay-д шалгаад төлөгдсөн бол БД шинэчилнэ
  async verify(changedById = null) {
    if (this.status === 'paid') return { paid: true }

    const result = await qpay.checkPayment(this.transactionRef)
    if (!result.paid) return { paid: false }

    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      await client.query(
        `UPDATE payments SET status = 'paid', paid_at = $1 WHERE id = $2`,
        [result.paidAt || new Date(), this.id]
      )

      // tölbör orloo — order-iig deposit_paid руу ахиулна, зөвхөн accepted baival
      const oRes = await client.query(
        `UPDATE orders SET status = 'deposit_paid', updated_at = NOW()
         WHERE id = $1 AND status = 'accepted'
         RETURNING status`,
        [this.orderId]
      )
      if (oRes.rows.length) {
        await client.query(
          `INSERT INTO order_status_history (order_id, from_status, to_status, changed_by_id, note)
           VALUES ($1, 'accepted', 'deposit_paid', $2, 'Урьдчилгаа төлбөр төлөгдлөө')`,
          [this.orderId, changedById]
        )
        this.orderStatus = 'deposit_paid'
      }

      if (this.orderNumber) {
        const tRes = await client.query(
          `SELECT tailor_id, order_number FROM orders WHERE id = $1`, [this.orderId]
        )
        if (tRes.rows[0]?.tailor_id) {
          await notify.send(client, {
            userId:  tRes.rows[0].tailor_id,
            orderId: this.orderId,
            title:   'Төлбөр ирлээ',
            content: `${tRes.rows[0].order_number} захиалгын төлбөр төлөгдлөө.`,
          })
        }
      }
      this.status = 'paid'
      await client.query('COMMIT')
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }

    return { paid: true, orderStatus: this.orderStatus }
  }

  // буцаан олгох — одоогоор QPay дэмжихгүй
  async refund() {
    throw createError(501, 'Буцаалт одоогоор дэмжигдэхгүй байна')
  }

  // захиалгад байгаа хамгийн сүүлийн pending төлбөр авна
  static async findByOrderId(orderId) {
    const r = await pool.query(
      `SELECT p.*, o.status AS order_status, o.customer_id, o.order_number
       FROM payments p JOIN orders o ON o.id = p.order_id
       WHERE p.order_id = $1
       ORDER BY p.created_at DESC LIMIT 1`,
      [orderId]
    )
    if (!r.rows.length) return null
    return new Payment(r.rows[0])
  }

  static async findById(id) {
    const r = await pool.query(
      `SELECT p.*, o.status AS order_status, o.customer_id, o.order_number
       FROM payments p JOIN orders o ON o.id = p.order_id
       WHERE p.id = $1`,
      [id]
    )
    if (!r.rows.length) throw createError(404, 'Төлбөр олдсонгүй')
    return new Payment(r.rows[0])
  }

  // шинэ payment үүсгэх эсвэл байгаа pending-ийг ашиглах
  static async createOrReuse(orderId, amount) {
    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      const existing = await client.query(
        `SELECT p.*, o.status AS order_status, o.customer_id, o.order_number
         FROM payments p JOIN orders o ON o.id = p.order_id
         WHERE p.order_id = $1 AND p.status = 'pending'
         ORDER BY p.created_at DESC LIMIT 1`,
        [orderId]
      )

      let pay
      if (existing.rows.length) {
        pay = new Payment(existing.rows[0])
      } else {
        const ir = await client.query(
          `INSERT INTO payments (order_id, amount, method, status)
           VALUES ($1, $2, 'qpay', 'pending') RETURNING *`,
          [orderId, amount]
        )
        const or = await client.query(
          `SELECT status AS order_status, customer_id, order_number FROM orders WHERE id = $1`,
          [orderId]
        )
        pay = new Payment({ ...ir.rows[0], ...or.rows[0] })
      }

      await client.query('COMMIT')
      return pay
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  }
}

module.exports = Payment
