const express = require('express')
const router = express.Router()
const { createInvoice, checkPayment, handleQpayCallback } = require('../controllers/payments.controller')
const { protect } = require('../middleware/auth')

// QPay callback must be public because it is called by QPay servers, not a browser session.
router.post('/qpay/callback', handleQpayCallback)
router.get('/qpay/callback', handleQpayCallback)

// Buh tolboriin route nevtersen baikh shaardlagatai
router.use(protect)

// POST /api/payments/orders/:id/invoice — zahialgad QPay invoice usgenee
router.post('/orders/:id/invoice', createInvoice)

// GET /api/payments/:paymentId/check — polling-oor toloviig shalgaana
router.get('/:paymentId/check', checkPayment)

module.exports = router
