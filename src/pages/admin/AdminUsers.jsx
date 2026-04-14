import { useState, useEffect, useCallback } from 'react'
import { api } from '../../api'
import {
  ROLE_LABEL, USER_STATUS_LABEL,
  roleBadgeClass, userStatusBadgeClass,
  fmtDate,
} from './adminUtils'

export default function AdminUsers() {
  const [users, setUsers]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [roleFilter, setRole]   = useState('')
  const [statusFilter, setStatus] = useState('')
  const [actionLoading, setActionLoading] = useState(null) // userId

  const load = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (roleFilter)   params.set('role',   roleFilter)
    if (statusFilter) params.set('status', statusFilter)

    api.get(`/admin/users?${params}`)
      .then(d => setUsers(d.users ?? []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [roleFilter, statusFilter])

  useEffect(() => { load() }, [load])

  const changeStatus = async (userId, newStatus) => {
    setActionLoading(userId)
    try {
      const d = await api.put(`/admin/users/${userId}/status`, { status: newStatus })
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: d.user.status } : u))
    } catch (err) {
      alert(err.message)
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div>
      <h1 className="ad-page-title">Хэрэглэгчид</h1>
      <p className="ad-page-sub">Системийн бүх хэрэглэгчийг удирдана уу.</p>

      {error && <div className="ad-error">{error}</div>}

      <div className="ad-card">
        {/* Filters */}
        <div className="ad-section-header">
          <h2 className="ad-section-title">
            Жагсаалт {!loading && <span style={{ fontWeight: 400, fontSize: '0.85rem', color: 'var(--text-light)' }}>({users.length})</span>}
          </h2>
          <div className="ad-filters">
            <select
              className="ad-filter-select"
              value={roleFilter}
              onChange={e => setRole(e.target.value)}
            >
              <option value="">Бүх үүрэг</option>
              <option value="customer">Харилцагч</option>
              <option value="tailor">Оёдолчин</option>
            </select>
            <select
              className="ad-filter-select"
              value={statusFilter}
              onChange={e => setStatus(e.target.value)}
            >
              <option value="">Бүх төлөв</option>
              <option value="active">Идэвхтэй</option>
              <option value="inactive">Идэвхгүй</option>
              <option value="blocked">Хаагдсан</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="ad-loading">Ачааллаж байна...</div>
        ) : users.length === 0 ? (
          <div className="ad-empty">
            <div className="ad-empty__icon">👤</div>
            <p>Хэрэглэгч олдсонгүй</p>
          </div>
        ) : (
          <table className="ad-table">
            <thead>
              <tr>
                <th>Нэр</th>
                <th>И-мэйл</th>
                <th>Утас</th>
                <th>Үүрэг</th>
                <th>Төлөв</th>
                <th>Бүртгүүлсэн</th>
                <th>Үйлдэл</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 500 }}>{u.full_name}</td>
                  <td className="ad-table__muted">{u.email}</td>
                  <td className="ad-table__muted">{u.phone ?? '—'}</td>
                  <td>
                    <span className={`ad-badge ${roleBadgeClass(u.role)}`}>
                      {ROLE_LABEL[u.role] ?? u.role}
                    </span>
                  </td>
                  <td>
                    <span className={`ad-badge ${userStatusBadgeClass(u.status)}`}>
                      {USER_STATUS_LABEL[u.status] ?? u.status}
                    </span>
                  </td>
                  <td className="ad-table__muted">{fmtDate(u.created_at)}</td>
                  <td>
                    <div className="ad-btn-group">
                      {u.status !== 'active' && (
                        <button
                          className="ad-btn ad-btn--success"
                          disabled={actionLoading === u.id}
                          onClick={() => changeStatus(u.id, 'active')}
                        >
                          Нээх
                        </button>
                      )}
                      {u.status !== 'blocked' && (
                        <button
                          className="ad-btn ad-btn--danger"
                          disabled={actionLoading === u.id}
                          onClick={() => changeStatus(u.id, 'blocked')}
                        >
                          Хаах
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
