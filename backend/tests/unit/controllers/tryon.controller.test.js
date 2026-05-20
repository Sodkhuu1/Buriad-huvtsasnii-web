const { createTryOnServiceError } = require('../../../src/controllers/tryon.controller')

describe('try-on controller error mapping', () => {
  it('maps Gradio app config failures to a clear service-unavailable error', () => {
    const err = createTryOnServiceError(new Error('Could not resolve app config.'))

    expect(err.statusCode).toBe(503)
    expect(err.message).toContain('TRYON_SPACE')
  })

  it('keeps local validation errors unchanged', () => {
    const validationError = new Error('bad input')
    validationError.statusCode = 400

    const err = createTryOnServiceError(validationError)

    expect(err).toBe(validationError)
  })
})
