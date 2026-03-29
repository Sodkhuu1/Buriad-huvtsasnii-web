const express = require('express')
const router = express.Router()
const { getTailors } = require('../controllers/tailors.controller')

// GET /api/tailors
router.get('/', getTailors)

module.exports = router
