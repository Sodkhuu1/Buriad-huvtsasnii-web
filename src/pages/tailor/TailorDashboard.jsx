import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api'
import { STATUS_LABEL, statusBadgeClass } from './tailorUtils'
import './TailorDashboard.css'

export default function TailorDashboard() {
  const [stats, setStats] = useState(null)
  const [recentOrders, setRecentOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      api.get('/tailor/stats'),
      api.get('/tailor/orders?limit=5'),
    ])
      .then(([statsData, ordersData]) => {
        setStats(statsData)
        setRecentOrders(ordersData.orders ?? [])
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="td-loading">Ачааллаж байна...</div>

  return (
    <div>
      <h1 className="td-page-title">Хяналтын самбар</h1>
      <p className="td-page-sub">Өнөөдрийн захиалга болон явцын тоймыг харна уу.</p>

      {error && <div className="td-error">{error}</div>}

      {/* Stat cards */}
      <div className="td-stats">
        <div className="td-stat-card td-stat-card--new">
          <div className="td-stat-card__value">{stats?.new_orders ?? 0}</div>
          <div className="td-stat-card__label">Шинэ захиалга</div>
          <div className="td-stat-card__icon">✉</div>
        </div>
        <div className="td-stat-card td-stat-card--production">
          <div className="td-stat-card__value">{stats?.in_production ?? 0}</div>
          <div className="td-stat-card__label">Үйлдвэрлэлд</div>
          <div className="td-stat-card__icon">✂</div>
        </div>
        <div className="td-stat-card td-stat-card--ready">
          <div className="td-stat-card__value">{stats?.ready ?? 0}</div>
          <div className="td-stat-card__label">Бэлэн</div>
          <div className="td-stat-card__icon">✓</div>
        </div>
        <div className="td-stat-card td-stat-card--completed">
          <div className="td-stat-card__value">{stats?.completed_this_month ?? 0}</div>
          <div className="td-stat-card__label">Энэ сард дууссан</div>
          <div className="td-stat-card__icon">★</div>
        </div>
      </div>

      {/* Recent orders */}
      <div className="td-card">
        <div className="td-section-header">
          <h2 className="td-section-title">Сүүлийн захиалгууд</h2>
          <Link to="/tailor/orders" className="td-link">Бүгдийг харах →</Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="td-empty">
            <div className="td-empty__icon">📋</div>
            <p>Одоогоор захиалга байхгүй байна</p>
          </div>
        ) : (
          <table className="td-table">
            <thead>
              <tr>
                <th>Дугаар</th>
                <th>Захиалагч</th>
                <th>Загвар</th>
                <th>Огноо</th>
                <th>Төлөв</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map(order => (
                <tr key={order.id}>
                  <td className="td-table__number">#{order.order_number}</td>
                  <td>{order.customer_name}</td>
                  <td>{order.design_name}</td>
                  <td className="td-table__date">
                    {new Date(order.created_at).toLocaleDateString('mn-MN')}
                  </td>
                  <td>
                    <span className={`td-badge ${statusBadgeClass(order.status)}`}>
                      {STATUS_LABEL[order.status] ?? order.status}
                    </span>
                  </td>
                  <td>
                    <Link to={`/tailor/orders/${order.id}`} className="td-link">
                      Харах
                    </Link>
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
