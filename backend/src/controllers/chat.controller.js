const pool = require('../db')
const { createError } = require('../middleware/errorHandler')
const notify = require('../services/notifications')

const assertParticipant = async (client, orderId, user) => {
  const result = await client.query(
    `SELECT id, order_number, customer_id, tailor_id
     FROM orders
     WHERE id = $1`,
    [orderId]
  )

  if (!result.rows.length) {
    throw createError(404, 'Захиалга олдсонгүй')
  }

  const order = result.rows[0]
  const isCustomer = order.customer_id === user.id
  const isTailor = order.tailor_id === user.id

  if (!isCustomer && !isTailor) {
    throw createError(403, 'Энэ захиалгын чат руу хандах эрхгүй')
  }

  if (!order.tailor_id) {
    throw createError(400, 'Энэ захиалгад оёдолчин холбогдоогүй байна')
  }

  return { order, isCustomer, isTailor }
}

const getOrCreateThread = async (client, order) => {
  const existing = await client.query(
    `SELECT id
     FROM consultation_threads
     WHERE order_id = $1
     ORDER BY created_at ASC
     LIMIT 1`,
    [order.id]
  )

  if (existing.rows.length) {
    return existing.rows[0].id
  }

  const inserted = await client.query(
    `INSERT INTO consultation_threads (customer_id, tailor_id, order_id, status)
     VALUES ($1, $2, $3, 'open')
     RETURNING id`,
    [order.customer_id, order.tailor_id, order.id]
  )

  return inserted.rows[0].id
}

const listMessages = async (req, res, next) => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const { order } = await assertParticipant(client, req.params.orderId, req.user)
    const threadId = await getOrCreateThread(client, order)

    const messages = await client.query(
      `SELECT
         cm.id,
         cm.sender_id,
         cm.sender_role,
         cm.message_body,
         cm.attachment_url,
         cm.sent_at,
         u.full_name AS sender_name
       FROM consultation_messages cm
       JOIN users u ON u.id = cm.sender_id
       WHERE cm.thread_id = $1
       ORDER BY cm.sent_at ASC`,
      [threadId]
    )

    await client.query('COMMIT')
    res.json({ success: true, thread_id: threadId, messages: messages.rows })
  } catch (err) {
    await client.query('ROLLBACK')
    next(err)
  } finally {
    client.release()
  }
}

const sendMessage = async (req, res, next) => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const message = String(req.body?.message_body || '').trim()
    if (!message) {
      throw createError(400, 'Мессеж хоосон байж болохгүй')
    }
    if (message.length > 1000) {
      throw createError(400, 'Мессеж 1000 тэмдэгтээс ихгүй байх ёстой')
    }

    const { order, isCustomer } = await assertParticipant(client, req.params.orderId, req.user)
    const threadId = await getOrCreateThread(client, order)

    const inserted = await client.query(
      `INSERT INTO consultation_messages (thread_id, sender_id, sender_role, message_body)
       VALUES ($1, $2, $3, $4)
       RETURNING id, sender_id, sender_role, message_body, attachment_url, sent_at`,
      [threadId, req.user.id, req.user.role, message]
    )

    const recipientId = isCustomer ? order.tailor_id : order.customer_id
    await notify.send(client, {
      userId: recipientId,
      orderId: order.id,
      title: 'Шинэ чат мессеж',
      content: `${order.order_number} захиалгад шинэ мессеж ирлээ.`,
    })

    await client.query('COMMIT')
    res.status(201).json({ success: true, message: inserted.rows[0] })
  } catch (err) {
    await client.query('ROLLBACK')
    next(err)
  } finally {
    client.release()
  }
}

module.exports = { listMessages, sendMessage }
