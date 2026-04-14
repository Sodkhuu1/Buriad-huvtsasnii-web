import { useState, useEffect, useCallback } from 'react'
import { api } from '../../api'
import { ORDER_STATUS_LABEL, orderStatusBadgeClass, fmtDate, fmtMoney } from './adminUtils'

const STATUS_OPTIONS = [
  'submitted', 'under_review', 'accepted', 'deposit_paid',
  'in_production', 'ready', 'shipped', 'delivered', 'completed', 'rejected',
]

export default function AdminOrders() {
  const [orders, setOrders]       = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')
  const [statusFilter, setStatus] = useState('')

  const load = useCallback(() => {
    setLoading(true)
    const params = statusFilter ? `?status=${statusFilter}` : ''
    api.get(`/admin/orders${params}`)
      .then(d => setOrders(d.orders ?? []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [statusFilter])

  useEffect(() => { load() }, [load])

  return (
    <div>
      <h1 className="ad-page-title">Захиалгууд</h1>
      <p className="ad-page-sub">Системийн бүх захиалгыг харна уу.</p>

      {error && <div className="ad-error">{error}</div>}

      <div className="ad-card">
        <div className="ad-section-header">
          <h2 className="ad-section-title">
            Захиалгын жагсаалт
            {!loading && (
              <span style={{ fontWeight: 400, fontSize: '0.85rem', color: 'var(--text-light)', marginLeft: 6 }}>
                ({orders.length})
              </span>
            )}
          </h2>
          <div className="ad-filters">
            <select
              className="ad-filter-select"
              value={statusFilter}
              onChange={e => setStatus(e.target.value)}
            >
              <option value="">Бүх төлөв</option>
              {STATUS_OPTIONS.map(s => (
                <option key={s} value={s}>{ORDER_STATUS_LABEL[s] ?? s}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="ad-loading">Ачааллаж байна...</div>
        ) : orders.length === 0 ? (
          <div className="ad-empty">
            <div className="ad-empty__icon">📋</div>
            <p>Захиалга олдсонгүй</p>
          </div>
        ) : (
          <table className="ad-table">
            <thead>
              <tr>
                <th>Дугаар</th>
                <th>Захиалагч</th>
                <th>Оёдолчин</th>
                <th>Загвар</th>
                <th>Дүн</th>
                <th>Огноо</th>
                <th>Төлөв</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.id}>
                  <td className="ad-table__mono">#{o.order_number}</td>
                  <td style={{ fontWeight: 500 }}>{o.customer_name}</td>
                  <td className="ad-table__muted">{o.tailor_name ?? '—'}</td>
                  <td className="ad-table__muted">{o.design_name ?? '—'}</td>
                  <td>{fmtMoney(o.total_amount)}</td>
                  <td className="ad-table__muted">{fmtDate(o.created_at)}</td>
                  <td>
                    <span className={`ad-badge ${orderStatusBadgeClass(o.status)}`}>
                      {ORDER_STATUS_LABEL[o.status] ?? o.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
