import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { api } from '../api'
import PaymentModal from '../components/PaymentModal'
import {
  STATUS_LABEL, statusBadgeClass, MEASUREMENT_LABEL, SHIPMENT_MODE_LABEL,
  formatDate, formatDateTime,
} from './customerUtils'
import './MyOrderDetail.css'

export default function MyOrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [showPayment, setShowPayment] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [reviewComment, setReviewComment] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)

  useEffect(() => {
    api.get(`/orders/my/${id}`)
      .then(data => setOrder(data.order))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  // Uneglee uldeele
  const handleSubmitReview = async (e) => {
    e.preventDefault()
    if (rating < 1 || rating > 5) {
      setError('1-5 одны үнэлгээ өгнө үү')
      return
    }
    setSubmittingReview(true)
    setError('')
    try {
      await api.post(`/orders/my/${id}/review`, {
        rating,
        comment: reviewComment || undefined,
      })
      const data = await api.get(`/orders/my/${id}`)
      setOrder(data.order)
      setRating(0)
      setReviewComment('')
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmittingReview(false)
    }
  }

  // Zahialgaa hulen avsanaa batalgaajuulah — delivered toolovt baigaa uyed
  const handleConfirmDelivery = async () => {
    setConfirming(true)
    setError('')
    try {
      await api.patch(`/orders/my/${id}/confirm-delivery`)
      const data = await api.get(`/orders/my/${id}`)
      setOrder(data.order)
    } catch (err) {
      setError(err.message)
    } finally {
      setConfirming(false)
    }
  }

  // Tsutslakh — zovkhon submitted toloovtoi uyed
  const handleCancel = async () => {
    setCancelling(true)
    setError('')
    try {
      await api.patch(`/orders/my/${id}/cancel`)
      // статус болон түүхийг шинэчлэхийн тулд дахин татна
      const data = await api.get(`/orders/my/${id}`)
      setOrder(data.order)
      setConfirmCancel(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setCancelling(false)
    }
  }

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
        <div className="mod-header__right">
          <span className={`co-badge mod-status ${statusBadgeClass(order.status)}`}>
            {STATUS_LABEL[order.status] ?? order.status}
          </span>
          {order.status === 'submitted' && (
            <button
              className="mod-cancel-btn"
              onClick={() => setConfirmCancel(true)}
              disabled={cancelling}
            >
              Захиалга цуцлах
            </button>
          )}
          {order.status === 'accepted' && (
            <button
              className="mod-pay-btn"
              onClick={() => setShowPayment(true)}
            >
              Төлбөр хийх
            </button>
          )}
          {order.status === 'delivered' && (
            <button
              className="mod-pay-btn"
              onClick={handleConfirmDelivery}
              disabled={confirming}
            >
              {confirming ? 'Баталж байна...' : 'Хүлээн авлаа'}
            </button>
          )}
        </div>
      </div>

      {showPayment && (
        <PaymentModal
          orderId={order.id}
          amount={order.total_amount}
          onClose={() => setShowPayment(false)}
          onSuccess={async () => {
            setShowPayment(false)
            // Шинэ төлөвтэйгөөр захиалгыг дахин татна
            const data = await api.get(`/orders/my/${id}`)
            setOrder(data.order)
          }}
        />
      )}

      {error && <div className="mod-error">{error}</div>}

      {confirmCancel && (
        <div className="mod-modal-overlay" onClick={() => !cancelling && setConfirmCancel(false)}>
          <div className="mod-modal" onClick={e => e.stopPropagation()}>
            <h3 className="mod-modal__title">Захиалгаа цуцлах уу?</h3>
            <p className="mod-modal__text">
              Энэ үйлдлийг буцаах боломжгүй. Оёдолчин танай захиалгыг хүлээж авах
              хүртэл л цуцлах боломжтой.
            </p>
            <div className="mod-modal__actions">
              <button
                className="mod-modal__btn mod-modal__btn--ghost"
                onClick={() => setConfirmCancel(false)}
                disabled={cancelling}
              >
                Болих
              </button>
              <button
                className="mod-modal__btn mod-modal__btn--danger"
                onClick={handleCancel}
                disabled={cancelling}
              >
                {cancelling ? 'Цуцалж байна...' : 'Тийм, цуцал'}
              </button>
            </div>
          </div>
        </div>
      )}

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

          {/* Hurgliin medeellig harag */}
          {order.shipment && (
            <div className="mod-card">
              <h3 className="mod-card-title">Хүргэлт</h3>
              <div className="mod-info-rows">
                <div className="mod-info-row">
                  <span className="mod-info-key">Горим</span>
                  <span className="mod-info-val">
                    {SHIPMENT_MODE_LABEL[order.shipment.mode] ?? order.shipment.mode}
                  </span>
                </div>
                {order.shipment.carrier_name && (
                  <div className="mod-info-row">
                    <span className="mod-info-key">Хүргэгч</span>
                    <span className="mod-info-val">{order.shipment.carrier_name}</span>
                  </div>
                )}
                {order.shipment.tracking_code && (
                  <div className="mod-info-row">
                    <span className="mod-info-key">Tracking</span>
                    <span className="mod-info-val">{order.shipment.tracking_code}</span>
                  </div>
                )}
                {order.shipment.note && (
                  <div className="mod-info-row">
                    <span className="mod-info-key">
                      {order.shipment.mode === 'pickup' ? 'Авах нөхцөл' : 'Тэмдэглэл'}
                    </span>
                    <span className="mod-info-val">{order.shipment.note}</span>
                  </div>
                )}
                {order.shipment.shipped_at && (
                  <div className="mod-info-row">
                    <span className="mod-info-key">Илгээсэн</span>
                    <span className="mod-info-val">
                      {formatDateTime(order.shipment.shipped_at)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Uneglee — completed zahialgand */}
          {order.status === 'completed' && (
            <div className="mod-card">
              <h3 className="mod-card-title">Үнэлгээ</h3>
              {order.review ? (
                <div className="mod-review">
                  <div className="mod-stars-row mod-stars-row--display">
                    {[1, 2, 3, 4, 5].map(n => (
                      <span
                        key={n}
                        className={`mod-star ${n <= order.review.rating ? 'is-filled' : ''}`}
                      >★</span>
                    ))}
                    <span className="mod-stars-num">{order.review.rating}/5</span>
                  </div>
                  {order.review.comment && (
                    <p className="mod-review-comment">"{order.review.comment}"</p>
                  )}
                  <div className="mod-review-date">
                    {formatDateTime(order.review.created_at)}
                  </div>
                </div>
              ) : (
                <form className="mod-review-form" onSubmit={handleSubmitReview}>
                  <p className="mod-review-hint">
                    Оёдолчныг үнэл — таны үнэлгээ бусдад чухал.
                  </p>
                  <div
                    className="mod-stars-row"
                    onMouseLeave={() => setHoverRating(0)}
                  >
                    {[1, 2, 3, 4, 5].map(n => (
                      <button
                        key={n}
                        type="button"
                        className={`mod-star mod-star--btn ${
                          n <= (hoverRating || rating) ? 'is-filled' : ''
                        }`}
                        onMouseEnter={() => setHoverRating(n)}
                        onClick={() => setRating(n)}
                        aria-label={`${n} од`}
                      >★</button>
                    ))}
                  </div>
                  <textarea
                    className="mod-review-textarea"
                    placeholder="Сэтгэгдэл (заавал биш)..."
                    rows={3}
                    value={reviewComment}
                    onChange={e => setReviewComment(e.target.value)}
                  />
                  <button
                    type="submit"
                    className="mod-pay-btn"
                    disabled={submittingReview || rating < 1}
                  >
                    {submittingReview ? 'Илгээж байна...' : 'Үнэлгээ илгээх'}
                  </button>
                </form>
              )}
            </div>
          )}

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
