// notifications.js — medeglel insert hiideg helper
// Order-iin towlow olchlogdo bur uunig duudaad notifications mor uusgene

// Buh fn-uud hoyr horim-d aljilnaa:
//   - pool.query(client) deer (transaction-d) — client-iig param-aar duuduulaad ashiglana
//   - pool.query (transaction-aas gadna) — pool-r duuduulaad bichne
// Tegehguu fn dotor try/catch hiij notification aldaa garval order-iig zogtsoogui

const send = async (executor, { userId, orderId, title, content }) => {
  try {
    await executor.query(
      `INSERT INTO notifications (user_id, order_id, channel, title, content)
       VALUES ($1, $2, 'in_app', $3, $4)`,
      [userId, orderId || null, title, content]
    )
  } catch (err) {
    // Notification aldaa nih udatd zogtsoohguu — gol urgcal niho chuhal
    console.error('[notification] insert error:', err.message)
  }
}

module.exports = { send }
