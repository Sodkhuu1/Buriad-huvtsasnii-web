// Review.js — сэтгэгдлийн класс
const pool   = require('../db')
const notify = require('../services/notifications')
const { createError } = require('../middleware/errorHandler')

class Review {
  constructor(data) {
    this.id         = data.id
    this.orderId    = data.order_id
    this.customerId = data.customer_id
    this.tailorId   = data.tailor_id
    this.rating     = data.rating
    this.comment    = data.comment
    this.approved   = data.approved
    this.createdAt  = data.created_at
  }

  // сэтгэгдлийг нийтэлнэ — оёдолчны рейтингийг шинэчилнэ
  async publish() {
    if (this.approved) return this

    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      await client.query('UPDATE reviews SET approved = TRUE WHERE id = $1', [this.id])

      await client.query(
        `UPDATE tailor_profiles
         SET rating = COALESCE(
           (SELECT ROUND(AVG(rating)::numeric, 2)
            FROM reviews WHERE tailor_id = $1 AND approved = TRUE), 0)
         WHERE user_id = $1`,
        [this.tailorId]
      )

      this.approved = true
      await client.query('COMMIT')
      return this
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  }

  // шинэ сэтгэгдэл үүсгэнэ (авто нийтлэгдэнэ)
  static async create({ orderId, customerId, rating, comment }) {
    const ratingNum = parseInt(rating)
    if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      throw createError(400, 'Үнэлгээ 1-5 хооронд байх ёстой')
    }

    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      const or = await client.query(
        `SELECT id, status, tailor_id FROM orders WHERE id = $1 AND customer_id = $2`,
        [orderId, customerId]
      )
      if (!or.rows.length) throw createError(404, 'Захиалга олдсонгүй')

      const order = or.rows[0]
      if (!['delivered', 'completed'].includes(order.status)) {
        throw createError(400, 'Зөвхөн хүлээлгэж өгсөн захиалгад үнэлгээ өгнө')
      }
      if (!order.tailor_id) throw createError(400, 'Оёдолчинтой холбоогүй захиалга')

      const existing = await client.query('SELECT id FROM reviews WHERE order_id = $1', [orderId])
      if (existing.rows.length) throw createError(409, 'Үнэлгээ аль хэдийн үлдээгдсэн байна')

      const rr = await client.query(
        `INSERT INTO reviews (order_id, customer_id, tailor_id, rating, comment, approved)
         VALUES ($1, $2, $3, $4, $5, TRUE) RETURNING *`,
        [orderId, customerId, order.tailor_id, ratingNum, comment || null]
      )

      // рейтинг даруй шинэчилнэ
      await client.query(
        `UPDATE tailor_profiles
         SET rating = COALESCE(
           (SELECT ROUND(AVG(rating)::numeric, 2)
            FROM reviews WHERE tailor_id = $1 AND approved = TRUE), 0)
         WHERE user_id = $1`,
        [order.tailor_id]
      )

      await notify.send(client, {
        userId:  order.tailor_id,
        orderId,
        title:   'Шинэ үнэлгээ',
        content: `Захиалгад ${ratingNum}/5 одтой үнэлгээ ирлээ.`,
      })

      await client.query('COMMIT')
      return new Review(rr.rows[0])
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  }
}

module.exports = Review
