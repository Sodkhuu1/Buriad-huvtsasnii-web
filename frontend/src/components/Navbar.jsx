import { useState, useEffect } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Navbar.css'

const navLinks = [
  { path: '/', label: 'Эхлэл' },
  { path: '/zahialga', label: 'Захиалга' },
  { path: '/huvtsasnii-utga', label: 'Утга, хэв маяг' },
  { path: '/bidnii-tuhaid', label: 'Бидний тухай' },
]

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 28)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setMenuOpen(false)
  }, [location])

  const isHome = location.pathname === '/'
  const darkText = !scrolled && !isHome

  return (
    <header className={`navbar${scrolled ? ' navbar--scrolled' : ''}${darkText ? ' navbar--dark-text' : ''}`}>
      <div className="navbar__inner container">
        <NavLink to="/" className="navbar__logo" aria-label="Дэнз нүүр хуудас">
          <span className="navbar__logo-mark">Д</span>
          <span className="navbar__logo-text">
            <span className="navbar__logo-main">Дэнз</span>
            <span className="navbar__logo-sub">буриад хувцасны студи</span>
          </span>
        </NavLink>

        <nav className="navbar__links">
          {navLinks.map(({ path, label }) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/'}
              className={({ isActive }) => `navbar__link${isActive ? ' navbar__link--active' : ''}`}
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="navbar__actions">
          {user ? (
            <div className="navbar__user">
              <div className="navbar__user-meta">
                <span className="navbar__user-name">{user.full_name}</span>
                <span className="navbar__user-role">
                  {user.role === 'customer' && 'Захиалагч'}
                  {user.role === 'admin' && 'Админ'}
                  {user.role === 'tailor' && 'Оёдолчин'}
                </span>
              </div>

              {user.role === 'customer' && (
                <NavLink to="/my-orders" className="navbar__dashboard-link">Миний захиалгууд</NavLink>
              )}
              {user.role === 'admin' && (
                <NavLink to="/admin" className="navbar__dashboard-link">Удирдлага</NavLink>
              )}
              {user.role === 'tailor' && (
                <NavLink to="/tailor" className="navbar__dashboard-link">Самбар</NavLink>
              )}
              <button className="navbar__logout" onClick={handleLogout}>Гарах</button>
            </div>
          ) : (
            <NavLink to="/login" className="navbar__login">
              Нэвтрэх
            </NavLink>
          )}

          <NavLink to="/zahialga" className="navbar__cta btn-primary">
            Захиалга өгөх
          </NavLink>
        </div>

        <button
          className={`navbar__burger${menuOpen ? ' open' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Цэс нээх"
        >
          <span /><span /><span />
        </button>
      </div>

      <div className={`navbar__mobile${menuOpen ? ' navbar__mobile--open' : ''}`}>
        <div className="navbar__mobile-brand">
          <span className="navbar__mobile-mark">Д</span>
          <div>
            <strong>Дэнз</strong>
            <span>Буриад хувцасны студи</span>
          </div>
        </div>

        {navLinks.map(({ path, label }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/'}
            className={({ isActive }) => `navbar__mobile-link${isActive ? ' active' : ''}`}
          >
            {label}
          </NavLink>
        ))}

        {user ? (
          <>
            <div className="navbar__mobile-user">{user.full_name}</div>
            {user.role === 'customer' && (
              <NavLink to="/my-orders" className="navbar__mobile-link">Миний захиалгууд</NavLink>
            )}
            {user.role === 'admin' && (
              <NavLink to="/admin" className="navbar__mobile-link">Админ удирдлага</NavLink>
            )}
            {user.role === 'tailor' && (
              <NavLink to="/tailor" className="navbar__mobile-link">Оёдолчны самбар</NavLink>
            )}
            <button className="navbar__mobile-link navbar__mobile-logout" onClick={handleLogout}>
              Гарах
            </button>
          </>
        ) : (
          <NavLink to="/login" className="navbar__mobile-link">
            Нэвтрэх
          </NavLink>
        )}

        <NavLink to="/zahialga" className="btn-primary navbar__mobile-cta">
          Захиалга өгөх
        </NavLink>
      </div>
    </header>
  )
}
