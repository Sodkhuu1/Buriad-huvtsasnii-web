import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../../api'
import { STATUS_LABEL, statusBadgeClass, TAILOR_ACTIONS, MEASUREMENT_LABEL, SHIPMENT_MODE_LABEL } from './tailorUtils'
import './TailorOrderDetail.css'

export default function TailorOrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState('')
  const [note, setNote] = useState('')
  const [showShipModal, setShowShipModal] = useState(false)

  useEffect(() => {
    api.get(`/tailor/orders/${id}`)
      .then(data => setOrder(data.order))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  const handleAction = async (nextStatus) => {
    setActionLoading(true)
    setError('')
    try {
      const data = await api.put(`/tailor/orders/${id}/status`, {
        status: nextStatus,
        note: note || undefined,
      })
      setOrder(data.order)
      setNote('')
    } catch (err) {
      setError(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) return <div className="td-loading">Ачааллаж байна...</div>
  if (!order)  return <div className="td-error">Захиалга олдсонгүй</div>

  const actions = TAILOR_ACTIONS[order.status] ?? []
  const measurements = order.measurements ?? {}

  return (
    <div>
      {/* Back button */}
      <button className="tod-back" onClick={() => navigate('/tailor/orders')}>
        ← Буцах
      </button>

      {/* Header */}
      <div className="tod-header">
        <div>
          <h1 className="td-page-title">#{order.order_number}</h1>
          <p className="td-page-sub">
            {new Date(order.created_at).toLocaleDateString('mn-MN', {
              year: 'numeric', month: 'long', day: 'numeric'
            })}
          </p>
        </div>
        <span className={`td-badge tod-status-badge ${statusBadgeClass(order.status)}`}>
          {STATUS_LABEL[order.status] ?? order.status}
        </span>
      </div>

      {error && <div className="td-error">{error}</div>}

      <div className="tod-grid">

        {/* Left column */}
        <div className="tod-col">

          {/* Design info */}
          <div className="td-card tod-design-card">
            <h3 className="tod-card-title">Захиалсан загвар</h3>
            <div className="tod-design">
              {order.design_image_url && (
                <img src={order.design_image_url} alt={order.design_name} className="tod-design__img" />
              )}
              <div className="tod-design__info">
                <div className="tod-design__name">{order.design_name}</div>
                <div className="tod-design__cat">{order.design_category}</div>
                {order.total_amount > 0 && (
                  <div className="tod-design__price">
                    {Number(order.total_amount).toLocaleString()}₮
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Customer info */}
          <div className="td-card">
            <h3 className="tod-card-title">Захиалагч</h3>
            <div className="tod-info-rows">
              <div className="tod-info-row">
                <span className="tod-info-key">Нэр</span>
                <span className="tod-info-val">{order.customer_name}</span>
              </div>
              {order.customer_phone && (
                <div className="tod-info-row">
                  <span className="tod-info-key">Утас</span>
                  <span className="tod-info-val">
                    <a href={`tel:${order.customer_phone}`} className="td-link">
                      {order.customer_phone}
                    </a>
                  </span>
                </div>
              )}
              {order.customer_email && (
                <div className="tod-info-row">
                  <span className="tod-info-key">И-мэйл</span>
                  <span className="tod-info-val">{order.customer_email}</span>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right column */}
        <div className="tod-col">

          {/* Measurements */}
          <div className="td-card">
            <h3 className="tod-card-title">Биеийн хэмжээс</h3>
            {Object.keys(measurements).length === 0 ? (
              <p className="tod-no-measure">Хэмжээс оруулаагүй байна</p>
            ) : (
              <div className="tod-measurements">
                {Object.entries(measurements).map(([key, val]) => (
                  <div key={key} className="tod-measure-row">
                    <span className="tod-measure-key">
                      {MEASUREMENT_LABEL[key] ?? key}
                    </span>
                    <span className="tod-measure-val">{val} см</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          {actions.length > 0 && (
            <div className="td-card tod-actions-card">
              <h3 className="tod-card-title">Үйлдэл хийх</h3>

              <textarea
                className="tod-note"
                placeholder="Тэмдэглэл (заавал биш)..."
                value={note}
                onChange={e => setNote(e.target.value)}
                rows={3}
              />

              <div className="tod-action-btns">
                {actions.map(action => (
                  <button
                    key={action.next}
                    className={`tod-action-btn tod-action-btn--${action.style}`}
                    onClick={() => handleAction(action.next)}
                    disabled={actionLoading}
                  >
                    {actionLoading ? 'Түр хүлээнэ үү...' : action.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Ready status: tusgaaer ilgeeh tovch */}
          {order.status === 'ready' && (
            <div className="td-card tod-actions-card">
              <h3 className="tod-card-title">Хүргэлтэд гаргах</h3>
              <p className="tod-ship-hint">
                Захиалга бэлэн боллоо. Хүргэлтийн горимыг сонгож илгээнэ үү.
              </p>
              <button
                className="tod-action-btn tod-action-btn--primary"
                onClick={() => setShowShipModal(true)}
              >
                Илгээх
              </button>
            </div>
          )}

          {/* Hurglet medeellig harag */}
          {order.shipment && (
            <div className="td-card">
              <h3 className="tod-card-title">Хүргэлтийн мэдээлэл</h3>
              <div className="tod-info-rows">
                <div className="tod-info-row">
                  <span className="tod-info-key">Горим</span>
                  <span className="tod-info-val">
                    {SHIPMENT_MODE_LABEL[order.shipment.mode] ?? order.shipment.mode}
                  </span>
                </div>
                {order.shipment.carrier_name && (
                  <div className="tod-info-row">
                    <span className="tod-info-key">Хүргэгч</span>
                    <span className="tod-info-val">{order.shipment.carrier_name}</span>
                  </div>
                )}
                {order.shipment.tracking_code && (
                  <div className="tod-info-row">
                    <span className="tod-info-key">Tracking</span>
                    <span className="tod-info-val">{order.shipment.tracking_code}</span>
                  </div>
                )}
                {order.shipment.note && (
                  <div className="tod-info-row">
                    <span className="tod-info-key">Тэмдэглэл</span>
                    <span className="tod-info-val">{order.shipment.note}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Status info for waiting states */}
          {actions.length === 0 && order.status === 'accepted' && (
            <div className="td-card tod-waiting-card">
              <div className="tod-waiting-icon">⏳</div>
              <p className="tod-waiting-text">
                Захиалагч урьдчилгаа төлбөрөө хийх хүлээгдэж байна.
              </p>
            </div>
          )}

        </div>
      </div>

      {showShipModal && (
        <ShipModal
          orderId={id}
          onClose={() => setShowShipModal(false)}
          onSuccess={async () => {
            setShowShipModal(false)
            const data = await api.get(`/tailor/orders/${id}`)
            setOrder(data.order)
          }}
        />
      )}
    </div>
  )
}

// ─── Iigeeh modal — pickup/courier ali alinii nih songokh ─────────
function ShipModal({ orderId, onClose, onSuccess }) {
  const [mode, setMode] = useState('courier')
  const [carrierName, setCarrierName] = useState('')
  const [trackingCode, setTrackingCode] = useState('')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await api.post(`/tailor/orders/${orderId}/ship`, {
        mode,
        carrier_name:  mode === 'courier' ? carrierName : undefined,
        tracking_code: mode === 'courier' ? trackingCode : undefined,
        note: note || undefined,
      })
      onSuccess?.()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="ship-overlay" onClick={onClose}>
      <div className="ship-modal" onClick={e => e.stopPropagation()}>
        <button type="button" className="ship-close" onClick={onClose}>×</button>
        <h3 className="ship-title">Хүргэлтэд гаргах</h3>

        <form onSubmit={handleSubmit}>
          <div className="ship-modes">
            <label className={`ship-mode-card ${mode === 'pickup' ? 'is-active' : ''}`}>
              <input
                type="radio"
                name="mode"
                value="pickup"
                checked={mode === 'pickup'}
                onChange={() => setMode('pickup')}
              />
              <div className="ship-mode-title">Өөрөө ирж авах</div>
              <div className="ship-mode-desc">
                Захиалагч таны хаягаар ирж авна
              </div>
            </label>

            <label className={`ship-mode-card ${mode === 'courier' ? 'is-active' : ''}`}>
              <input
                type="radio"
                name="mode"
                value="courier"
                checked={mode === 'courier'}
                onChange={() => setMode('courier')}
              />
              <div className="ship-mode-title">3-дагч хүргэлт</div>
              <div className="ship-mode-desc">
                UBCab гэх мэт компаниар илгээх
              </div>
            </label>
          </div>

          {mode === 'courier' && (
            <>
              <label className="ship-field">
                <span>Хүргэлтийн нэр *</span>
                <input
                  type="text"
                  placeholder="UBCab, Shuudangiin Albany, ..."
                  value={carrierName}
                  onChange={e => setCarrierName(e.target.value)}
                  required
                />
              </label>
              <label className="ship-field">
                <span>Tracking код *</span>
                <input
                  type="text"
                  placeholder="ABC123456"
                  value={trackingCode}
                  onChange={e => setTrackingCode(e.target.value)}
                  required
                />
              </label>
            </>
          )}

          <label className="ship-field">
            <span>
              {mode === 'pickup'
                ? 'Авах огноо, цаг, утас *'
                : 'Нэмэлт тэмдэглэл'}
            </span>
            <textarea
              rows={3}
              placeholder={
                mode === 'pickup'
                  ? '2026-04-30, 15:00 цагт, 9911-2233 утсаар холбогдоно уу'
                  : 'Заавал биш...'
              }
              value={note}
              onChange={e => setNote(e.target.value)}
              required={mode === 'pickup'}
            />
          </label>

          {error && <div className="ship-error">{error}</div>}

          <div className="ship-actions">
            <button
              type="button"
              className="tod-action-btn"
              onClick={onClose}
              disabled={submitting}
            >
              Болих
            </button>
            <button
              type="submit"
              className="tod-action-btn tod-action-btn--primary"
              disabled={submitting}
            >
              {submitting ? 'Хадгалж байна...' : 'Илгээх'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
