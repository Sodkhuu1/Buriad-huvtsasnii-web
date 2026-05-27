// Tailor.js — оёдолчны класс, User-с удамшина
const pool = require('../db')
const { createError } = require('../middleware/errorHandler')
const User = require('./User')

class Tailor extends User {
  constructor(data) {
    super(data)
    this.businessName  = data.business_name
    this.specialization = data.specialization
    this.averageRating = data.rating
    this.verified      = data.verified
  }

  // шинэ загвар нийтэлнэ
  async publishDesign({ name, categoryId, basePrice, ceremonialUse, silhouette, imageUrl, flatImageUrl }) {
    if (!name || !basePrice) throw createError(400, 'Нэр болон үнэ шаардлагатай')

    const r = await pool.query(
      `INSERT INTO garment_designs
         (tailor_id, category_id, name, ceremonial_use, silhouette, base_price, image_url, flat_image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        this.id, categoryId || null, name,
        ceremonialUse || null, silhouette || null,
        basePrice, imageUrl || null, flatImageUrl || null,
      ]
    )
    return r.rows[0]
  }

  // захиалгыг хянаж, статусыг шинэчилнэ
  async reviewOrder(orderId, nextStatus, note) {
    const { Order } = require('./index')
    const order = await Order.findByIdForTailor(orderId, this.id)
    return order.changeStatus(nextStatus, this.id, note)
  }

  // захиалгыг биелүүлэв — "delivered" болгоно
  async fulfillOrder(orderId, note) {
    return this.reviewOrder(orderId, 'delivered', note)
  }

  // tailor_profiles-тай хамт татна
  static async findById(id) {
    const r = await pool.query(
      `SELECT u.id, u.full_name, u.email, u.phone, u.gender, u.age,
              u.role, u.status, u.created_at,
              tp.business_name, tp.specialization, tp.rating, tp.verified
       FROM users u
       LEFT JOIN tailor_profiles tp ON tp.user_id = u.id
       WHERE u.id = $1 AND u.role = 'tailor'`,
      [id]
    )
    if (!r.rows.length) throw createError(404, 'Оёдолчин олдсонгүй')
    return new Tailor(r.rows[0])
  }
}

module.exports = Tailor
