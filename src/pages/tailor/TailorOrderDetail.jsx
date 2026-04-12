import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../../api'
import { STATUS_LABEL, statusBadgeClass, TAILOR_ACTIONS, MEASUREMENT_LABEL } from './tailorUtils'
import './TailorOrderDetail.css'

export default function TailorOrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState('')
  const [note, setNote] = useState('')

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
    </div>
  )
}
