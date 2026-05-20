import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../../api'
import OrderChat from '../../components/OrderChat'
import {
  STATUS_LABEL, statusBadgeClass, TAILOR_ACTIONS, MEASUREMENT_LABEL,
  SHIPMENT_MODE_LABEL, SHIPMENT_STATUS_LABEL, formatDateTime,
} from './tailorUtils'
import './TailorOrderDetail.css'

export default function TailorOrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState('')
  const [note, setNote] = useState('')
  const [shipOpen, setShipOpen] = useState(false)
  const [shipLoading, setShipLoading] = useState(false)
  const [shipError, setShipError] = useState('')
  const [shipForm, setShipForm] = useState({
    mode: 'courier',
    carrier_name: '',
    tracking_code: '',
    note: '',
  })

  useEffect(() => {
    setLoading(true)
    setError('')
    api.get(`/tailor/orders/${id}`)
      .then(data => setOrder(data.order))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  const reloadOrder = async () => {
    const data = await api.get(`/tailor/orders/${id}`)
    setOrder(data.order)
  }

  const handleAction = async (nextStatus) => {
    setActionLoading(true)
    setError('')
    try {
      await api.put(`/tailor/orders/${id}/status`, {
        status: nextStatus,
        note: note || undefined,
      })
      await reloadOrder()
      setNote('')
    } catch (err) {
      setError(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleShipChange = (field, value) => {
    setShipForm(prev => ({ ...prev, [field]: value }))
  }

  const resetShipForm = () => {
    setShipForm({ mode: 'courier', carrier_name: '', tracking_code: '', note: '' })
    setShipError('')
  }

  const handleShipSubmit = async (event) => {
    event.preventDefault()
    setShipLoading(true)
    setShipError('')

    try {
      const body = shipForm.mode === 'pickup'
        ? { mode: 'pickup', note: shipForm.note }
        : {
            mode: 'courier',
            carrier_name: shipForm.carrier_name,
            tracking_code: shipForm.tracking_code,
            note: shipForm.note || undefined,
          }

      await api.post(`/tailor/orders/${id}/ship`, body)
      await reloadOrder()
      resetShipForm()
      setShipOpen(false)
    } catch (err) {
      setShipError(err.message)
    } finally {
      setShipLoading(false)
    }
  }

  if (loading) return <div className="td-loading">Ачааллаж байна...</div>
  if (!order)  return <div className="td-error">{error || 'Захиалга олдсонгүй'}</div>

  const actions = TAILOR_ACTIONS[order.status] ?? []
  const measurements = order.measurements ?? {}
  const items = order.items?.length ? order.items : [order]
  const history = order.history ?? []

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
            <h3 className="tod-card-title">Захиалсан загварууд</h3>
            <div className="tod-design-list">
              {items.map(item => (
                <div key={item.id ?? item.design_id ?? item.design_name} className="tod-design">
                  {item.design_image_url && (
                    <img src={item.design_image_url} alt={item.design_name} className="tod-design__img" />
                  )}
                  <div className="tod-design__info">
                    <div className="tod-design__name">{item.design_name}</div>
                    <div className="tod-design__cat">{item.design_category}</div>
                    <div className="tod-design__price">
                      {Number(item.quantity || 1)} ш × {Number(item.unit_price || 0).toLocaleString()}₮
                    </div>
                    {item.custom_note && (
                      <div className="tod-design__note">{item.custom_note}</div>
                    )}
                  </div>
                </div>
              ))}
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

          <OrderChat orderId={order.id} title="Захиалагчтай чатлах" />

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

          <div className="td-card">
            <h3 className="tod-card-title">Хүргэлтийн явц</h3>
            {order.shipment ? (
              <div className="tod-info-rows">
                <div className="tod-info-row">
                  <span className="tod-info-key">Горим</span>
                  <span className="tod-info-val">
                    {SHIPMENT_MODE_LABEL[order.shipment.mode] ?? order.shipment.mode}
                  </span>
                </div>
                <div className="tod-info-row">
                  <span className="tod-info-key">Төлөв</span>
                  <span className="tod-info-val">
                    {SHIPMENT_STATUS_LABEL[order.shipment.status] ?? order.shipment.status}
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
                    <span className="tod-info-key">
                      {order.shipment.mode === 'pickup' ? 'Авах нөхцөл' : 'Тэмдэглэл'}
                    </span>
                    <span className="tod-info-val">{order.shipment.note}</span>
                  </div>
                )}
                {order.shipment.shipped_at && (
                  <div className="tod-info-row">
                    <span className="tod-info-key">Эхэлсэн</span>
                    <span className="tod-info-val">{formatDateTime(order.shipment.shipped_at)}</span>
                  </div>
                )}
                {order.shipment.delivered_at && (
                  <div className="tod-info-row">
                    <span className="tod-info-key">Хүргэгдсэн</span>
                    <span className="tod-info-val">{formatDateTime(order.shipment.delivered_at)}</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="tod-ship-hint">
                Захиалга оёдлоос гарч бэлэн болсон үед хүргэлтийн мэдээлэл энд бүртгэгдэнэ.
              </p>
            )}

            {order.status === 'ready' && (
              <button
                type="button"
                className="tod-action-btn tod-action-btn--primary tod-ship-start"
                onClick={() => setShipOpen(true)}
                disabled={shipLoading}
              >
                Хүргэлт эхлүүлэх
              </button>
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

          <div className="td-card">
            <h3 className="tod-card-title">Явцын түүх</h3>
            {history.length === 0 ? (
              <p className="tod-ship-hint">Түүх бүртгэгдээгүй байна.</p>
            ) : (
              <ol className="tod-timeline">
                {history.map((h, idx) => (
                  <li key={idx} className="tod-timeline__item">
                    <span className={`td-badge ${statusBadgeClass(h.to_status)}`}>
                      {STATUS_LABEL[h.to_status] ?? h.to_status}
                    </span>
                    <div className="tod-timeline__body">
                      <div className="tod-timeline__date">
                        {formatDateTime(h.changed_at)}
                        {h.changed_by_name ? ` · ${h.changed_by_name}` : ''}
                      </div>
                      {h.note && (
                        <div className="tod-timeline__note">{h.note}</div>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>

        </div>
      </div>

      {shipOpen && (
        <div className="ship-overlay" onClick={() => !shipLoading && setShipOpen(false)}>
          <form className="ship-modal" onSubmit={handleShipSubmit} onClick={e => e.stopPropagation()}>
            <button
              type="button"
              className="ship-close"
              onClick={() => !shipLoading && setShipOpen(false)}
              aria-label="Хаах"
            >
              ×
            </button>

            <h2 className="ship-title">Хүргэлтийн мэдээлэл</h2>

            <div className="ship-modes">
              <label className={`ship-mode-card${shipForm.mode === 'courier' ? ' is-active' : ''}`}>
                <input
                  type="radio"
                  name="ship-mode"
                  value="courier"
                  checked={shipForm.mode === 'courier'}
                  onChange={e => handleShipChange('mode', e.target.value)}
                />
                <span className="ship-mode-title">Хүргэлтээр явуулах</span>
                <span className="ship-mode-desc">Хүргэгч байгууллага болон tracking код бүртгэнэ.</span>
              </label>
              <label className={`ship-mode-card${shipForm.mode === 'pickup' ? ' is-active' : ''}`}>
                <input
                  type="radio"
                  name="ship-mode"
                  value="pickup"
                  checked={shipForm.mode === 'pickup'}
                  onChange={e => handleShipChange('mode', e.target.value)}
                />
                <span className="ship-mode-title">Өөрөө ирж авах</span>
                <span className="ship-mode-desc">Авах өдөр, цаг, холбоо барих нөхцөлийг бичнэ.</span>
              </label>
            </div>

            {shipForm.mode === 'courier' && (
              <>
                <label className="ship-field">
                  <span>Хүргэгч байгууллага</span>
                  <input
                    value={shipForm.carrier_name}
                    onChange={e => handleShipChange('carrier_name', e.target.value)}
                    placeholder="Жишээ: Монгол шуудан"
                    disabled={shipLoading}
                    required
                  />
                </label>
                <label className="ship-field">
                  <span>Tracking код</span>
                  <input
                    value={shipForm.tracking_code}
                    onChange={e => handleShipChange('tracking_code', e.target.value)}
                    placeholder="Жишээ: MN123456789"
                    disabled={shipLoading}
                    required
                  />
                </label>
              </>
            )}

            <label className="ship-field">
              <span>{shipForm.mode === 'pickup' ? 'Авах нөхцөл' : 'Нэмэлт тэмдэглэл'}</span>
              <textarea
                rows={3}
                value={shipForm.note}
                onChange={e => handleShipChange('note', e.target.value)}
                placeholder={shipForm.mode === 'pickup' ? 'Жишээ: 5 сарын 22-нд 14:00 цагаас авах боломжтой' : 'Заавал биш'}
                disabled={shipLoading}
                required={shipForm.mode === 'pickup'}
              />
            </label>

            {shipError && <div className="ship-error">{shipError}</div>}

            <div className="ship-actions">
              <button
                type="button"
                className="tod-action-btn"
                onClick={() => !shipLoading && setShipOpen(false)}
                disabled={shipLoading}
              >
                Болих
              </button>
              <button
                type="submit"
                className="tod-action-btn tod-action-btn--primary"
                disabled={shipLoading}
              >
                {shipLoading ? 'Бүртгэж байна...' : 'Хүргэлтэд гаргах'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
