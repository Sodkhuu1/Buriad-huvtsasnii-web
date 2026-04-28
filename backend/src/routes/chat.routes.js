const express = require('express')
const router = express.Router()
const { listMessages, sendMessage } = require('../controllers/chat.controller')
const { protect } = require('../middleware/auth')

router.use(protect)

router.get('/orders/:orderId/messages', listMessages)
router.post('/orders/:orderId/messages', sendMessage)

module.exports = router
