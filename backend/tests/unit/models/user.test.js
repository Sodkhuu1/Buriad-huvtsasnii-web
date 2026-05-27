// user.test.js — User, Customer, Tailor, Admin class-уудыг шалгана
// pool mock — DB дуудалт хийхгүй

const pool = { query: vi.fn(), connect: vi.fn() }
const mockModule = (path, exports) => {
  const resolved = require.resolve(path)
  require.cache[resolved] = { id: resolved, filename: resolved, loaded: true, exports }
}
mockModule('../../../src/db', pool)

const User     = require('../../../src/models/User')
const Customer = require('../../../src/models/Customer')
const Tailor   = require('../../../src/models/Tailor')
const Admin    = require('../../../src/models/Admin')

// ── factory ──────────────────────────────────────────────

describe('User.factory()', () => {
  it('customer role → Customer instance буцаана', () => {
    const u = User.factory({ id: '1', role: 'customer', full_name: 'Test' })
    expect(u).toBeInstanceOf(Customer)
    expect(u).toBeInstanceOf(User)
  })

  it('tailor role → Tailor instance буцаана', () => {
    const u = User.factory({ id: '2', role: 'tailor', full_name: 'Tailor' })
    expect(u).toBeInstanceOf(Tailor)
    expect(u).toBeInstanceOf(User)
  })

  it('admin role → Admin instance буцаана', () => {
    const u = User.factory({ id: '3', role: 'admin', full_name: 'Admin' })
    expect(u).toBeInstanceOf(Admin)
    expect(u).toBeInstanceOf(User)
  })

  it('үл мэдэгдэх role → суурь User буцаана', () => {
    const u = User.factory({ id: '4', role: 'unknown' })
    expect(u.constructor.name).toBe('User')
  })
})

// ── toJSON ────────────────────────────────────────────────

describe('User#toJSON()', () => {
  it('нууц үг болон хоосон талбарыг хасна', () => {
    const u = new User({
      id: 'u1', full_name: 'Bat', email: 'bat@test.mn',
      phone: '99001234', gender: 'male', age: 25,
      role: 'customer', status: 'active', password_hash: 'secret',
    })
    const json = u.toJSON()

    expect(json.id).toBe('u1')
    expect(json.full_name).toBe('Bat')
    expect(json.email).toBe('bat@test.mn')
    expect(json.password_hash).toBeUndefined()
  })
})

// ── generateToken ─────────────────────────────────────────

describe('User#generateToken()', () => {
  beforeEach(() => { process.env.JWT_SECRET = 'test-secret' })

  it('JWT string буцаана', () => {
    const u = new User({ id: 'u1', email: 'x@x.mn', role: 'customer' })
    const token = u.generateToken()
    expect(typeof token).toBe('string')
    expect(token.split('.').length).toBe(3) // header.payload.signature
  })

  it('token-д id, email, role багтана', () => {
    const jwt = require('jsonwebtoken')
    const u   = new User({ id: 'abc', email: 'me@test.mn', role: 'tailor' })
    const token   = u.generateToken()
    const decoded = jwt.verify(token, 'test-secret')

    expect(decoded.id).toBe('abc')
    expect(decoded.email).toBe('me@test.mn')
    expect(decoded.role).toBe('tailor')
  })
})

// ── Customer constructor ───────────────────────────────────

describe('Customer', () => {
  it('User-ийн бүх талбарыг удамшина', () => {
    const c = new Customer({ id: 'c1', full_name: 'Tuya', email: 'tuya@mn', role: 'customer', status: 'active' })
    expect(c.fullName).toBe('Tuya')
    expect(c.role).toBe('customer')
  })
})

// ── Tailor constructor ─────────────────────────────────────

describe('Tailor', () => {
  it('businessName, specialization, averageRating, verified талбарууд байна', () => {
    const t = new Tailor({
      id: 't1', full_name: 'Oyuna', role: 'tailor',
      business_name: 'Buriad Studio', specialization: 'deel',
      rating: 4.8, verified: true,
    })
    expect(t.businessName).toBe('Buriad Studio')
    expect(t.specialization).toBe('deel')
    expect(t.averageRating).toBe(4.8)
    expect(t.verified).toBe(true)
  })
})
