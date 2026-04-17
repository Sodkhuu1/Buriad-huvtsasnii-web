const express = require('express')
const router  = express.Router()
const {
  getStats, getUsers, getRecentUsers, updateUserStatus,
  getAllOrders, getTailors, verifyTailor,
} = require('../controllers/admin.controller')
const { protect, requireRole } = require('../middleware/auth')

// Бүх route нэвтэрсэн admin шаардана
router.use(protect)
router.use(requireRole('admin'))

router.get('/stats',              getStats)
router.get('/users',              getUsers)
router.get('/recent-users',       getRecentUsers)
router.put('/users/:id/status',   updateUserStatus)
router.get('/orders',             getAllOrders)
router.get('/tailors',            getTailors)
router.put('/tailors/:id/verify', verifyTailor)

module.exports = router
