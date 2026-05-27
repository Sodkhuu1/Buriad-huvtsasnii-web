// order.test.js — Order class-ийн business logic-ийг шалгана
// DB mock хийдэг тул SQL дуудалт байхгүй

const pool = { query: vi.fn(), connect: vi.fn() }
const notify = { send: vi.fn() }
const mockModule = (path, exports) => {
  const resolved = require.resolve(path)
  require.cache[resolved] = { id: resolved, filename: resolved, loaded: true, exports }
}
mockModule('../../../src/db', pool)
mockModule('../../../src/services/notifications', notify)

const Order = require('../../../src/models/Order')

// ── calculateTotal ─────────────────────────────────────────

describe('Order#calculateTotal()', () => {
  it('items байхгүй бол 0 буцаана', () => {
    const o = new Order({ id: 'o1', status: 'submitted', total_amount: '0' })
    expect(o.calculateTotal()).toBe(0)
  })

  it('нэгж үнэ × тоо хэмжээг нэмнэ', () => {
    const o = new Order({ id: 'o1', status: 'submitted', total_amount: '0' })
    o.items = [
      { unitPrice: 120000, quantity: 1 },
      { unitPrice:  50000, quantity: 2 },
    ]
    expect(o.calculateTotal()).toBe(220000)
  })
})

// ── toJSON ─────────────────────────────────────────────────

describe('Order#toJSON()', () => {
  it('DB raw талбарыг camelCase-аас хөрвүүлнэ', () => {
    const o = new Order({
      id: 'o1', order_number: 'ORD-001', status: 'submitted',
      total_amount: '120000.00', created_at: '2026-01-01',
    })
    const json = o.toJSON()
    expect(json.order_number).toBe('ORD-001')
    expect(json.total_amount).toBe(120000)
    expect(json.status).toBe('submitted')
  })
})

// ── changeStatus — validation ──────────────────────────────

describe('Order#changeStatus() — статус шилжилтийн шалгалт', () => {
  const makeClient = () => ({
    query:   vi.fn(async (sql) => {
      if (sql === 'BEGIN' || sql === 'COMMIT' || sql === 'ROLLBACK') return { rows: [] }
      if (String(sql).includes('UPDATE orders')) return { rows: [{ id: 'o1', order_number: 'ORD-001', status: 'in_production', total_amount: '0', created_at: null }] }
      return { rows: [] }
    }),
    release: vi.fn(),
  })

  beforeEach(() => { vi.clearAllMocks() })

  it('зөвшөөрөгдсөн шилжилт (accepted → in_production) ажиллана', async () => {
    const client = makeClient()
    pool.connect.mockResolvedValue(client)

    const o = new Order({ id: 'o1', order_number: 'ORD-001', status: 'accepted', total_amount: '0' })
    const result = await o.changeStatus('in_production', 'tailor-1', 'started')

    expect(result.status).toBe('in_production')
    expect(o.status).toBe('in_production')
    expect(client.query).toHaveBeenCalledWith('COMMIT')
    expect(client.release).toHaveBeenCalledTimes(1)
  })

  it('зөвшөөрөгдөөгүй шилжилт (accepted → delivered) 400 алдаа өгнө', async () => {
    const client = makeClient()
    pool.connect.mockResolvedValue(client)

    const o = new Order({ id: 'o1', order_number: 'ORD-001', status: 'accepted', total_amount: '0' })

    await expect(o.changeStatus('delivered', 'tailor-1')).rejects.toMatchObject({ statusCode: 400 })
    // validation нь pool.connect()-с ӨМНӨ болдог тул transaction хийгдэхгүй
    expect(pool.connect).not.toHaveBeenCalled()
  })

  it('submitted → accepted шилжилт зөвшөөрөгддөг', async () => {
    const client = makeClient()
    pool.connect.mockResolvedValue(client)

    const o = new Order({ id: 'o1', order_number: 'ORD-001', status: 'submitted', total_amount: '0' })
    const result = await o.changeStatus('accepted', 'admin-1')

    expect(result).toBeTruthy()
    expect(client.query).toHaveBeenCalledWith('COMMIT')
  })
})

// ── cancel ─────────────────────────────────────────────────

describe('Order#cancel()', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('submitted биш захиалга цуцлахад 400 өгнө', async () => {
    const client = { query: vi.fn(async () => ({ rows: [] })), release: vi.fn() }
    pool.connect.mockResolvedValue(client)

    const o = new Order({ id: 'o1', status: 'in_production', total_amount: '0' })

    await expect(o.cancel('customer-1')).rejects.toMatchObject({ statusCode: 400 })
  })

  it('submitted захиалгыг амжилттай цуцална', async () => {
    const client = {
      query:   vi.fn(async (sql) => {
        if (['BEGIN', 'COMMIT', 'ROLLBACK'].includes(String(sql))) return { rows: [] }
        if (String(sql).includes("SET status = 'cancelled'")) {
          return { rows: [{ id: 'o1', order_number: 'ORD-001', status: 'cancelled', total_amount: '0', created_at: null }] }
        }
        return { rows: [] }
      }),
      release: vi.fn(),
    }
    pool.connect.mockResolvedValue(client)

    const o = new Order({ id: 'o1', order_number: 'ORD-001', status: 'submitted', total_amount: '0', tailor_id: null })
    const result = await o.cancel('customer-1', 'Миний шийдвэр')

    expect(result.status).toBe('cancelled')
    expect(o.status).toBe('cancelled')
    expect(client.query).toHaveBeenCalledWith('COMMIT')
    expect(client.release).toHaveBeenCalledTimes(1)
  })
})

// ── submit — measurement validation ───────────────────────

describe('Order.submit() — хэмжээсийн шалгалт', () => {
  const validMeasurements = { height: 170, chest: 90, waist: 72, hip: 96, sleeve: 58, shoulder: 42 }

  it('хэмжээс дутуу бол 400 алдаа өгнө', async () => {
    const { height: _h, ...noHeight } = validMeasurements

    await expect(Order.submit({
      customerId: 'c1',
      items:      [{ design_id: 'gd-1', quantity: 1 }],
      measurements: noHeight,
    })).rejects.toMatchObject({ statusCode: 400 })
  })

  it('хэмжээс хүрэх хязгаараас гарвал 400 алдаа өгнө', async () => {
    await expect(Order.submit({
      customerId: 'c1',
      items:      [{ design_id: 'gd-1', quantity: 1 }],
      measurements: { ...validMeasurements, chest: 5 }, // 40-с бага
    })).rejects.toMatchObject({ statusCode: 400 })
  })

  it('хэмжээс дээд хязгаараас гарвал 400 алдаа өгнө', async () => {
    await expect(Order.submit({
      customerId: 'c1',
      items:      [{ design_id: 'gd-1', quantity: 1 }],
      measurements: { ...validMeasurements, shoulder: 999 }, // 80-аас их
    })).rejects.toMatchObject({ statusCode: 400 })
  })

  it('хэмжээс буруу бол pool.connect() дуудагддаггүй', async () => {
    vi.clearAllMocks()
    await Order.submit({
      customerId: 'c1',
      items:      [{ design_id: 'gd-1', quantity: 1 }],
      measurements: { ...validMeasurements, chest: 10 },
    }).catch(() => {})

    expect(pool.connect).not.toHaveBeenCalled()
  })
})
