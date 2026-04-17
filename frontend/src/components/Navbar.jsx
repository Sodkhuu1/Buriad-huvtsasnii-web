import { useState, useEffect } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Navbar.css'

const navLinks = [
  { path: '/',                 label: 'Нүүр хуудас' },
  { path: '/zahialga',         label: 'Захиалга өгөх' },
  { path: '/huvtsasnii-utga',  label: 'Хувцасны утга' },
  { path: '/bidnii-tuhaid',    label: 'Бидний тухай' },
]

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  const handleLogout = () => { logout(); navigate('/') }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setMenuOpen(false)
  }, [location])

  return (
    <header className={`navbar${scrolled ? ' navbar--scrolled' : ''}`}>
      <div className="navbar__inner container">

        {/* Logo */}
        <NavLink to="/" className="navbar__logo">
          <span className="navbar__logo-icon">᠁</span>
          <span className="navbar__logo-text">
            <span className="navbar__logo-main">БУРИАД</span>
            <span className="navbar__logo-sub">ХУВЦАС</span>
          </span>
        </NavLink>

        {/* Desktop nav */}
        <nav className="navbar__links">
          {navLinks.map(({ path, label }) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/'}
              className={({ isActive }) =>
                `navbar__link${isActive ? ' navbar__link--active' : ''}`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Auth area */}
        {user ? (
          <div className="navbar__user">
            <span className="navbar__user-name">{user.full_name}</span>
            {user.role === 'admin' && (
              <NavLink to="/admin" className="navbar__dashboard-link">Админ</NavLink>
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

        {/* CTA button */}
        <NavLink to="/zahialga" className="navbar__cta btn-primary">
          Захиалга өгөх
        </NavLink>

        {/* Hamburger */}
        <button
          className={`navbar__burger${menuOpen ? ' open' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Цэс нээх"
        >
          <span /><span /><span />
        </button>
      </div>

      {/* Mobile menu */}
      <div className={`navbar__mobile${menuOpen ? ' navbar__mobile--open' : ''}`}>
        {navLinks.map(({ path, label }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/'}
            className={({ isActive }) =>
              `navbar__mobile-link${isActive ? ' active' : ''}`
            }
          >
            {label}
          </NavLink>
        ))}
        {user ? (
          <>
            <div className="navbar__mobile-user">{user.full_name}</div>
            {user.role === 'admin' && (
              <NavLink to="/admin" className="navbar__mobile-link">Админ самбар</NavLink>
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
