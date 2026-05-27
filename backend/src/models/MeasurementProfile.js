// MeasurementProfile.js — захиалагчийн хэмжээсийн профайл
const pool = require('../db')
const { createError } = require('../middleware/errorHandler')

class MeasurementProfile {
  constructor(data) {
    this.id              = data.id
    this.userId          = data.user_id
    this.name            = data.profile_name
    this.gender          = data.gender_category
    this.bodyMeasurements = data.measurements || {}
    this.captureAt       = data.captured_at
  }

  // хэмжээсийн утгуудыг шинэчилнэ
  async update(measurements) {
    if (!measurements || typeof measurements !== 'object') {
      throw createError(400, 'Хэмжээсийн мэдээлэл шаардлагатай')
    }

    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      // хуучин утгыг устгаж шинийг оруулна
      await client.query('DELETE FROM measurement_values WHERE profile_id = $1', [this.id])

      for (const [code, value] of Object.entries(measurements)) {
        await client.query(
          `INSERT INTO measurement_values (profile_id, metric_code, metric_value)
           VALUES ($1, $2, $3)`,
          [this.id, code, parseFloat(value)]
        )
      }

      this.bodyMeasurements = measurements
      await client.query('COMMIT')
      return this
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  }

  static async findByUserId(userId) {
    const r = await pool.query(
      `SELECT mp.id, mp.user_id, mp.profile_name, mp.gender_category, mp.captured_at,
              COALESCE(json_object_agg(mv.metric_code, mv.metric_value)
                FILTER (WHERE mv.id IS NOT NULL), '{}') AS measurements
       FROM measurement_profiles mp
       LEFT JOIN measurement_values mv ON mv.profile_id = mp.id
       WHERE mp.user_id = $1
       GROUP BY mp.id
       ORDER BY mp.captured_at DESC`,
      [userId]
    )
    return r.rows.map(row => new MeasurementProfile(row))
  }

  static async findById(id) {
    const r = await pool.query(
      `SELECT mp.id, mp.user_id, mp.profile_name, mp.gender_category, mp.captured_at,
              COALESCE(json_object_agg(mv.metric_code, mv.metric_value)
                FILTER (WHERE mv.id IS NOT NULL), '{}') AS measurements
       FROM measurement_profiles mp
       LEFT JOIN measurement_values mv ON mv.profile_id = mp.id
       WHERE mp.id = $1
       GROUP BY mp.id`,
      [id]
    )
    if (!r.rows.length) throw createError(404, 'Хэмжээсийн профайл олдсонгүй')
    return new MeasurementProfile(r.rows[0])
  }

  toJSON() {
    return {
      id:               this.id,
      profile_name:     this.name,
      gender_category:  this.gender,
      measurements:     this.bodyMeasurements,
      captured_at:      this.captureAt,
    }
  }
}

module.exports = MeasurementProfile
