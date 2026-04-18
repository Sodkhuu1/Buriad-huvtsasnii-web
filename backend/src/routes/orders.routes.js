const express = require('express')
const router = express.Router()
const { createOrder, getMyOrders, getMyOrderById, cancelOrder } = require('../controllers/orders.controller')
const { protect } = require('../middleware/auth')

// All order routes require login
router.use(protect)

// POST /api/orders — create a new order
router.post('/', createOrder)

// GET /api/orders/my — get my orders
router.get('/my', getMyOrders)

// GET /api/orders/my/:id — get one of my orders (detail)
router.get('/my/:id', getMyOrderById)

// PATCH /api/orders/my/:id/cancel — цуцлах
router.patch('/my/:id/cancel', cancelOrder)

module.exports = router
