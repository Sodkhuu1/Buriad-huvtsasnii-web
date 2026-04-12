const express = require('express')
const router = express.Router()
const { getStats, getOrders, getOrderById, updateOrderStatus } = require('../controllers/tailor.controller')
const { protect, requireRole } = require('../middleware/auth')

// Бүх route нэвтэрсэн оёдолчин шаардана
router.use(protect)
router.use(requireRole('tailor'))

router.get('/stats',            getStats)
router.get('/orders',           getOrders)
router.get('/orders/:id',       getOrderById)
router.put('/orders/:id/status', updateOrderStatus)

module.exports = router
