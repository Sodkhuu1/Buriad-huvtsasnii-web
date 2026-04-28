const { createError } = require('../middleware/errorHandler')

const TRYON_SPACE = process.env.TRYON_SPACE || 'yisol/IDM-VTON'
const TRYON_STEPS = Number(process.env.TRYON_STEPS || 30)
const TRYON_SEED = Number(process.env.TRYON_SEED || 42)
const MAX_IMAGE_BYTES = Number(process.env.TRYON_MAX_IMAGE_BYTES || 8 * 1024 * 1024)

const dataUrlToBlob = (dataUrl) => {
  const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,([a-zA-Z0-9+/=\r\n]+)$/.exec(dataUrl || '')
  if (!match) {
    throw createError(400, 'Зөв image data URL шаардлагатай')
  }

  const buffer = Buffer.from(match[2], 'base64')
  if (buffer.length > MAX_IMAGE_BYTES) {
    throw createError(413, 'Зургийн хэмжээ хэт их байна')
  }

  return new Blob([buffer], { type: match[1] })
}

const assertPublicImageUrl = (value) => {
  let url
  try {
    url = new URL(value)
  } catch {
    throw createError(400, 'Загварын зураг зөв URL байх ёстой')
  }

  if (!['http:', 'https:'].includes(url.protocol)) {
    throw createError(400, 'Зөвхөн http/https зураг ашиглана')
  }

  const host = url.hostname.toLowerCase()
  if (
    host === 'localhost' ||
    host === '0.0.0.0' ||
    host === '::1' ||
    host.startsWith('127.') ||
    host.endsWith('.local')
  ) {
    throw createError(400, 'Дотоод сүлжээний URL зөвшөөрөхгүй')
  }

  return url.toString()
}

const fetchImageBlob = async (url) => {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15000)

  try {
    const response = await fetch(url, { signal: controller.signal })
    if (!response.ok) {
      throw createError(400, 'Загварын зургийг татаж чадсангүй')
    }

    const contentType = response.headers.get('content-type') || ''
    if (!contentType.startsWith('image/')) {
      throw createError(400, 'Загварын URL зураг буцаах ёстой')
    }

    const blob = await response.blob()
    if (blob.size > MAX_IMAGE_BYTES) {
      throw createError(413, 'Загварын зургийн хэмжээ хэт их байна')
    }
    return blob
  } finally {
    clearTimeout(timeout)
  }
}

const runTryOn = async (req, res, next) => {
  try {
    const { human_image_data_url, garment_image_url, garment_name } = req.body || {}

    if (!human_image_data_url || !garment_image_url) {
      throw createError(400, 'human_image_data_url болон garment_image_url шаардлагатай')
    }

    const humanBlob = dataUrlToBlob(human_image_data_url)
    const garmentUrl = assertPublicImageUrl(garment_image_url)
    const garmentBlob = await fetchImageBlob(garmentUrl)

    const { Client } = await import('@gradio/client')
    const app = await Client.connect(TRYON_SPACE)
    const result = await app.predict('/tryon', [
      { background: humanBlob, layers: [], composite: null },
      garmentBlob,
      garment_name || 'garment',
      true,
      true,
      TRYON_STEPS,
      TRYON_SEED,
    ])

    const first = Array.isArray(result.data) ? result.data[0] : result.data
    const resultUrl = first?.url || first?.path || (typeof first === 'string' ? first : '')

    if (!resultUrl) {
      throw createError(502, 'Өмсөөд үзэх үр дүн олдсонгүй')
    }

    res.json({ success: true, result_url: resultUrl })
  } catch (err) {
    next(err)
  }
}

module.exports = { runTryOn }
