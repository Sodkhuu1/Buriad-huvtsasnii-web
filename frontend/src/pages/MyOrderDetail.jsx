import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { api } from '../api'
import {
  STATUS_LABEL, statusBadgeClass, MEASUREMENT_LABEL,
  formatDate, formatDateTime,
} from './customerUtils'
import './MyOrderDetail.css'

export default function MyOrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get(`/orders/my/${id}`)
      .then(data => setOrder(data.order))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="mod-state">Ачааллаж байна...</div>
  if (error && !order) {
    return (
      <div className="mod-state mod-state--error">
        {error}
        <Link to="/my-orders" className="mod-back-link">← Миний захиалгууд руу буцах</Link>
      </div>
    )
  }
  if (!order) return <div className="mod-state">Захиалга олдсонгүй</div>

  const measurements = order.measurements ?? {}
  const history      = order.history ?? []

  return (
    <div className="mod-wrap container">

      <button className="mod-back" onClick={() => navigate('/my-orders')}>
        ← Миний захиалгууд
      </button>

      <div className="mod-header">
        <div>
          <h1 className="mod-title">Захиалга #{order.order_number}</h1>
          <p className="mod-date">{formatDate(order.created_at)}</p>
        </div>
        <span className={`co-badge mod-status ${statusBadgeClass(order.status)}`}>
          {STATUS_LABEL[order.status] ?? order.status}
        </span>
      </div>

      {error && <div className="mod-error">{error}</div>}

      <div className="mod-grid">

        <div className="mod-col">

          {/* Design */}
          <div className="mod-card">
            <h3 className="mod-card-title">Захиалсан загвар</h3>
            <div className="mod-design">
              {order.design_image_url && (
                <img
                  src={order.design_image_url}
                  alt={order.design_name}
                  className="mod-design__img"
                />
              )}
              <div className="mod-design__info">
                <div className="mod-design__name">{order.design_name}</div>
                {order.design_category && (
                  <div className="mod-design__cat">{order.design_category}</div>
                )}
                {order.material_name && (
                  <div className="mod-design__mat">
                    Материал: {order.material_name}
                    {order.material_color ? ` • ${order.material_color}` : ''}
                  </div>
                )}
                {order.custom_note && (
                  <div className="mod-design__note">
                    <span className="mod-design__note-key">Нэмэлт тэмдэглэл:</span>
                    <span>{order.custom_note}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tailor */}
          {order.tailor_name && (
            <div className="mod-card">
              <h3 className="mod-card-title">Оёдолчин</h3>
              <div className="mod-info-rows">
                <div className="mod-info-row">
                  <span className="mod-info-key">Нэр</span>
                  <span className="mod-info-val">{order.tailor_name}</span>
                </div>
                {order.tailor_business_name && (
                  <div className="mod-info-row">
                    <span className="mod-info-key">Бизнес</span>
                    <span className="mod-info-val">{order.tailor_business_name}</span>
                  </div>
                )}
                {order.tailor_phone && (
                  <div className="mod-info-row">
                    <span className="mod-info-key">Утас</span>
                    <span className="mod-info-val">
                      <a href={`tel:${order.tailor_phone}`} className="mod-link">
                        {order.tailor_phone}
                      </a>
                    </span>
                  </div>
                )}
                {order.tailor_email && (
                  <div className="mod-info-row">
                    <span className="mod-info-key">И-мэйл</span>
                    <span className="mod-info-val">{order.tailor_email}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Price */}
          <div className="mod-card">
            <h3 className="mod-card-title">Төлбөр</h3>
            <div className="mod-price-rows">
              <div className="mod-price-row">
                <span>Үндсэн дүн</span>
                <span>{Number(order.subtotal || 0).toLocaleString()}₮</span>
              </div>
              {Number(order.delivery_fee) > 0 && (
                <div className="mod-price-row">
                  <span>Хүргэлтийн төлбөр</span>
                  <span>{Number(order.delivery_fee).toLocaleString()}₮</span>
                </div>
              )}
              <div className="mod-price-row mod-price-row--total">
                <span>Нийт</span>
                <span>{Number(order.total_amount || 0).toLocaleString()}₮</span>
              </div>
            </div>
          </div>

        </div>

        <div className="mod-col">

          {/* Measurements */}
          <div className="mod-card">
            <h3 className="mod-card-title">Биеийн хэмжээс</h3>
            {Object.keys(measurements).length === 0 ? (
              <p className="mod-muted">Хэмжээс бүртгэгдээгүй.</p>
            ) : (
              <div className="mod-measurements">
                {Object.entries(measurements).map(([key, val]) => (
                  <div key={key} className="mod-measure-row">
                    <span className="mod-measure-key">
                      {MEASUREMENT_LABEL[key] ?? key}
                    </span>
                    <span className="mod-measure-val">{val} см</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Status history / timeline */}
          <div className="mod-card">
            <h3 className="mod-card-title">Явцын түүх</h3>
            {history.length === 0 ? (
              <p className="mod-muted">Түүх алга.</p>
            ) : (
              <ol className="mod-timeline">
                {history.map((h, idx) => (
                  <li key={idx} className="mod-timeline__item">
                    <span className={`co-badge ${statusBadgeClass(h.to_status)}`}>
                      {STATUS_LABEL[h.to_status] ?? h.to_status}
                    </span>
                    <div className="mod-timeline__body">
                      <div className="mod-timeline__date">
                        {formatDateTime(h.changed_at)}
                      </div>
                      {h.note && (
                        <div className="mod-timeline__note">{h.note}</div>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
