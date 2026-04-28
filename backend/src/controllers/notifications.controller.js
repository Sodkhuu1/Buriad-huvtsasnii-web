// notifications.controller.js — medeglel jagsaalt, unread count, read tagdaa

const pool = require('../db')
const { createError } = require('../middleware/errorHandler')

// GET /api/notifications  — suuli 30 medegliig avah
const getMyNotifications = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT id, order_id, title, content, is_read, sent_at
       FROM notifications
       WHERE user_id = $1
       ORDER BY sent_at DESC
       LIMIT 30`,
      [req.user.id]
    )
    res.json({ success: true, notifications: result.rows })
  } catch (err) {
    next(err)
  }
}

// GET /api/notifications/unread-count  — polling-d zoriulav
const getUnreadCount = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT COUNT(*) FROM notifications
       WHERE user_id = $1 AND is_read = FALSE`,
      [req.user.id]
    )
    res.json({ success: true, count: parseInt(result.rows[0].count) })
  } catch (err) {
    next(err)
  }
}

// PATCH /api/notifications/:id/read  — neg medegliig uneshen tagdaa
const markRead = async (req, res, next) => {
  try {
    const result = await pool.query(
      `UPDATE notifications SET is_read = TRUE
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
      [req.params.id, req.user.id]
    )
    if (!result.rows.length) return next(createError(404, 'Мэдэгдэл олдсонгүй'))
    res.json({ success: true })
  } catch (err) {
    next(err)
  }
}

// PATCH /api/notifications/read-all — bygdiig uneshen tagdaa
const markAllRead = async (req, res, next) => {
  try {
    await pool.query(
      `UPDATE notifications SET is_read = TRUE
       WHERE user_id = $1 AND is_read = FALSE`,
      [req.user.id]
    )
    res.json({ success: true })
  } catch (err) {
    next(err)
  }
}

module.exports = { getMyNotifications, getUnreadCount, markRead, markAllRead }
