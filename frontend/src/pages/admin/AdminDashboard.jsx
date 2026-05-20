import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api'
import {
  ROLE_LABEL, USER_STATUS_LABEL, ORDER_STATUS_LABEL,
  roleBadgeClass, userStatusBadgeClass, orderStatusBadgeClass,
  fmtMoney,
} from './adminUtils'

const numberFmt = new Intl.NumberFormat('mn-MN')

const fmtNumber = (value) => numberFmt.format(Number(value || 0))

const fmtCompactMoney = (value) => {
  const amount = Number(value || 0)
  if (amount >= 1_000_000) return `₮ ${(amount / 1_000_000).toFixed(amount >= 10_000_000 ? 0 : 1)}M`
  if (amount >= 1_000) return `₮ ${(amount / 1_000).toFixed(amount >= 100_000 ? 0 : 1)}K`
  return `₮ ${numberFmt.format(amount)}`
}

const fmtShortDate = (value) =>
  value ? new Date(value).toLocaleDateString('mn-MN', { month: '2-digit', day: '2-digit' }) : '—'

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [recentUsers, setRecentUsers] = useState([])
  const [recentOrders, setRecentOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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

  const exportSummary = () => {
    const rows = [
      ['Үзүүлэлт', 'Утга'],
      ['Нийт хэрэглэгч', stats?.total_users ?? 0],
      ['Оёдолчин', stats?.total_tailors ?? 0],
      ['Нийт захиалга', stats?.total_orders ?? 0],
      ['Нийт орлого', stats?.total_revenue ?? 0],
      ['Хүлээгдэж буй', stats?.pending_orders ?? 0],
      ['Идэвхтэй явц', stats?.active_orders ?? 0],
      ['Хүргэгдсэн', stats?.completed_orders ?? 0],
      ['Хаагдсан хэрэглэгч', stats?.blocked_users ?? 0],
    ]
    const csv = `\ufeff${rows.map(row => row.join(',')).join('\n')}`
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'admin-dashboard-stats.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  if (loading) return <div className="ad-loading">Ачааллаж байна...</div>

  const monthlyRevenue = stats?.monthly_revenue ?? []
  const maxRevenue = Math.max(...monthlyRevenue.map(item => Number(item.revenue || 0)), 0)
  const breakdown = stats?.order_status_breakdown ?? {}
  const statusTotal = Math.max(
    Number(breakdown.completed || 0) +
    Number(breakdown.in_progress || 0) +
    Number(breakdown.pending || 0) +
    Number(breakdown.stopped || 0),
    1
  )
  const completedPercent = Math.round((Number(breakdown.completed || 0) / statusTotal) * 100)
  const progressPercent = Math.round((Number(breakdown.in_progress || 0) / statusTotal) * 100)
  const pendingPercent = Math.round((Number(breakdown.pending || 0) / statusTotal) * 100)
  const stoppedPercent = Math.round((Number(breakdown.stopped || 0) / statusTotal) * 100)

  const statCards = [
    { tone: 'users', icon: '◉', value: fmtNumber(stats?.total_users), label: 'Нийт хэрэглэгч' },
    { tone: 'tailors', icon: '✂', value: fmtNumber(stats?.total_tailors), label: 'Оёдолчин' },
    { tone: 'orders', icon: '≡', value: fmtNumber(stats?.total_orders), label: 'Нийт захиалга' },
    { tone: 'revenue', icon: '₮', value: fmtCompactMoney(stats?.total_revenue), label: 'Нийт орлого' },
    { tone: 'pending', icon: '⌛', value: fmtNumber(stats?.pending_orders), label: 'Хүлээгдэж буй' },
    { tone: 'active', icon: '⚙', value: fmtNumber(stats?.active_orders), label: 'Идэвхтэй явц' },
    { tone: 'completed', icon: '✓', value: fmtNumber(stats?.completed_orders), label: 'Хүргэгдсэн' },
    { tone: 'blocked', icon: '×', value: fmtNumber(stats?.blocked_users), label: 'Хаагдсан хэрэглэгч' },
  ]

  const statusLegend = [
    { label: 'Хүргэгдсэн', value: completedPercent, className: 'ad-donut__dot--done' },
    { label: 'Идэвхтэй явц', value: progressPercent, className: 'ad-donut__dot--progress' },
    { label: 'Хүлээгдэж буй', value: pendingPercent, className: 'ad-donut__dot--pending' },
    { label: 'Зогссон', value: stoppedPercent, className: 'ad-donut__dot--stopped' },
  ]

  return (
    <div className="ad-dashboard">
      <div className="ad-dashboard__hero">
        <div>
          <h1 className="ad-page-title">Хяналтын самбар</h1>
          <p className="ad-page-sub">Системийн ерөнхий байдлыг харна уу.</p>
        </div>
        <button className="ad-export-btn" type="button" onClick={exportSummary}>
          + Экспорт хийх
        </button>
      </div>

      {error && <div className="ad-error">{error}</div>}

      <section className="ad-dashboard__stats">
        {statCards.map(card => (
          <article key={card.label} className={`ad-stat-card ad-stat-card--${card.tone}`}>
            <span className="ad-stat-card__icon">{card.icon}</span>
            <div>
              <div className="ad-stat-card__value">{card.value}</div>
              <div className="ad-stat-card__label">{card.label}</div>
            </div>
          </article>
        ))}
      </section>

      <section className="ad-dashboard__tables">
        <div className="ad-card ad-card--compact">
          <div className="ad-section-header">
            <h2 className="ad-section-title">Сүүлийн бүртгэлүүд</h2>
            <Link to="/admin/users" className="ad-link">Бүгдийг харах →</Link>
          </div>

          {recentUsers.length === 0 ? (
            <div className="ad-empty ad-empty--compact">
              <p>Хэрэглэгч байхгүй байна</p>
            </div>
          ) : (
            <table className="ad-table ad-table--compact">
              <thead>
                <tr>
                  <th>Нэр</th>
                  <th>Үүрэг</th>
                  <th>Төлөв</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.slice(0, 5).map(u => (
                  <tr key={u.id}>
                    <td>
                      <strong>{u.full_name}</strong>
                      <span className="ad-table__sub">{u.email}</span>
                    </td>
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
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="ad-card ad-card--compact">
          <div className="ad-section-header">
            <h2 className="ad-section-title">Сүүлийн захиалгууд</h2>
            <Link to="/admin/orders" className="ad-link">Бүгдийг харах →</Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="ad-empty ad-empty--compact">
              <p>Захиалга байхгүй байна</p>
            </div>
          ) : (
            <table className="ad-table ad-table--compact">
              <thead>
                <tr>
                  <th>Дугаар</th>
                  <th>Захиалагч</th>
                  <th>Дүн</th>
                  <th>Төлөв</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.slice(0, 5).map(o => (
                  <tr key={o.id}>
                    <td>
                      <span className="ad-table__mono">#{o.order_number}</span>
                      <span className="ad-table__sub">{fmtShortDate(o.created_at)}</span>
                    </td>
                    <td>{o.customer_name}</td>
                    <td>{fmtMoney(o.total_amount)}</td>
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
      </section>

      <section className="ad-dashboard__charts">
        <div className="ad-card ad-chart-card ad-chart-card--wide">
          <div className="ad-chart-card__header">
            <h2 className="ad-section-title">Сарын орлогын динамик</h2>
            <span>Сүүлийн 12 сар</span>
          </div>
          <div className="ad-bar-chart">
            {monthlyRevenue.map(item => {
              const height = maxRevenue > 0 ? Math.max(8, (Number(item.revenue || 0) / maxRevenue) * 100) : 8

              return (
                <div className="ad-bar-chart__item" key={item.month}>
                  <div className="ad-bar-chart__track">
                    <span
                      className="ad-bar-chart__bar"
                      style={{ height: `${height}%` }}
                      title={fmtMoney(item.revenue)}
                    />
                  </div>
                  <span className="ad-bar-chart__label">{item.month}</span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="ad-card ad-chart-card">
          <div className="ad-chart-card__header">
            <h2 className="ad-section-title">Захиалгын төлөв</h2>
          </div>
          <div
            className="ad-donut"
            style={{
              '--done': `${completedPercent * 3.6}deg`,
              '--progress': `${(completedPercent + progressPercent) * 3.6}deg`,
              '--pending': `${(completedPercent + progressPercent + pendingPercent) * 3.6}deg`,
            }}
          >
            <div className="ad-donut__center">
              <strong>{completedPercent}%</strong>
              <span>амжилттай</span>
            </div>
          </div>
          <div className="ad-donut__legend">
            {statusLegend.map(item => (
              <div className="ad-donut__legend-row" key={item.label}>
                <span className={`ad-donut__dot ${item.className}`} />
                <span>{item.label}</span>
                <strong>{item.value}%</strong>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
