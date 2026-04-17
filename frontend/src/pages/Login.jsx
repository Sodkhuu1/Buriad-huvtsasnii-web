import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './auth.css'

export default function Login() {
  const { login } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()

  const [form, setForm]       = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  // After login, redirect to where the user came from — or role-based default
  const from = location.state?.from || null

  const handle = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const user = await login(form.email, form.password)

      const role = user.role?.toLowerCase()
      if (role === 'admin') {
        navigate('/admin', { replace: true })
      } else if (role === 'tailor') {
        navigate('/tailor', { replace: true })
      } else {
        navigate(from || '/', { replace: true })
      }
    } catch (err) {
      setError(err.message || 'Нэвтрэхэд алдаа гарлаа')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">

      {/* ── Left brand panel ── */}
      <aside className="auth-brand">
        <div className="auth-brand__top-bar" />
        <div className="auth-brand__bottom-bar" />

        <div className="auth-brand__logo">
          <div className="auth-brand__logo-ring" />
          <div className="auth-brand__logo-dot">
            <span className="auth-brand__logo-letter">Б</span>
          </div>
        </div>

        <h1 className="auth-brand__title">БУРИАД</h1>
        <p className="auth-brand__subtitle">ХУВЦАСНЫ</p>
        <div className="auth-brand__divider" />
        <p className="auth-brand__tagline">Уламжлалт хувцасны урлал</p>
        <p className="auth-brand__desc">
          Монгол уламжлалыг орчин үеийн<br />
          гоо сайхантай хослуулсан оёдол үйлчилгээ
        </p>
      </aside>

      {/* ── Right form area ── */}
      <main className="auth-form-area">
        <div className="auth-card">
          <p className="auth-card__eyebrow">Тавтай морил!</p>
          <h2 className="auth-card__heading">Нэвтрэх</h2>
          <div className="auth-card__accent" />

          <form onSubmit={submit}>
            <div className="auth-field">
              <label className="auth-field__label">И-МЭЙЛ ХАЯГ</label>
              <input
                name="email"
                type="email"
                placeholder="example@email.com"
                value={form.email}
                onChange={handle}
                required
                autoComplete="email"
                className="auth-field__input"
              />
            </div>

            <div className="auth-field">
              <label className="auth-field__label">НУУЦ ҮГ</label>
              <input
                name="password"
                type="password"
                placeholder="••••••••••"
                value={form.password}
                onChange={handle}
                required
                autoComplete="current-password"
                className="auth-field__input"
              />
            </div>

            <div className="auth-forgot">
              <button type="button">Нууц үг мартсан уу?</button>
            </div>

            {error && <div className="auth-error">{error}</div>}

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? 'Түр хүлээнэ үү...' : 'НЭВТРЭХ'}
            </button>
          </form>

          <div className="auth-divider">
            <span className="auth-divider__line" />
            <span className="auth-divider__text">эсвэл</span>
            <span className="auth-divider__line" />
          </div>

          <p className="auth-footer">
            Бүртгэлгүй юу?
            <Link to="/signup">Бүртгүүлэх →</Link>
          </p>
        </div>
      </main>
    </div>
  )
}
