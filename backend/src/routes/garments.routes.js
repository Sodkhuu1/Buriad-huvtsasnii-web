const express = require('express')
const router = express.Router()
const { getGarments, getMaterials } = require('../controllers/garments.controller')

// GET /api/garments
router.get('/', getGarments)

// GET /api/garments/:id/materials
router.get('/:id/materials', getMaterials)

module.exports = router
