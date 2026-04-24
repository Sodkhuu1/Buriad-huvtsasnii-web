const pool = require('../db')
const { createError } = require('../middleware/errorHandler')

// GET /api/garments
const getGarments = async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT
        gd.id,
        gd.name,
        gd.ceremonial_use,
        gd.base_price,
        gd.image_url,
        gd.flat_image_url,
        gd.tailor_id,
        gc.name  AS category_name,
        gc.audience,
        u.full_name AS tailor_name,
        tp.business_name AS tailor_business
      FROM garment_designs gd
      LEFT JOIN garment_categories gc ON gc.id = gd.category_id
      LEFT JOIN users u ON u.id = gd.tailor_id
      LEFT JOIN tailor_profiles tp ON tp.user_id = gd.tailor_id
      WHERE gd.active = true
      ORDER BY gd.created_at DESC
    `)

    res.json({ success: true, garments: result.rows })
  } catch (err) {
    next(err)
  }
}

// GET /api/garments/:id/materials
const getMaterials = async (req, res, next) => {
  try {
    const { id } = req.params

    const result = await pool.query(
      `SELECT id, material_name, color, extra_cost
       FROM material_options
       WHERE design_id = $1 AND available = true
       ORDER BY extra_cost ASC`,
      [id]
    )

    res.json({ success: true, materials: result.rows })
  } catch (err) {
    next(err)
  }
}

// GET /api/garments/categories
const getCategories = async (req, res, next) => {
  try {
    const result = await pool.query('SELECT id, name, audience FROM garment_categories ORDER BY name')
    res.json({ success: true, categories: result.rows })
  } catch (err) {
    next(err)
  }
}

module.exports = { getGarments, getMaterials, getCategories }
