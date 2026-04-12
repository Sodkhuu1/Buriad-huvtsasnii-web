import { NavLink, Outlet, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import './TailorLayout.css'

const navItems = [
  { path: '/tailor',        label: 'Хяналтын самбар', icon: '▦', end: true },
  { path: '/tailor/orders', label: 'Захиалгууд',       icon: '≡' },
]

export default function TailorLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  if (!user) return <Navigate to="/" replace />
  if (user.role !== 'tailor' && user.role !== 'TAILOR') return <Navigate to="/" replace />

  const handleLogout = () => { logout(); navigate('/') }

  return (
    <div className="tailor-layout">
      {/* Sidebar */}
      <aside className="tailor-sidebar">
        <div className="tailor-sidebar__logo">
          <span className="tailor-sidebar__logo-icon">᠁</span>
          <div>
            <div className="tailor-sidebar__logo-main">БУРИАД</div>
            <div className="tailor-sidebar__logo-sub">Оёдолчны самбар</div>
          </div>
        </div>

        <div className="tailor-sidebar__user">
          <div className="tailor-sidebar__avatar">
            {user.full_name?.[0]?.toUpperCase() ?? 'О'}
          </div>
          <div className="tailor-sidebar__user-info">
            <div className="tailor-sidebar__user-name">{user.full_name}</div>
            <div className="tailor-sidebar__user-role">Оёдолчин</div>
          </div>
        </div>

        <nav className="tailor-sidebar__nav">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                `tailor-sidebar__link${isActive ? ' tailor-sidebar__link--active' : ''}`
              }
            >
              <span className="tailor-sidebar__link-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <button className="tailor-sidebar__logout" onClick={handleLogout}>
          ← Гарах
        </button>
      </aside>

      {/* Main content */}
      <main className="tailor-main">
        <Outlet />
      </main>
    </div>
  )
}
