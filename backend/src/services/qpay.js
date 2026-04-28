// qpay.js — QPay v2 API-той ярьдаг service
// Credentials байхгүй бол mock горим руу шилжинэ — diploma-ын демо боломжтой

const axios = require('axios')
const QRCode = require('qrcode')

const {
  QPAY_BASE_URL = 'https://merchant-sandbox.qpay.mn/v2',
  QPAY_CLIENT_ID,
  QPAY_CLIENT_SECRET,
  QPAY_INVOICE_CODE,
  QPAY_CALLBACK_URL,
} = process.env

// Mock horim mu? credentials hooson bol tiim
const isMock = () => !QPAY_CLIENT_ID || !QPAY_CLIENT_SECRET || !QPAY_INVOICE_CODE

// Mock urgcald invoice uusgesen tsagiig hadgalna, dараа нь paid esehiig shalgaj boldog
// In-memory store, server restart hiivel arilna (demo-d hangalttai)
const mockInvoices = new Map()
const MOCK_PAID_DELAY_MS = 5000

// QPay-iin token cache
let cachedToken = null
let tokenExpiry = 0

const getAccessToken = async () => {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken

  // Basic auth-аар токен авна
  const basic = Buffer.from(`${QPAY_CLIENT_ID}:${QPAY_CLIENT_SECRET}`).toString('base64')
  const { data } = await axios.post(
    `${QPAY_BASE_URL}/auth/token`,
    {},
    { headers: { Authorization: `Basic ${basic}` } }
  )

  cachedToken = data.access_token
  // expires_in second-eer ireh tul ms ruu
  tokenExpiry = Date.now() + (data.expires_in - 60) * 1000
  return cachedToken
}

// Hangaltgai bol throw hiine, controller-d bariyad uildellt buruu daa gej buulgana
const createInvoice = async ({ orderId, orderNumber, amount, description }) => {
  if (isMock()) {
    // Mock: faka invoice + locally usgsen QR
    const fakeInvoiceId = `MOCK-${orderNumber}-${Date.now()}`
    const qrText = `MOCK_QPAY|${fakeInvoiceId}|${amount}`
    const qrImage = await QRCode.toDataURL(qrText, { width: 280 })

    mockInvoices.set(fakeInvoiceId, { createdAt: Date.now(), amount })

    return {
      invoiceId: fakeInvoiceId,
      qrText,
      qrImage,
      // Bodit QPay duudaltad bank-uudiin deeplink ireh — mock-d hooson shoroldoj baigaa
      urls: [],
      isMock: true,
    }
  }

  const token = await getAccessToken()
  const callbackUrl = QPAY_CALLBACK_URL ||
    `${process.env.SERVER_URL || 'http://localhost:5000'}/api/payments/qpay/callback?order_id=${orderId}`

  const { data } = await axios.post(
    `${QPAY_BASE_URL}/invoice`,
    {
      invoice_code: QPAY_INVOICE_CODE,
      sender_invoice_no: orderNumber,
      invoice_receiver_code: 'terminal',
      invoice_description: description || `Захиалга ${orderNumber}`,
      amount,
      callback_url: callbackUrl,
    },
    { headers: { Authorization: `Bearer ${token}` } }
  )

  return {
    invoiceId: data.invoice_id,
    qrText: data.qr_text,
    qrImage: `data:image/png;base64,${data.qr_image}`,
    urls: data.urls || [],
    isMock: false,
  }
}

// True bol tölögdsön
const checkPayment = async (invoiceId) => {
  if (isMock()) {
    const rec = mockInvoices.get(invoiceId)
    if (!rec) return { paid: false }

    // 5 sekundiin daraa avtomataar paid bolgono
    if (Date.now() - rec.createdAt >= MOCK_PAID_DELAY_MS) {
      return {
        paid: true,
        paidAt: new Date().toISOString(),
        amount: rec.amount,
      }
    }
    return { paid: false }
  }

  const token = await getAccessToken()
  const { data } = await axios.post(
    `${QPAY_BASE_URL}/payment/check`,
    {
      object_type: 'INVOICE',
      object_id: invoiceId,
      offset: { page_number: 1, page_limit: 100 },
    },
    { headers: { Authorization: `Bearer ${token}` } }
  )

  // count > 0 baival ali negen card-r tölögdsön
  if (data.count > 0 && data.rows && data.rows.length) {
    const row = data.rows[0]
    return {
      paid: row.payment_status === 'PAID',
      paidAt: row.payment_date,
      amount: parseFloat(row.payment_amount),
    }
  }
  return { paid: false }
}

module.exports = { createInvoice, checkPayment, isMock }
