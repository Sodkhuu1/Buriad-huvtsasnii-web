// Customer.js — захиалагчийн класс, User-с удамшина
const pool = require('../db')
const { createError } = require('../middleware/errorHandler')
const User = require('./User')

class Customer extends User {
  constructor(data) {
    super(data)
    // gender, age аль хэдийн parent-д байна
  }

  // хэмжээс хадгалах — шинэ профайл үүсгэнэ
  async saveMeasurement({ profileName, genderCategory, measurements }) {
    if (!measurements || typeof measurements !== 'object') {
      throw createError(400, 'Хэмжээсийн мэдээлэл шаардлагатай')
    }

    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      const pr = await client.query(
        `INSERT INTO measurement_profiles (user_id, profile_name, gender_category)
         VALUES ($1, $2, $3) RETURNING id, profile_name, gender_category, captured_at`,
        [this.id, profileName || 'Default', genderCategory || null]
      )
      const profile = pr.rows[0]

      for (const [code, value] of Object.entries(measurements)) {
        await client.query(
          `INSERT INTO measurement_values (profile_id, metric_code, metric_value)
           VALUES ($1, $2, $3)`,
          [profile.id, code, parseFloat(value)]
        )
      }

      await client.query('COMMIT')
      return { ...profile, measurements }
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  }

  // захиалга үүсгэнэ
  async placeOrder(items, measurements) {
    const { Order } = require('./index')
    return Order.submit({ customerId: this.id, items, measurements })
  }

  // захиалгад сэтгэгдэл үлдээнэ
  async leaveReview(orderId, { rating, comment }) {
    const { Review } = require('./index')
    return Review.create({ orderId, customerId: this.id, rating, comment })
  }
}

module.exports = Customer
