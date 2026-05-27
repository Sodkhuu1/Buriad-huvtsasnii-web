// Admin.js — системийн администратор, User-с удамшина
const pool = require('../db')
const { createError } = require('../middleware/errorHandler')
const User = require('./User')

class Admin extends User {
  constructor(data) {
    super(data)
  }

  // хэрэглэгчдийг удирдана — жагсаалт, шүүлт
  async manageUsers({ role, status, limit = 100, offset = 0 } = {}) {
    const conditions = ["role != 'admin'"]
    const params = []

    if (role)   { params.push(role);   conditions.push(`role = $${params.length}`) }
    if (status) { params.push(status); conditions.push(`status = $${params.length}`) }

    params.push(parseInt(limit), parseInt(offset))

    const r = await pool.query(
      `SELECT id, full_name, email, phone, role, status, created_at, last_login_at
       FROM users
       WHERE ${conditions.join(' AND ')}
       ORDER BY created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    )
    return r.rows
  }

  // нийтлэлийн агуулгыг зохицуулна — нийтлэх эсвэл архивлах
  async moderateContent(articleId, action) {
    const { CulturalArticle } = require('./index')
    const article = await CulturalArticle.findById(articleId)

    if (action === 'publish') return article.publish()
    if (action === 'archive') return article.archive()
    throw createError(400, 'action: "publish" эсвэл "archive" байх ёстой')
  }
}

module.exports = Admin
