// CulturalArticle.js — соёлын нийтлэлийн класс
const pool = require('../db')
const { createError } = require('../middleware/errorHandler')

class CulturalArticle {
  constructor(data) {
    this.id           = data.id
    this.authorId     = data.author_id
    this.title        = data.title
    this.slug         = data.slug
    this.originRegion = data.origin_region
    this.era          = data.era
    this.summary      = data.summary
    this.symbols      = data.symbols || []
    this.status       = data.status
    this.publishedAt  = data.published_at
    this.createdAt    = data.created_at
  }

  // нийтлэлийг нийтэлнэ
  async publish() {
    await pool.query(
      `UPDATE cultural_articles
       SET status = 'published', published_at = NOW()
       WHERE id = $1`,
      [this.id]
    )
    this.status      = 'published'
    this.publishedAt = new Date()
    return this
  }

  // нийтлэлийг архивлана
  async archive() {
    await pool.query(
      `UPDATE cultural_articles SET status = 'archived' WHERE id = $1`,
      [this.id]
    )
    this.status = 'archived'
    return this
  }

  static async findById(id) {
    const r = await pool.query(
      `SELECT ca.*,
              json_agg(
                json_build_object('name', sm.symbol_name, 'meaning', sm.interpretation)
              ) FILTER (WHERE sm.id IS NOT NULL) AS symbols
       FROM cultural_articles ca
       LEFT JOIN symbol_meanings sm ON sm.article_id = ca.id
       WHERE ca.id = $1
       GROUP BY ca.id`,
      [id]
    )
    if (!r.rows.length) throw createError(404, 'Нийтлэл олдсонгүй')
    return new CulturalArticle(r.rows[0])
  }

  static async findAll({ status } = {}) {
    const params = []
    const conditions = []
    if (status) { params.push(status); conditions.push(`ca.status = $${params.length}`) }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

    const r = await pool.query(
      `SELECT ca.id, ca.title, ca.slug, ca.origin_region,
              ca.era, ca.summary, ca.status, ca.published_at, ca.created_at
       FROM cultural_articles ca ${where}
       ORDER BY ca.created_at DESC`,
      params
    )
    return r.rows.map(row => new CulturalArticle(row))
  }

  static async create({ authorId, title, slug, originRegion, era, summary }) {
    if (!title || !slug) throw createError(400, 'Гарчиг болон slug шаардлагатай')

    const r = await pool.query(
      `INSERT INTO cultural_articles (author_id, title, slug, origin_region, era, summary)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [authorId, title, slug, originRegion || null, era || null, summary || null]
    )
    return new CulturalArticle(r.rows[0])
  }

  toJSON() {
    return {
      id:            this.id,
      title:         this.title,
      slug:          this.slug,
      origin_region: this.originRegion,
      era:           this.era,
      summary:       this.summary,
      symbols:       this.symbols,
      status:        this.status,
      published_at:  this.publishedAt,
    }
  }
}

module.exports = CulturalArticle
