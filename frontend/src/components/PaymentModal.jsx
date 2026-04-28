import { useEffect, useRef, useState } from 'react'
import { api } from '../api'
import './PaymentModal.css'

// QPay-iin invoice-iig harah + 3 sek tutamd polling-oor toloviig shalgah modal
// onSuccess: paid bolson uyed duudagdana — order-iig dahin tatakhad zoriulagdana
export default function PaymentModal({ orderId, amount, onClose, onSuccess }) {
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [invoice, setInvoice]   = useState(null)   // { qr_image, qr_text, urls, payment_id, is_mock }
  const [paid, setPaid]         = useState(false)
  const pollRef = useRef(null)

  // Modal neegded uydaa shuud invoice usgene
  useEffect(() => {
    let cancelled = false
    api.post(`/payments/orders/${orderId}/invoice`)
      .then(data => {
        if (cancelled) return
        setInvoice(data)
      })
      .catch(err => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false))

    return () => { cancelled = true }
  }, [orderId])

  // Invoice usegded baigaa uyed 3 sek tutamd polling
  useEffect(() => {
    if (!invoice?.payment_id || paid) return

    const tick = async () => {
      try {
        const data = await api.get(`/payments/${invoice.payment_id}/check`)
        if (data.paid) {
          setPaid(true)
          clearInterval(pollRef.current)
          // Uchaalal harag avahaar zaa setgegtsel
          setTimeout(() => onSuccess?.(), 1200)
        }
      } catch {
        // network alga ehud davtana, geheed silentlaad
      }
    }

    pollRef.current = setInterval(tick, 3000)
    return () => clearInterval(pollRef.current)
  }, [invoice, paid, onSuccess])

  return (
    <div className="pm-overlay" onClick={onClose}>
      <div className="pm-modal" onClick={e => e.stopPropagation()}>
        <button className="pm-close" onClick={onClose}>×</button>

        <h3 className="pm-title">QPay төлбөр</h3>
        <p className="pm-amount">{Number(amount).toLocaleString()}₮</p>

        {loading && <div className="pm-state">QR код үүсгэж байна...</div>}

        {error && <div className="pm-state pm-state--error">{error}</div>}

        {invoice && !paid && (
          <>
            {invoice.is_mock && (
              <div className="pm-mock-banner">
                ⚠ Тестийн горим — 5 секундийн дотор автоматаар "төлсөн" гэж бүртгэгдэнэ
              </div>
            )}

            <div className="pm-qr-wrap">
              <img src={invoice.qr_image} alt="QPay QR" className="pm-qr" />
            </div>

            <p className="pm-hint">
              Дансны апп-аараа QR-ийг уншуулна уу. Төлбөр хийсний дараа автоматаар шинэчлэгдэнэ.
            </p>

            {invoice.urls && invoice.urls.length > 0 && (
              <div className="pm-banks">
                {invoice.urls.map((u, idx) => (
                  <a key={idx} href={u.link} target="_blank" rel="noreferrer" className="pm-bank-btn">
                    {u.name || u.description || 'Банк'}
                  </a>
                ))}
              </div>
            )}

            <div className="pm-polling">Шалгаж байна...</div>
          </>
        )}

        {paid && (
          <div className="pm-success">
            ✓ Төлбөр амжилттай хийгдлээ
          </div>
        )}
      </div>
    </div>
  )
}
