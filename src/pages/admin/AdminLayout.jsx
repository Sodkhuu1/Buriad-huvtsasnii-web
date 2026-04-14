import { NavLink, Outlet, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import './AdminLayout.css'

const navItems = [
  { path: '/admin',          label: 'Хяналтын самбар', icon: '▦', end: true },
  { path: '/admin/users',    label: 'Хэрэглэгчид',     icon: '◉' },
  { path: '/admin/tailors',  label: 'Оёдолчид',         icon: '✂' },
  { path: '/admin/orders',   label: 'Захиалгууд',       icon: '≡' },
]

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  if (!user) return <Navigate to="/login" replace />
  if (user.role?.toLowerCase() !== 'admin') return <Navigate to="/" replace />

  const handleLogout = () => { logout(); navigate('/') }

  return (
    <div className="admin-layout">
      {/* ── Sidebar ── */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar__logo">
          <span className="admin-sidebar__logo-icon">᠁</span>
          <div>
            <div className="admin-sidebar__logo-main">БУРИАД</div>
            <div className="admin-sidebar__logo-sub">Админ самбар</div>
          </div>
        </div>

        <div className="admin-sidebar__user">
          <div className="admin-sidebar__avatar">
            {user.full_name?.[0]?.toUpperCase() ?? 'А'}
          </div>
          <div className="admin-sidebar__user-info">
            <div className="admin-sidebar__user-name">{user.full_name}</div>
            <div className="admin-sidebar__user-role">Систем администратор</div>
          </div>
        </div>

        <nav className="admin-sidebar__nav">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                `admin-sidebar__link${isActive ? ' admin-sidebar__link--active' : ''}`
              }
            >
              <span className="admin-sidebar__link-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="admin-sidebar__divider" />

        <button className="admin-sidebar__logout" onClick={handleLogout}>
          ← Системээс гарах
        </button>
      </aside>

      {/* ── Main content ── */}
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  )
}
