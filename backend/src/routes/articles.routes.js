// articles.routes.js — соёлын нийтлэлийн routes
const router = require('express').Router()
const { protect, requireRole } = require('../middleware/auth')
const ctrl = require('../controllers/articles.controller')

// нийтэд харагдах
router.get('/',    ctrl.listArticles)
router.get('/:id', ctrl.getArticle)

// зөвхөн admin үүсгэж, нийтэлж, архивлана
router.post('/',            protect, requireRole('admin'), ctrl.createArticle)
router.post('/:id/publish', protect, requireRole('admin'), ctrl.publishArticle)
router.post('/:id/archive', protect, requireRole('admin'), ctrl.archiveArticle)

module.exports = router
