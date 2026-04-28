const express = require('express')
const router = express.Router()
const { getMyNotifications, getUnreadCount, markRead, markAllRead } = require('../controllers/notifications.controller')
const { protect } = require('../middleware/auth')

router.use(protect)

router.get('/',                getMyNotifications)
router.get('/unread-count',    getUnreadCount)
router.patch('/read-all',      markAllRead)
router.patch('/:id/read',      markRead)

module.exports = router
