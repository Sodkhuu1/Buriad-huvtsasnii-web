// chat.controller.js — Consultation классыг ашиглана
const pool = require('../db')
const { Consultation } = require('../models')
const { createError } = require('../middleware/errorHandler')

// захиалгын оролцогч мөн эсэхийг шалгана
const assertParticipant = async (orderId, user) => {
  const result = await pool.query(
    `SELECT id, order_number, customer_id, tailor_id FROM orders WHERE id = $1`,
    [orderId]
  )
  if (!result.rows.length) throw createError(404, 'Захиалга олдсонгүй')

  const order = result.rows[0]
  const isCustomer = order.customer_id === user.id
  const isTailor   = order.tailor_id   === user.id

  if (!isCustomer && !isTailor) throw createError(403, 'Энэ захиалгын чат руу хандах эрхгүй')
  if (!order.tailor_id)         throw createError(400, 'Энэ захиалгад оёдолчин холбогдоогүй')

  return { order, isCustomer, isTailor }
}

// GET /api/chat/:orderId/messages
const listMessages = async (req, res, next) => {
  try {
    const { order } = await assertParticipant(req.params.orderId, req.user)

    // Consultation.getOrCreate() — thread авна эсвэл үүсгэнэ
    const consultation = await Consultation.getOrCreate(
      order.id, order.customer_id, order.tailor_id
    )

    const messages = await consultation.loadMessages()

    res.json({ success: true, thread_id: consultation.id, messages })
  } catch (err) {
    next(err)
  }
}

// POST /api/chat/:orderId/messages — Consultation.sendMessage() ашиглана
const sendMessage = async (req, res, next) => {
  try {
    const { order } = await assertParticipant(req.params.orderId, req.user)

    const consultation = await Consultation.getOrCreate(
      order.id, order.customer_id, order.tailor_id
    )

    // sendMessage() — мессеж хадгалж мэдэгдэл илгээнэ
    const msg = await consultation.sendMessage({
      senderId:    req.user.id,
      senderRole:  req.user.role,
      messageBody: req.body?.message_body,
    })

    res.status(201).json({ success: true, message: msg })
  } catch (err) {
    next(err)
  }
}

module.exports = { listMessages, sendMessage }
