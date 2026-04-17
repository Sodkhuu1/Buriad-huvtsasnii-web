const express = require('express')
const router = express.Router()
const { getTailors, getTailorDesigns } = require('../controllers/tailors.controller')

// GET /api/tailors
router.get('/', getTailors)

// GET /api/tailors/:id/designs
router.get('/:id/designs', getTailorDesigns)

module.exports = router
