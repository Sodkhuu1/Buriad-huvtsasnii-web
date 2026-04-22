// auth middleware iin test — JWT, cookie, header iig shalgana
// describe/it/expect/vi gedeg ni globals:true deeres avsan
const jwt = require('jsonwebtoken')
const { protect, requireRole } = require('../../../src/middleware/auth')

const SECRET = 'test-secret-123'

describe('protect middleware', () => {
  let req, res, next

  beforeEach(() => {
    process.env.JWT_SECRET = SECRET
    req = { cookies: {}, headers: {} }
    res = {}
    next = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('token oogui bol 401 aldaa butsana', () => {
    protect(req, res, next)

    const err = next.mock.calls[0][0]
    expect(err).toBeInstanceOf(Error)
    expect(err.statusCode).toBe(401)
    expect(err.message).toMatch(/no token/i)
  })

  it('cookie deereh zov token iig huleen avna', () => {
    const token = jwt.sign({ id: 1, role: 'customer' }, SECRET)
    req.cookies.auth_token = token

    protect(req, res, next)

    expect(next).toHaveBeenCalledWith() // aldaa oogui
    expect(req.user.id).toBe(1)
    expect(req.user.role).toBe('customer')
  })

  it('Authorization header deer Bearer token bsan ch ajillana', () => {
    const token = jwt.sign({ id: 2, role: 'tailor' }, SECRET)
    req.headers.authorization = `Bearer ${token}`

    protect(req, res, next)

    expect(next).toHaveBeenCalledWith()
    expect(req.user.role).toBe('tailor')
  })

  it('buruu token bol 401 butsana', () => {
    req.cookies.auth_token = 'yanz buriin hog'

    protect(req, res, next)

    const err = next.mock.calls[0][0]
    expect(err.statusCode).toBe(401)
    expect(err.message).toMatch(/invalid token/i)
  })
})

describe('requireRole middleware', () => {
  let req, res, next

  beforeEach(() => {
    req = { user: { role: 'customer' } }
    res = {}
    next = vi.fn()
  })

  it('user iin role tohirson bol nevtresgene', () => {
    const mw = requireRole('customer', 'admin')
    mw(req, res, next)
    expect(next).toHaveBeenCalledWith()
  })

  it('role tohiroogui bol 403 butsana', () => {
    const mw = requireRole('admin')
    mw(req, res, next)

    const err = next.mock.calls[0][0]
    expect(err).toBeInstanceOf(Error)
    expect(err.statusCode).toBe(403)
  })
})
