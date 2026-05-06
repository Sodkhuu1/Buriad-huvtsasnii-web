import { useState, useEffect, useCallback } from 'react'
import { api } from '../../api'
import { ORDER_STATUS_LABEL, orderStatusBadgeClass, fmtDate, fmtMoney } from './adminUtils'

const STATUS_OPTIONS = [
  'submitted', 'accepted', 'rejected', 'in_production', 'delivered',
]

export default function AdminOrders() {
  const [orders, setOrders]       = useState([])
  const [tailors, setTailors]     = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')
  const [statusFilter, setStatus] = useState('')
  const [selectedTailors, setSelectedTailors] = useState({})
  const [assigningId, setAssigningId] = useState('')
  const [rejectingId, setRejectingId] = useState('')

  const load = useCallback(() => {
    setLoading(true)
    const params = statusFilter ? `?status=${statusFilter}` : ''
    api.get(`/admin/orders${params}`)
      .then(d => setOrders(d.orders ?? []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [statusFilter])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    api.get('/admin/tailors')
      .then(d => setTailors((d.tailors ?? []).filter(t => t.status === 'active' && t.verified)))
      .catch(err => setError(err.message))
  }, [])

  const canAssign = (status) => ['submitted', 'under_review', 'accepted'].includes(status)
  const canReject = (status) => ['submitted', 'under_review', 'accepted'].includes(status)

  const assignTailor = async (orderId) => {
    const tailorId = selectedTailors[orderId]
    if (!tailorId) return

    setAssigningId(orderId)
    setError('')

    try {
      await api.put(`/admin/orders/${orderId}/assign`, { tailor_id: tailorId })
      load()
    } catch (err) {
      setError(err.message)
    } finally {
      setAssigningId('')
    }
  }

  const rejectOrder = async (orderId) => {
    setRejectingId(orderId)
    setError('')

    try {
      await api.put(`/admin/orders/${orderId}/reject`)
      load()
    } catch (err) {
      setError(err.message)
    } finally {
      setRejectingId('')
    }
  }

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
                <th>Хуваарилалт</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => {
                const selectedTailor = selectedTailors[o.id] ?? o.tailor_id ?? ''
                const isAssignable = canAssign(o.status)
                const isRejectable = canReject(o.status)

                return (
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
                    <td>
                      {isAssignable || isRejectable ? (
                        <div className="ad-assign">
                          {isAssignable && (
                            <>
                              <select
                                className="ad-filter-select ad-assign__select"
                                value={selectedTailor}
                                onChange={e => setSelectedTailors(prev => ({ ...prev, [o.id]: e.target.value }))}
                              >
                                <option value="">Оёдолчин сонгох</option>
                                {tailors.map(t => (
                                  <option key={t.id} value={t.id}>
                                    {t.business_name || t.full_name}
                                  </option>
                                ))}
                              </select>
                              <button
                                type="button"
                                className="ad-btn ad-btn--success"
                                disabled={!selectedTailor || assigningId === o.id}
                                onClick={() => assignTailor(o.id)}
                              >
                                {assigningId === o.id ? 'Хуваарилж байна...' : 'Батлах'}
                              </button>
                            </>
                          )}
                          {isRejectable && (
                            <button
                              type="button"
                              className="ad-btn ad-btn--danger"
                              disabled={rejectingId === o.id}
                              onClick={() => rejectOrder(o.id)}
                            >
                              {rejectingId === o.id ? 'Татгалзаж байна...' : 'Татгалзах'}
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="ad-table__muted">—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
