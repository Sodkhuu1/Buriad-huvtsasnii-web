// business-flow.test.js — гол HTTP flow-уудыг шалгана
// pool.connect → client.query (transaction-тай зүйлс)
// pool.query   → шууд query (model static methods, controller шалгалтууд)

const pool = {
  connect: vi.fn(),
  query:   vi.fn(),
}

const qpay = {
  createInvoice: vi.fn(),
  checkPayment:  vi.fn(),
  isMock:        vi.fn(),
}

const notify = {
  send: vi.fn(),
}

const mockModule = (path, exports) => {
  const resolved = require.resolve(path)
  require.cache[resolved] = { id: resolved, filename: resolved, loaded: true, exports }
}

mockModule('../../../src/db', pool)
mockModule('../../../src/services/qpay', qpay)
mockModule('../../../src/services/notifications', notify)

const { createOrder }                     = require('../../../src/controllers/orders.controller')
const { createInvoice, checkPayment }     = require('../../../src/controllers/payments.controller')
const { assignOrderToTailor }             = require('../../../src/controllers/admin.controller')
const { updateOrderStatus, shipOrder }    = require('../../../src/controllers/tailor.controller')
const { sendMessage }                     = require('../../../src/controllers/chat.controller')

// --- helpers ---

const makeRes = () => {
  const res = {
    status: vi.fn(function (code) { res.statusCode = code; return res }),
    json:   vi.fn(function (body) { res.body = body; return res }),
    statusCode: 200,
    body: undefined,
  }
  return res
}

const makeReq = (overrides = {}) => ({
  body: {}, params: {}, query: {},
  user: { id: 'customer-1', role: 'customer' },
  ...overrides,
})

// client — transaction зүйлсийн mock (pool.connect()-аас ирдэг)
const makeClient = (handler) => ({
  query:   vi.fn(async (sql, params) => {
    const text = String(sql)
    if (['BEGIN', 'COMMIT', 'ROLLBACK'].includes(text)) return { rows: [] }
    return handler(text, params)
  }),
  release: vi.fn(),
})

const defaultMeasurements = {
  height: 170, chest: 90, waist: 72, hip: 96, sleeve: 58, shoulder: 42,
}

// ============================================================
describe('customer order flow', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('creates an order with validated measurement snapshot and status history', async () => {
    // Order.submit() бүхэл transaction pool.connect()-аар явдаг
    const client = makeClient((sql) => {
      // garments query — newline байгаа учир нэр + FROM гэж тусад нь шалгана
      if (sql.includes('FROM garment_designs') && sql.includes('SELECT id, name, base_price')) {
        return { rows: [{ id: 'design-1', name: 'Buriad degel', base_price: '120000.00', tailor_id: 'tailor-1' }] }
      }
      if (sql.includes('INSERT INTO orders')) {
        return {
          rows: [{
            id: 'order-1', order_number: 'ORD-12345678',
            status: 'submitted', total_amount: '120000.00',
            created_at: '2026-05-18T00:00:00.000Z',
          }],
        }
      }
      if (sql.includes('INSERT INTO measurement_snapshots')) return { rows: [{ id: 'snapshot-1' }] }
      return { rows: [] }
    })
    pool.connect.mockResolvedValue(client)

    const req = makeReq({
      body: {
        items: [{ design_id: 'design-1', quantity: 1, custom_note: 'red color' }],
        measurements: defaultMeasurements,
      },
    })
    const res = makeRes()
    const next = vi.fn()

    await createOrder(req, res, next)

    expect(next).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.body).toEqual(expect.objectContaining({
      success: true,
      order: expect.objectContaining({
        id:          'order-1',
        item_count:  1,
        design_name: 'Buriad degel',
      }),
    }))
    expect(client.query).toHaveBeenCalledWith('COMMIT')
    expect(client.query.mock.calls.filter(([sql]) =>
      String(sql).includes('INSERT INTO snapshot_measurements')
    )).toHaveLength(6)
    expect(client.query.mock.calls.some(([sql]) =>
      String(sql).includes('INSERT INTO order_status_history')
    )).toBe(true)
    expect(client.release).toHaveBeenCalledTimes(1)
  })

  it('returns 400 when a required measurement is outside allowed range', async () => {
    // Order.submit() — validation pool.connect() дуудахаас ӨМНӨ болдог
    // тиймээс ROLLBACK дуудагддаггүй, connect ч хийгддэггүй
    const client = makeClient(() => ({ rows: [] }))
    pool.connect.mockResolvedValue(client)

    const req = makeReq({
      body: {
        items: [{ design_id: 'design-1', quantity: 1 }],
        measurements: { ...defaultMeasurements, chest: 10 }, // 40-180 хооронд байх ёстой
      },
    })
    const res  = makeRes()
    const next = vi.fn()

    await createOrder(req, res, next)

    expect(res.json).not.toHaveBeenCalled()
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }))
    // model validation нь pool.connect()-с ΘМнΘ явагддаг тул client дуудагддаггүй
    expect(pool.connect).not.toHaveBeenCalled()
  })
})

// ============================================================
describe('static/mock payment flow', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('creates a QPay-style mock invoice for accepted orders', async () => {
    qpay.createInvoice.mockResolvedValue({
      invoiceId: 'MOCK-ORDER-1', qrImage: 'data:image/png;base64,qr',
      qrText: 'MOCK_QPAY|ORDER-1|120000', urls: [], isMock: true,
    })

    // createInvoice controller: pool.query захиалга шалгана
    // Payment.createOrReuse(): pool.connect → client.query
    // Payment.capture(): pool.query UPDATE transaction_reference
    pool.query.mockImplementation(async (sql) => {
      if (sql.includes('FROM orders') && sql.includes('customer_id = $2')) {
        return { rows: [{ id: 'order-1', order_number: 'ORD-12345678', status: 'accepted', total_amount: '120000.00' }] }
      }
      // Payment.capture() — transaction_reference update
      if (sql.includes('UPDATE payments SET transaction_reference')) return { rows: [] }
      return { rows: [] }
    })

    const client = makeClient((sql) => {
      // Payment.createOrReuse() — pending payment шалгана
      if (sql.includes('FROM payments') && sql.includes("status = 'pending'")) return { rows: [] }
      // шинэ payment үүсгэнэ
      if (sql.includes('INSERT INTO payments')) return { rows: [{ id: 'payment-1', order_id: 'order-1', amount: '120000.00', method: 'qpay', status: 'pending' }] }
      // order дэлгэрэнгүй авна
      if (sql.includes('SELECT status AS order_status')) return { rows: [{ order_status: 'accepted', customer_id: 'customer-1', order_number: 'ORD-12345678' }] }
      return { rows: [] }
    })
    pool.connect.mockResolvedValue(client)

    const req  = makeReq({ params: { id: 'order-1' } })
    const res  = makeRes()
    const next = vi.fn()

    await createInvoice(req, res, next)

    expect(next).not.toHaveBeenCalled()
    expect(qpay.createInvoice).toHaveBeenCalledWith(expect.objectContaining({
      orderId: 'order-1', orderNumber: 'ORD-12345678', amount: 120000,
    }))
    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.body).toEqual(expect.objectContaining({
      payment_id: 'payment-1',
      qr_image:   'data:image/png;base64,qr',
      is_mock:    true,
    }))
    expect(client.query).toHaveBeenCalledWith('COMMIT')
  })

  it('marks mock payment row as paid after the mocked checker succeeds', async () => {
    qpay.checkPayment.mockResolvedValue({
      paid: true, paidAt: '2026-05-18T01:00:00.000Z', amount: 120000,
    })

    // Payment.findById() — pool.query (static method)
    pool.query.mockImplementation(async (sql) => {
      if (sql.includes('FROM payments p') && sql.includes('JOIN orders o') && sql.includes('WHERE p.id = $1')) {
        return {
          rows: [{
            id: 'payment-1', order_id: 'order-1', status: 'pending',
            transaction_reference: 'MOCK-ORDER-1', amount: '120000.00',
            customer_id: 'customer-1', order_status: 'accepted', order_number: 'ORD-12345678',
          }],
        }
      }
      return { rows: [] }
    })

    // Payment.verify() — pool.connect → client.query
    const client = makeClient((sql) => {
      if (sql.includes('SELECT tailor_id, order_number FROM orders')) {
        return { rows: [{ tailor_id: 'tailor-1', order_number: 'ORD-12345678' }] }
      }
      return { rows: [] }
    })
    pool.connect.mockResolvedValue(client)

    const req  = makeReq({ params: { paymentId: 'payment-1' } })
    const res  = makeRes()
    const next = vi.fn()

    await checkPayment(req, res, next)

    expect(next).not.toHaveBeenCalled()
    expect(qpay.checkPayment).toHaveBeenCalledWith('MOCK-ORDER-1')
    expect(client.query.mock.calls.some(([sql]) =>
      String(sql).includes("UPDATE payments SET status = 'paid'")
    )).toBe(true)
    expect(notify.send).toHaveBeenCalledWith(client, expect.objectContaining({
      userId:  'tailor-1',
      orderId: 'order-1',
    }))
    expect(res.body).toEqual({ success: true, paid: true, order_status: 'accepted' })
    expect(client.query).toHaveBeenCalledWith('COMMIT')
  })
})

// ============================================================
describe('admin and tailor status flow', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('lets admin assign a submitted order to a verified active tailor', async () => {
    // assignOrderToTailor — controller шууд pool.connect ашиглана (model биш)
    const client = makeClient((sql) => {
      if (sql.includes('FROM users u') && sql.includes("u.role='tailor'")) {
        return { rows: [{ id: 'tailor-1', full_name: 'Oyuna' }] }
      }
      if (sql.includes('FROM orders') && sql.includes('FOR UPDATE')) {
        return { rows: [{ id: 'order-1', order_number: 'ORD-12345678', status: 'submitted', customer_id: 'customer-1' }] }
      }
      if (sql.includes('UPDATE orders') && sql.includes("status='accepted'")) {
        return {
          rows: [{
            id: 'order-1', order_number: 'ORD-12345678',
            status: 'accepted', total_amount: '120000.00',
            created_at: '2026-05-18T00:00:00.000Z', tailor_id: 'tailor-1',
          }],
        }
      }
      return { rows: [] }
    })
    pool.connect.mockResolvedValue(client)

    const req  = makeReq({ params: { id: 'order-1' }, body: { tailor_id: 'tailor-1' }, user: { id: 'admin-1', role: 'admin' } })
    const res  = makeRes()
    const next = vi.fn()

    await assignOrderToTailor(req, res, next)

    expect(next).not.toHaveBeenCalled()
    expect(res.body.order).toEqual(expect.objectContaining({
      id: 'order-1', status: 'accepted', tailor_id: 'tailor-1', tailor_name: 'Oyuna',
    }))
    expect(notify.send).toHaveBeenCalledTimes(2)
    expect(notify.send).toHaveBeenCalledWith(client, expect.objectContaining({ userId: 'tailor-1' }))
    expect(notify.send).toHaveBeenCalledWith(client, expect.objectContaining({ userId: 'customer-1' }))
    expect(client.query).toHaveBeenCalledWith('COMMIT')
  })

  it('lets tailor move a paid order into production', async () => {
    // updateOrderStatus → Tailor.reviewOrder() → Order.findByIdForTailor() (pool.query) → order.changeStatus() (pool.connect)
    // controller дараа нь pool.query-аар customer_id татна, pool.connect-аар notify илгээнэ

    pool.query.mockImplementation(async (sql) => {
      // Order.findByIdForTailor — tailor-ийн захиалга олно (töbör tölögdsön → deposit_paid)
      if (sql.includes('FROM orders o') && sql.includes('tailor_id = $2')) {
        return { rows: [{ id: 'order-1', status: 'deposit_paid', order_number: 'ORD-12345678', customer_id: 'customer-1', tailor_id: 'tailor-1' }] }
      }
      // controller notification query
      if (sql.includes('SELECT customer_id FROM orders')) {
        return { rows: [{ customer_id: 'customer-1' }] }
      }
      return { rows: [] }
    })

    const client = makeClient((sql) => {
      // Order.changeStatus() — UPDATE orders
      if (sql.includes('UPDATE orders') && sql.includes('RETURNING id, order_number')) {
        return {
          rows: [{
            id: 'order-1', order_number: 'ORD-12345678',
            status: 'in_production', total_amount: '120000.00',
            created_at: '2026-05-18T00:00:00.000Z',
          }],
        }
      }
      return { rows: [] }
    })
    pool.connect.mockResolvedValue(client)

    const req  = makeReq({ params: { id: 'order-1' }, body: { status: 'in_production', note: 'started' }, user: { id: 'tailor-1', role: 'tailor' } })
    const res  = makeRes()
    const next = vi.fn()

    await updateOrderStatus(req, res, next)

    expect(next).not.toHaveBeenCalled()
    expect(res.body.order).toEqual(expect.objectContaining({ id: 'order-1', status: 'in_production' }))
    expect(notify.send).toHaveBeenCalledWith(client, expect.objectContaining({
      userId: 'customer-1', orderId: 'order-1',
    }))
    expect(client.query).toHaveBeenCalledWith('COMMIT')
  })

  it('lets tailor mark an in-production order as ready for delivery', async () => {
    pool.query.mockImplementation(async (sql) => {
      if (sql.includes('FROM orders o') && sql.includes('tailor_id = $2')) {
        return { rows: [{ id: 'order-1', status: 'in_production', order_number: 'ORD-12345678', customer_id: 'customer-1', tailor_id: 'tailor-1' }] }
      }
      if (sql.includes('SELECT customer_id FROM orders')) {
        return { rows: [{ customer_id: 'customer-1' }] }
      }
      return { rows: [] }
    })

    const client = makeClient((sql) => {
      if (sql.includes('UPDATE orders') && sql.includes('RETURNING id, order_number')) {
        return {
          rows: [{
            id: 'order-1', order_number: 'ORD-12345678',
            status: 'ready', total_amount: '120000.00',
            created_at: '2026-05-18T00:00:00.000Z',
          }],
        }
      }
      return { rows: [] }
    })
    pool.connect.mockResolvedValue(client)

    const req  = makeReq({ params: { id: 'order-1' }, body: { status: 'ready', note: 'sewing done' }, user: { id: 'tailor-1', role: 'tailor' } })
    const res  = makeRes()
    const next = vi.fn()

    await updateOrderStatus(req, res, next)

    expect(next).not.toHaveBeenCalled()
    expect(res.body.order).toEqual(expect.objectContaining({ id: 'order-1', status: 'ready' }))
    expect(notify.send).toHaveBeenCalledWith(client, expect.objectContaining({
      userId: 'customer-1', orderId: 'order-1',
    }))
    expect(client.query).toHaveBeenCalledWith('COMMIT')
  })

  it('lets tailor create shipment details when a ready order goes out for delivery', async () => {
    // shipOrder — controller шууд pool.connect ашиглана
    const client = makeClient((sql) => {
      if (sql.includes('SELECT o.id, o.status')) {
        return { rows: [{ id: 'order-1', status: 'ready' }] }
      }
      // status='shipped' (space байхгүй)
      if (sql.includes("status='shipped'")) {
        return {
          rows: [{
            id: 'order-1', order_number: 'ORD-12345678',
            status: 'shipped', total_amount: '120000.00',
            created_at: '2026-05-18T00:00:00.000Z',
          }],
        }
      }
      if (sql.includes('SELECT customer_id, order_number FROM orders')) {
        return { rows: [{ customer_id: 'customer-1', order_number: 'ORD-12345678' }] }
      }
      return { rows: [] }
    })
    pool.connect.mockResolvedValue(client)

    const req  = makeReq({
      params: { id: 'order-1' },
      body:   { mode: 'courier', carrier_name: 'Mongol Shuudan', tracking_code: 'MN123456789', note: 'door delivery' },
      user:   { id: 'tailor-1', role: 'tailor' },
    })
    const res  = makeRes()
    const next = vi.fn()

    await shipOrder(req, res, next)

    expect(next).not.toHaveBeenCalled()
    expect(res.body.order).toEqual(expect.objectContaining({ id: 'order-1', status: 'shipped' }))
    expect(client.query.mock.calls.some(([sql]) => String(sql).includes('INSERT INTO shipments'))).toBe(true)
    expect(client.query.mock.calls.some(([sql]) => String(sql).includes('INSERT INTO order_status_history'))).toBe(true)
    expect(notify.send).toHaveBeenCalledWith(client, expect.objectContaining({
      userId: 'customer-1', orderId: 'order-1',
    }))
    expect(client.query).toHaveBeenCalledWith('COMMIT')
  })

  it('rejects invalid tailor status transitions', async () => {
    // accepted → delivered: ALLOWED_TRANSITIONS-д байхгүй → 400
    pool.query.mockImplementation(async (sql) => {
      if (sql.includes('FROM orders o') && sql.includes('tailor_id = $2')) {
        return { rows: [{ id: 'order-1', status: 'accepted', order_number: 'ORD-12345678', customer_id: 'customer-1', tailor_id: 'tailor-1' }] }
      }
      return { rows: [] }
    })

    const client = makeClient(() => ({ rows: [] }))
    pool.connect.mockResolvedValue(client)

    const req  = makeReq({ params: { id: 'order-1' }, body: { status: 'delivered' }, user: { id: 'tailor-1', role: 'tailor' } })
    const res  = makeRes()
    const next = vi.fn()

    await updateOrderStatus(req, res, next)

    expect(res.json).not.toHaveBeenCalled()
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }))
    // changeStatus() validation pool.connect()-с ӨМНӨ болдог тул ROLLBACK дуудагддаггүй
    expect(pool.connect).not.toHaveBeenCalledWith() // transaction хийгдээгүй
  })
})

// ============================================================
describe('order chat flow', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('creates thread if needed and stores customer message for assigned order', async () => {
    // assertParticipant → pool.query (orders)
    // Consultation.getOrCreate() → pool.query (consultation_threads, INSERT)
    // consultation.sendMessage() → pool.connect → client.query

    pool.query.mockImplementation(async (sql) => {
      if (sql.includes('FROM orders') && sql.includes('WHERE id = $1')) {
        return { rows: [{ id: 'order-1', order_number: 'ORD-12345678', customer_id: 'customer-1', tailor_id: 'tailor-1' }] }
      }
      if (sql.includes('FROM consultation_threads')) {
        return { rows: [] } // thread байхгүй → шинэ үүсгэнэ
      }
      if (sql.includes('INSERT INTO consultation_threads')) {
        return { rows: [{ id: 'thread-1', customer_id: 'customer-1', tailor_id: 'tailor-1', order_id: 'order-1', status: 'open' }] }
      }
      return { rows: [] }
    })

    const client = makeClient((sql) => {
      if (sql.includes('INSERT INTO consultation_messages')) {
        return {
          rows: [{
            id: 'message-1', sender_id: 'customer-1', sender_role: 'customer',
            message_body: 'Material deer yariltsaya', attachment_url: null,
            sent_at: '2026-05-18T00:00:00.000Z',
          }],
        }
      }
      return { rows: [] }
    })
    pool.connect.mockResolvedValue(client)

    const req  = makeReq({ params: { orderId: 'order-1' }, body: { message_body: '  Material deer yariltsaya  ' } })
    const res  = makeRes()
    const next = vi.fn()

    await sendMessage(req, res, next)

    expect(next).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.body.message).toEqual(expect.objectContaining({
      id: 'message-1', message_body: 'Material deer yariltsaya',
    }))
    expect(notify.send).toHaveBeenCalledWith(client, expect.objectContaining({
      userId: 'tailor-1', orderId: 'order-1',
    }))
    expect(client.query).toHaveBeenCalledWith('COMMIT')
  })

  it('does not allow empty chat messages', async () => {
    // assertParticipant хэвийн ажиллана, дараа нь sendMessage validation throwдно
    pool.query.mockImplementation(async (sql) => {
      if (sql.includes('FROM orders') && sql.includes('WHERE id = $1')) {
        return { rows: [{ id: 'order-1', order_number: 'ORD-12345678', customer_id: 'customer-1', tailor_id: 'tailor-1' }] }
      }
      if (sql.includes('FROM consultation_threads')) {
        return { rows: [{ id: 'thread-1', customer_id: 'customer-1', tailor_id: 'tailor-1', order_id: 'order-1', status: 'open' }] }
      }
      return { rows: [] }
    })

    const client = makeClient(() => ({ rows: [] }))
    pool.connect.mockResolvedValue(client)

    const req  = makeReq({ params: { orderId: 'order-1' }, body: { message_body: '   ' } })
    const res  = makeRes()
    const next = vi.fn()

    await sendMessage(req, res, next)

    expect(res.json).not.toHaveBeenCalled()
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }))
    // validation pool.connect()-с өмнө throwдоно
    expect(pool.connect).not.toHaveBeenCalled()
  })
})
