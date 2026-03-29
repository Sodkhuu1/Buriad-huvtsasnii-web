const pool = require('../db')

// GET /api/tailors
const getTailors = async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT
        u.id,
        u.full_name,
        tp.business_name,
        tp.specialization,
        tp.rating,
        tp.verified,
        tp.min_lead_days,
        tp.max_lead_days,
        tp.introduction,
        tp.avatar_url
      FROM users u
      JOIN tailor_profiles tp ON tp.user_id = u.id
      WHERE u.role = 'tailor'
        AND u.status = 'active'
        AND tp.verified = true
      ORDER BY tp.rating DESC
    `)

    res.json({ success: true, tailors: result.rows })
  } catch (err) {
    next(err)
  }
}

module.exports = { getTailors }
