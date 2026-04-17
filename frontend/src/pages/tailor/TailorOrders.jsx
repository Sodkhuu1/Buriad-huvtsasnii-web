import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api'
import { STATUS_LABEL, statusBadgeClass } from './tailorUtils'
import './TailorOrders.css'

const FILTERS = [
  { key: 'all',          label: 'Бүгд' },
  { key: 'submitted',    label: 'Шинэ' },
  { key: 'in_production',label: 'Үйлдвэрлэлд' },
  { key: 'ready',        label: 'Бэлэн' },
  { key: 'completed',    label: 'Дууссан' },
  { key: 'rejected',     label: 'Татгалзсан' },
]

export default function TailorOrders() {
  const [orders, setOrders] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    const query = filter === 'all' ? '' : `?status=${filter}`
    api.get(`/tailor/orders${query}`)
      .then(data => setOrders(data.orders ?? []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [filter])

  return (
    <div>
      <h1 className="td-page-title">Захиалгууд</h1>
      <p className="td-page-sub">Танд ирсэн болон хийгдэж байгаа бүх захиалга.</p>

      {error && <div className="td-error">{error}</div>}

      {/* Filter tabs */}
      <div className="tdo-filters">
        {FILTERS.map(f => (
          <button
            key={f.key}
            className={`tdo-filter${filter === f.key ? ' tdo-filter--active' : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="td-loading">Ачааллаж байна...</div>
      ) : orders.length === 0 ? (
        <div className="td-empty">
          <div className="td-empty__icon">📋</div>
          <p>Энэ ангилалд захиалга байхгүй байна</p>
        </div>
      ) : (
        <div className="tdo-list">
          {orders.map(order => (
            <Link
              key={order.id}
              to={`/tailor/orders/${order.id}`}
              className="tdo-card"
            >
              <div className="tdo-card__main">
                <div className="tdo-card__header">
                  <span className="tdo-card__number">#{order.order_number}</span>
                  <span className={`td-badge ${statusBadgeClass(order.status)}`}>
                    {STATUS_LABEL[order.status] ?? order.status}
                  </span>
                </div>
                <div className="tdo-card__design">{order.design_name}</div>
                <div className="tdo-card__customer">
                  Захиалагч: <strong>{order.customer_name}</strong>
                </div>
              </div>
              <div className="tdo-card__meta">
                <div className="tdo-card__date">
                  {new Date(order.created_at).toLocaleDateString('mn-MN')}
                </div>
                {order.total_amount > 0 && (
                  <div className="tdo-card__amount">
                    {Number(order.total_amount).toLocaleString()}₮
                  </div>
                )}
                <div className="tdo-card__arrow">→</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
