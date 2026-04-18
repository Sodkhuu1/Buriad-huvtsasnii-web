import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import { STATUS_LABEL, statusBadgeClass, formatDate } from './customerUtils'
import './MyOrders.css'

const FILTERS = [
  { key: 'all',           label: 'Бүгд' },
  { key: 'submitted',     label: 'Шинэ' },
  { key: 'in_production', label: 'Үйлдвэрлэлд' },
  { key: 'ready',         label: 'Бэлэн' },
  { key: 'delivered',     label: 'Хүргэгдсэн' },
  { key: 'completed',     label: 'Дууссан' },
  { key: 'rejected',      label: 'Татгалзсан' },
]

export default function MyOrders() {
  const [orders, setOrders] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    api.get('/orders/my')
      .then(data => setOrders(data.orders ?? []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const visible = filter === 'all'
    ? orders
    : orders.filter(o => o.status === filter)

  return (
    <div className="mo-wrap container">
      <div className="mo-head">
        <h1 className="mo-title">Миний захиалгууд</h1>
        <p className="mo-sub">Таны өгсөн захиалга болон төлөвийг энд харуулна.</p>
      </div>

      {error && <div className="mo-error">{error}</div>}

      <div className="mo-filters">
        {FILTERS.map(f => (
          <button
            key={f.key}
            className={`mo-filter${filter === f.key ? ' mo-filter--active' : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="mo-loading">Ачааллаж байна...</div>
      ) : visible.length === 0 ? (
        <div className="mo-empty">
          <div className="mo-empty__icon">🧵</div>
          <p>
            {orders.length === 0
              ? 'Та одоогоор ямар ч захиалга өгөөгүй байна.'
              : 'Энэ ангилалд захиалга байхгүй байна.'}
          </p>
          {orders.length === 0 && (
            <Link to="/zahialga" className="mo-empty__cta">Захиалга өгөх</Link>
          )}
        </div>
      ) : (
        <div className="mo-list">
          {visible.map(order => (
            <Link
              key={order.id}
              to={`/my-orders/${order.id}`}
              className="mo-card"
            >
              <div className="mo-card__main">
                <div className="mo-card__top">
                  <span className="mo-card__number">#{order.order_number}</span>
                  <span className={`co-badge ${statusBadgeClass(order.status)}`}>
                    {STATUS_LABEL[order.status] ?? order.status}
                  </span>
                </div>
                <div className="mo-card__design">{order.design_name}</div>
                {order.tailor_name && (
                  <div className="mo-card__tailor">
                    Оёдолчин: <strong>{order.tailor_name}</strong>
                  </div>
                )}
              </div>
              <div className="mo-card__meta">
                <div className="mo-card__date">{formatDate(order.created_at)}</div>
                {order.total_amount > 0 && (
                  <div className="mo-card__amount">
                    {Number(order.total_amount).toLocaleString()}₮
                  </div>
                )}
                <div className="mo-card__arrow">→</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
