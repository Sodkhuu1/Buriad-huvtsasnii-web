const express = require('express')
const router = express.Router()
const { createInvoice, checkPayment } = require('../controllers/payments.controller')
const { protect } = require('../middleware/auth')

// Buh tolboriin route nevtersen baikh shaardlagatai
router.use(protect)

// POST /api/payments/orders/:id/invoice — zahialgad QPay invoice usgenee
router.post('/orders/:id/invoice', createInvoice)

// GET /api/payments/:paymentId/check — polling-oor toloviig shalgaana
router.get('/:paymentId/check', checkPayment)

module.exports = router
