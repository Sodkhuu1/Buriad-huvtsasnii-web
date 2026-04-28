const express = require('express')
const router = express.Router()
const { runTryOn } = require('../controllers/tryon.controller')

// Public demo endpoint: no merchant/customer account is required to preview a design.
router.post('/', runTryOn)

module.exports = router
