import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api'
import {
  ROLE_LABEL, USER_STATUS_LABEL, ORDER_STATUS_LABEL,
  roleBadgeClass, userStatusBadgeClass, orderStatusBadgeClass,
  fmtDate, fmtMoney,
} from './adminUtils'

export default function AdminDashboard() {
  const [stats, setStats]             = useState(null)
  const [recentUsers, setRecentUsers] = useState([])
  const [recentOrders, setRecentOrders] = useState([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState('')

  useEffect(() => {
    Promise.all([
      api.get('/admin/stats'),
      api.get('/admin/recent-users'),
      api.get('/admin/orders?limit=6'),
    ])
      .then(([s, u, o]) => {
        setStats(s)
        setRecentUsers(u.users ?? [])
        setRecentOrders(o.orders ?? [])
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="ad-loading">Ачааллаж байна...</div>

  return (
    <div>
      <h1 className="ad-page-title">Хяналтын самбар</h1>
      <p className="ad-page-sub">Системийн ерөнхий байдлыг харна уу.</p>

      {error && <div className="ad-error">{error}</div>}

      {/* ── Stat cards row 1: Users ── */}
      <div className="ad-stats">
        <div className="ad-stat-card ad-stat-card--users">
          <div className="ad-stat-card__value">{stats?.total_users ?? 0}</div>
          <div className="ad-stat-card__label">Нийт хэрэглэгч</div>
          <div className="ad-stat-card__icon">◉</div>
        </div>
        <div className="ad-stat-card ad-stat-card--tailors">
          <div className="ad-stat-card__value">{stats?.total_tailors ?? 0}</div>
          <div className="ad-stat-card__label">Оёдолчин</div>
          <div className="ad-stat-card__icon">✂</div>
        </div>
        <div className="ad-stat-card ad-stat-card--orders">
          <div className="ad-stat-card__value">{stats?.total_orders ?? 0}</div>
          <div className="ad-stat-card__label">Нийт захиалга</div>
          <div className="ad-stat-card__icon">≡</div>
        </div>
        <div className="ad-stat-card ad-stat-card--revenue">
          <div className="ad-stat-card__value">{fmtMoney(stats?.total_revenue)}</div>
          <div className="ad-stat-card__label">Нийт орлого</div>
          <div className="ad-stat-card__icon">₮</div>
        </div>
      </div>

      {/* ── Stat cards row 2: Orders ── */}
      <div className="ad-stats">
        <div className="ad-stat-card ad-stat-card--pending">
          <div className="ad-stat-card__value">{stats?.pending_orders ?? 0}</div>
          <div className="ad-stat-card__label">Хүлээгдэж буй</div>
          <div className="ad-stat-card__icon">⏳</div>
        </div>
        <div className="ad-stat-card ad-stat-card--active">
          <div className="ad-stat-card__value">{stats?.active_orders ?? 0}</div>
          <div className="ad-stat-card__label">Үйлдвэрлэлд</div>
          <div className="ad-stat-card__icon">⚙</div>
        </div>
        <div className="ad-stat-card ad-stat-card--completed">
          <div className="ad-stat-card__value">{stats?.completed_orders ?? 0}</div>
          <div className="ad-stat-card__label">Дууссан захиалга</div>
          <div className="ad-stat-card__icon">✓</div>
        </div>
        <div className="ad-stat-card ad-stat-card--blocked">
          <div className="ad-stat-card__value">{stats?.blocked_users ?? 0}</div>
          <div className="ad-stat-card__label">Хаагдсан хэрэглэгч</div>
          <div className="ad-stat-card__icon">✕</div>
        </div>
      </div>

      {/* ── Recent users ── */}
      <div className="ad-card">
        <div className="ad-section-header">
          <h2 className="ad-section-title">Сүүлийн бүртгэлүүд</h2>
          <Link to="/admin/users" className="ad-link">Бүгдийг харах →</Link>
        </div>

        {recentUsers.length === 0 ? (
          <div className="ad-empty">
            <div className="ad-empty__icon">👤</div>
            <p>Хэрэглэгч байхгүй байна</p>
          </div>
        ) : (
          <table className="ad-table">
            <thead>
              <tr>
                <th>Нэр</th>
                <th>И-мэйл</th>
                <th>Үүрэг</th>
                <th>Төлөв</th>
                <th>Бүртгүүлсэн</th>
              </tr>
            </thead>
            <tbody>
              {recentUsers.map(u => (
                <tr key={u.id}>
                  <td>{u.full_name}</td>
                  <td className="ad-table__muted">{u.email}</td>
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
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Recent orders ── */}
      <div className="ad-card">
        <div className="ad-section-header">
          <h2 className="ad-section-title">Сүүлийн захиалгууд</h2>
          <Link to="/admin/orders" className="ad-link">Бүгдийг харах →</Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="ad-empty">
            <div className="ad-empty__icon">📋</div>
            <p>Захиалга байхгүй байна</p>
          </div>
        ) : (
          <table className="ad-table">
            <thead>
              <tr>
                <th>Дугаар</th>
                <th>Захиалагч</th>
                <th>Загвар</th>
                <th>Дүн</th>
                <th>Огноо</th>
                <th>Төлөв</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map(o => (
                <tr key={o.id}>
                  <td className="ad-table__mono">#{o.order_number}</td>
                  <td>{o.customer_name}</td>
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
