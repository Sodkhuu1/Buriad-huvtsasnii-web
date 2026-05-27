// Consultation.js — зөвлөгөөний харилцааны класс
const pool   = require('../db')
const notify = require('../services/notifications')
const { createError } = require('../middleware/errorHandler')

class Consultation {
  constructor(data) {
    this.id         = data.id
    this.customerId = data.customer_id
    this.tailorId   = data.tailor_id
    this.orderId    = data.order_id
    this.status     = data.status
    this.date       = data.created_at
    this.messages   = data.messages || []
  }

  // мессеж илгээнэ
  async sendMessage({ senderId, senderRole, messageBody }) {
    if (!messageBody || !messageBody.trim()) {
      throw createError(400, 'Мессеж хоосон байж болохгүй')
    }
    if (messageBody.length > 1000) {
      throw createError(400, 'Мессеж 1000 тэмдэгтээс ихгүй байх ёстой')
    }

    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      const r = await client.query(
        `INSERT INTO consultation_messages (thread_id, sender_id, sender_role, message_body)
         VALUES ($1, $2, $3, $4)
         RETURNING id, sender_id, sender_role, message_body, attachment_url, sent_at`,
        [this.id, senderId, senderRole, messageBody.trim()]
      )

      // нөгөө талдаа мэдэгдэл илгээнэ
      const recipientId = senderId === this.customerId ? this.tailorId : this.customerId
      await notify.send(client, {
        userId:  recipientId,
        orderId: this.orderId,
        title:   'Шинэ чат мессеж',
        content: 'Захиалгад шинэ мессеж ирлээ.',
      })

      await client.query('COMMIT')
      const msg = r.rows[0]
      this.messages.push(msg)
      return msg
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  }

  // харилцааг хаана
  async close() {
    await pool.query(
      `UPDATE consultation_threads SET status = 'closed' WHERE id = $1`,
      [this.id]
    )
    this.status = 'closed'
    return this
  }

  // мессежүүдийг татна
  async loadMessages() {
    const r = await pool.query(
      `SELECT cm.id, cm.sender_id, cm.sender_role,
              cm.message_body, cm.attachment_url, cm.sent_at,
              u.full_name AS sender_name
       FROM consultation_messages cm
       JOIN users u ON u.id = cm.sender_id
       WHERE cm.thread_id = $1
       ORDER BY cm.sent_at ASC`,
      [this.id]
    )
    this.messages = r.rows
    return this.messages
  }

  // захиалгын thread авна, байхгүй бол үүсгэнэ
  static async getOrCreate(orderId, customerId, tailorId) {
    const existing = await pool.query(
      `SELECT id, customer_id, tailor_id, order_id, status, created_at
       FROM consultation_threads WHERE order_id = $1 LIMIT 1`,
      [orderId]
    )
    if (existing.rows.length) return new Consultation(existing.rows[0])

    const r = await pool.query(
      `INSERT INTO consultation_threads (customer_id, tailor_id, order_id, status)
       VALUES ($1, $2, $3, 'open') RETURNING *`,
      [customerId, tailorId, orderId]
    )
    return new Consultation(r.rows[0])
  }
}

module.exports = Consultation
