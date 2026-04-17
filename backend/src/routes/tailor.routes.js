const express = require('express')
const router = express.Router()
const { getStats, getOrders, getOrderById, updateOrderStatus, getDesigns, createDesign, updateDesign, deleteDesign } = require('../controllers/tailor.controller')
const { protect, requireRole } = require('../middleware/auth')

// Бүх route нэвтэрсэн оёдолчин шаардана
router.use(protect)
router.use(requireRole('tailor'))

router.get('/stats',              getStats)
router.get('/orders',             getOrders)
router.get('/orders/:id',         getOrderById)
router.put('/orders/:id/status',  updateOrderStatus)

router.get('/designs',            getDesigns)
router.post('/designs',           createDesign)
router.put('/designs/:id',        updateDesign)
router.delete('/designs/:id',     deleteDesign)

module.exports = router
