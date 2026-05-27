// articles.controller.js — CulturalArticle классыг ашиглана
const { CulturalArticle } = require('../models')
const { createError } = require('../middleware/errorHandler')

// GET /api/articles
const listArticles = async (req, res, next) => {
  try {
    const { status } = req.query
    const articles = await CulturalArticle.findAll({ status: status || 'published' })
    res.json({ success: true, articles: articles.map(a => a.toJSON()) })
  } catch (err) {
    next(err)
  }
}

// GET /api/articles/:id
const getArticle = async (req, res, next) => {
  try {
    const article = await CulturalArticle.findById(req.params.id)
    res.json({ success: true, article: article.toJSON() })
  } catch (err) {
    next(err)
  }
}

// POST /api/articles — admin л үүсгэж болно
const createArticle = async (req, res, next) => {
  try {
    const { title, slug, origin_region, era, summary } = req.body
    const article = await CulturalArticle.create({
      authorId:     req.user.id,
      title, slug,
      originRegion: origin_region,
      era, summary,
    })
    res.status(201).json({ success: true, article: article.toJSON() })
  } catch (err) {
    next(err)
  }
}

// POST /api/articles/:id/publish — CulturalArticle.publish() ашиглана
const publishArticle = async (req, res, next) => {
  try {
    const article = await CulturalArticle.findById(req.params.id)
    await article.publish()
    res.json({ success: true, article: article.toJSON() })
  } catch (err) {
    next(err)
  }
}

// POST /api/articles/:id/archive — CulturalArticle.archive() ашиглана
const archiveArticle = async (req, res, next) => {
  try {
    const article = await CulturalArticle.findById(req.params.id)
    await article.archive()
    res.json({ success: true, article: article.toJSON() })
  } catch (err) {
    next(err)
  }
}

module.exports = { listArticles, getArticle, createArticle, publishArticle, archiveArticle }
