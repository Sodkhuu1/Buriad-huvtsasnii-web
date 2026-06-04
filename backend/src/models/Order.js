// Order.js — захиалгын класс
const pool   = require('../db')
const notify = require('../services/notifications')
const { createError } = require('../middleware/errorHandler')

// зөвшөөрөгдсөн статус шилжилтүүд
const ALLOWED_TRANSITIONS = {
  submitted:     ['accepted', 'rejected'],
  accepted:      [],            // төлбөр төлөгдөхгүй бол оёдолчин руу шилжихгүй
  deposit_paid:  ['in_production'],
  in_production: ['ready'],
  ready:         ['delivered'],
  shipped:       ['delivered'],
}

// захиалгад заавал байх хэмжээсүүд
const REQUIRED_MEASUREMENTS = {
  height:   { min: 80,  max: 230, label: 'Өндөр' },
  chest:    { min: 40,  max: 180, label: 'Цээж' },
  waist:    { min: 35,  max: 170, label: 'Бүсэлхий' },
  hip:      { min: 40,  max: 190, label: 'Ташаа' },
  sleeve:   { min: 20,  max: 100, label: 'Гарын урт' },
  shoulder: { min: 20,  max: 80,  label: 'Мөрний өргөн' },
}

class Order {
  constructor(data) {
    this.id                = data.id
    this.orderNumber       = data.order_number
    this.status            = data.status
    this.items             = data.items || []
    this.measurementSnapshot = data.measurement_snapshot || null
    this.totalAmount       = parseFloat(data.total_amount || 0)
    this.expectedDeliveryAt = data.expected_delivery_at
    this.customerId        = data.customer_id
    this.tailorId          = data.tailor_id
    this.createdAt         = data.created_at
    this.updatedAt         = data.updated_at
  }

  // нийт үнийг items-аас тооцоолно
  calculateTotal() {
    return this.items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0)
  }

  // статус өөрчлөх — зөвшөөрөгдсөн эсэхийг шалгана
  async changeStatus(nextStatus, changedById, note) {
    const allowed = ALLOWED_TRANSITIONS[this.status] ?? []
    if (!allowed.includes(nextStatus)) {
      throw createError(400, `${this.status} → ${nextStatus} шилжих боломжгүй`)
    }

    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      const setClause = nextStatus === 'rejected'
        ? 'SET status = $1, tailor_id = NULL, updated_at = NOW()'
        : 'SET status = $1, updated_at = NOW()'

      const r = await client.query(
        `UPDATE orders ${setClause} WHERE id = $2
         RETURNING id, order_number, status, total_amount, created_at`,
        [nextStatus, this.id]
      )

      await client.query(
        `INSERT INTO order_status_history (order_id, from_status, to_status, changed_by_id, note)
         VALUES ($1, $2, $3, $4, $5)`,
        [this.id, this.status, nextStatus, changedById, note || null]
      )

      this.status = nextStatus
      await client.query('COMMIT')
      return r.rows[0]
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  }

  // захиалагч өөрөө цуцлана
  async cancel(userId, note) {
    if (this.status !== 'submitted') {
      throw createError(400, 'Зөвхөн хүлээгдэж буй захиалгыг цуцлах боломжтой')
    }

    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      const r = await client.query(
        `UPDATE orders SET status = 'cancelled', updated_at = NOW()
         WHERE id = $1
         RETURNING id, order_number, status, total_amount, created_at`,
        [this.id]
      )

      await client.query(
        `INSERT INTO order_status_history (order_id, from_status, to_status, changed_by_id, note)
         VALUES ($1, $2, 'cancelled', $3, $4)`,
        [this.id, this.status, userId, note || 'Захиалагч цуцаллаа']
      )

      if (this.tailorId) {
        await notify.send(client, {
          userId:  this.tailorId,
          orderId: this.id,
          title:   'Захиалга цуцлагдлаа',
          content: `${this.orderNumber} захиалгыг захиалагч цуцаллаа.`,
        })
      }

      this.status = 'cancelled'
      await client.query('COMMIT')
      return r.rows[0]
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  }

  // шинэ захиалга үүсгэх — хэмжээсийн snapshot хамт
  static async submit({ customerId, items, measurements }) {
    // хэмжээсийг шалгана
    const normalized = {}
    for (const [key, rule] of Object.entries(REQUIRED_MEASUREMENTS)) {
      const v = measurements[key]
      if (v === undefined || v === null || v === '') {
        throw createError(400, `${rule.label} хэмжээс шаардлагатай`)
      }
      const n = Number(v)
      if (!Number.isFinite(n) || n < rule.min || n > rule.max) {
        throw createError(400, `${rule.label} ${rule.min}-${rule.max} см хооронд байх ёстой`)
      }
      normalized[key] = Number(n.toFixed(2))
    }

    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      // загваруудыг татна
      const designIds = [...new Set(items.map(i => i.design_id))]
      const dr = await client.query(
        `SELECT id, name, base_price, tailor_id
         FROM garment_designs WHERE id = ANY($1::uuid[]) AND active = true`,
        [designIds]
      )
      if (dr.rows.length !== designIds.length) throw createError(404, 'Загвар олдсонгүй')

      const designsById = new Map(dr.rows.map(r => [r.id, r]))
      const tailorId    = dr.rows[0]?.tailor_id ?? null

      // материал шалгана
      const materialIds = items.map(i => i.material_option_id).filter(Boolean)
      const materialsById = new Map()
      if (materialIds.length) {
        const mr = await client.query(
          `SELECT id, design_id, extra_cost FROM material_options
           WHERE id = ANY($1::uuid[]) AND available = true`,
          [[...new Set(materialIds)]]
        )
        mr.rows.forEach(r => materialsById.set(r.id, r))
      }

      // үнэ тооцоолно
      const pricedItems = items.map(item => {
        const design = designsById.get(item.design_id)
        let extra = 0
        if (item.material_option_id) {
          const mat = materialsById.get(item.material_option_id)
          if (!mat || mat.design_id !== item.design_id) {
            throw createError(400, 'Сонгосон материал энэ загварт хамаарахгүй')
          }
          extra = parseFloat(mat.extra_cost)
        }
        return { ...item, design_name: design.name, unitPrice: parseFloat(design.base_price) + extra }
      })

      const subtotal    = pricedItems.reduce((s, i) => s + i.unitPrice * i.quantity, 0)
      const orderNumber = `ORD-${Date.now().toString().slice(-8)}`

      const or = await client.query(
        `INSERT INTO orders (order_number, customer_id, tailor_id, status, subtotal, total_amount)
         VALUES ($1, $2, $3, 'submitted', $4, $4) RETURNING *`,
        [orderNumber, customerId, tailorId, subtotal]
      )
      const orderData = or.rows[0]

      for (const item of pricedItems) {
        await client.query(
          `INSERT INTO order_items (order_id, design_id, material_option_id, quantity, custom_note, unit_price)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [orderData.id, item.design_id, item.material_option_id || null,
           item.quantity, item.custom_note || null, item.unitPrice]
        )
      }

      // хэмжээсийн snapshot хөлдөөнө
      const sr = await client.query(
        'INSERT INTO measurement_snapshots (order_id) VALUES ($1) RETURNING id',
        [orderData.id]
      )
      const snapshotId = sr.rows[0].id
      for (const [code, value] of Object.entries(normalized)) {
        await client.query(
          `INSERT INTO snapshot_measurements (snapshot_id, metric_code, metric_value)
           VALUES ($1, $2, $3)`,
          [snapshotId, code, value]
        )
      }

      await client.query(
        `INSERT INTO order_status_history (order_id, to_status, changed_by_id, note)
         VALUES ($1, 'submitted', $2, 'Захиалга үүсгэгдлээ')`,
        [orderData.id, customerId]
      )

      await client.query('COMMIT')

      const order = new Order(orderData)
      order.items = pricedItems
      return order
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  }

  static async findById(id) {
    const r = await pool.query('SELECT * FROM orders WHERE id = $1', [id])
    if (!r.rows.length) throw createError(404, 'Захиалга олдсонгүй')
    return new Order(r.rows[0])
  }

  // tailor-д зориулсан — өөрийн захиалга мөн эсэхийг шалгана
  static async findByIdForTailor(id, tailorId) {
    const r = await pool.query(
      `SELECT o.* FROM orders o
       JOIN order_items oi ON oi.order_id = o.id
       JOIN garment_designs gd ON gd.id = oi.design_id
       WHERE o.id = $1 AND o.tailor_id = $2`,
      [id, tailorId]
    )
    if (!r.rows.length) throw createError(404, 'Захиалга олдсонгүй')
    return new Order(r.rows[0])
  }

  toJSON() {
    return {
      id:                  this.id,
      order_number:        this.orderNumber,
      status:              this.status,
      total_amount:        this.totalAmount,
      expected_delivery_at: this.expectedDeliveryAt,
      created_at:          this.createdAt,
    }
  }
}

module.exports = Order
