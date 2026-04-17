import { useState, useEffect } from 'react'
import { api } from '../../api'
import { USER_STATUS_LABEL, userStatusBadgeClass, fmtDate } from './adminUtils'

export default function AdminTailors() {
  const [tailors, setTailors]         = useState([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState('')
  const [actionLoading, setActionLoading] = useState(null)

  useEffect(() => {
    api.get('/admin/tailors')
      .then(d => setTailors(d.tailors ?? []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const toggleVerify = async (id, current) => {
    setActionLoading(id)
    try {
      await api.put(`/admin/tailors/${id}/verify`, { verified: !current })
      setTailors(prev =>
        prev.map(t => t.id === id ? { ...t, verified: !current } : t)
      )
    } catch (err) {
      alert(err.message)
    } finally {
      setActionLoading(null)
    }
  }

  const changeStatus = async (id, status) => {
    setActionLoading(id)
    try {
      const d = await api.put(`/admin/users/${id}/status`, { status })
      setTailors(prev => prev.map(t => t.id === id ? { ...t, status: d.user.status } : t))
    } catch (err) {
      alert(err.message)
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div>
      <h1 className="ad-page-title">Оёдолчид</h1>
      <p className="ad-page-sub">Оёдолчдын баталгаажуулалт болон статусыг удирдана уу.</p>

      {error && <div className="ad-error">{error}</div>}

      <div className="ad-card">
        <div className="ad-section-header">
          <h2 className="ad-section-title">
            Оёдолчдын жагсаалт
            {!loading && (
              <span style={{ fontWeight: 400, fontSize: '0.85rem', color: 'var(--text-light)', marginLeft: 6 }}>
                ({tailors.length})
              </span>
            )}
          </h2>
        </div>

        {loading ? (
          <div className="ad-loading">Ачааллаж байна...</div>
        ) : tailors.length === 0 ? (
          <div className="ad-empty">
            <div className="ad-empty__icon">✂</div>
            <p>Оёдолчин бүртгэгдээгүй байна</p>
          </div>
        ) : (
          <table className="ad-table">
            <thead>
              <tr>
                <th>Нэр</th>
                <th>И-мэйл</th>
                <th>Бизнесийн нэр</th>
                <th>Захиалга</th>
                <th>Үнэлгээ</th>
                <th>Баталгаа</th>
                <th>Төлөв</th>
                <th>Үйлдэл</th>
              </tr>
            </thead>
            <tbody>
              {tailors.map(t => (
                <tr key={t.id}>
                  <td style={{ fontWeight: 500 }}>{t.full_name}</td>
                  <td className="ad-table__muted">{t.email}</td>
                  <td>{t.business_name ?? '—'}</td>
                  <td className="ad-table__muted">{t.order_count ?? 0}</td>
                  <td>
                    {t.rating
                      ? <span>⭐ {Number(t.rating).toFixed(1)}</span>
                      : <span className="ad-table__muted">—</span>
                    }
                  </td>
                  <td>
                    {t.verified
                      ? <span className="ad-badge ad-badge--active">✓ Баталгаажсан</span>
                      : <span className="ad-badge ad-badge--inactive">Баталгаагүй</span>
                    }
                  </td>
                  <td>
                    <span className={`ad-badge ${userStatusBadgeClass(t.status)}`}>
                      {USER_STATUS_LABEL[t.status] ?? t.status}
                    </span>
                  </td>
                  <td>
                    <div className="ad-btn-group">
                      <button
                        className={`ad-btn ${t.verified ? 'ad-btn--neutral' : 'ad-btn--success'}`}
                        disabled={actionLoading === t.id}
                        onClick={() => toggleVerify(t.id, t.verified)}
                      >
                        {t.verified ? 'Цуцлах' : 'Батлах'}
                      </button>
                      {t.status !== 'blocked' ? (
                        <button
                          className="ad-btn ad-btn--danger"
                          disabled={actionLoading === t.id}
                          onClick={() => changeStatus(t.id, 'blocked')}
                        >
                          Хаах
                        </button>
                      ) : (
                        <button
                          className="ad-btn ad-btn--success"
                          disabled={actionLoading === t.id}
                          onClick={() => changeStatus(t.id, 'active')}
                        >
                          Нээх
                        </button>
                      )}
                    </div>
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
