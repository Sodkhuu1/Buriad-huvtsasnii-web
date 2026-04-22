// errorHandler iin test — createError helper bolon middleware iig shalgana
// describe/it/expect/vi ni vitest.config iin globals:true deeres avsan
const { errorHandler, createError } = require('../../../src/middleware/errorHandler')

describe('createError', () => {
  it('statusCode bolon message iig zov utga togtson error uusgene', () => {
    const err = createError(404, 'User not found')
    expect(err).toBeInstanceOf(Error)
    expect(err.statusCode).toBe(404)
    expect(err.message).toBe('User not found')
  })
})

describe('errorHandler middleware', () => {
  let req, res, next

  beforeEach(() => {
    // console.error iig dargad, test output iig tsever baihaar bolgono
    vi.spyOn(console, 'error').mockImplementation(() => {})
    req = {}
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    }
    next = vi.fn()
  })

  it('statusCode baival tegeed n ashiglana', () => {
    const err = createError(401, 'Not authorized')
    errorHandler(err, req, res, next)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Not authorized',
    })
  })

  it('statusCode bhgui uyd 500 gej uzne', () => {
    const err = new Error('boom')
    errorHandler(err, req, res, next)

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'boom',
    })
  })

  it('message huuchin bsanch l "Internal server error" gej buchaana', () => {
    const err = new Error()
    err.message = ''
    errorHandler(err, req, res, next)

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Internal server error',
    })
  })
})
