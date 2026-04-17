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
        tp.avatar_url,
        (SELECT COUNT(*) FROM orders o WHERE o.tailor_id = u.id AND o.status = 'completed') AS completed_orders,
        (SELECT COUNT(*) FROM garment_designs gd WHERE gd.tailor_id = u.id AND gd.active = true) AS design_count
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

// GET /api/tailors/:id/designs
const getTailorDesigns = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT gd.id, gd.name, gd.ceremonial_use, gd.silhouette,
              gd.base_price, gd.image_url,
              gc.name AS category_name, gc.audience
       FROM garment_designs gd
       LEFT JOIN garment_categories gc ON gc.id = gd.category_id
       WHERE gd.tailor_id = $1 AND gd.active = true
       ORDER BY gd.created_at DESC`,
      [req.params.id]
    )
    res.json({ success: true, designs: result.rows })
  } catch (err) {
    next(err)
  }
}

module.exports = { getTailors, getTailorDesigns }
