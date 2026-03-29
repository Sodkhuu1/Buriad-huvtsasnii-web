const express = require('express')
const router = express.Router()
const { createOrder, getMyOrders } = require('../controllers/orders.controller')
const { protect } = require('../middleware/auth')

// All order routes require login
router.use(protect)

// POST /api/orders — create a new order
router.post('/', createOrder)

// GET /api/orders/my — get my orders
router.get('/my', getMyOrders)

module.exports = router
