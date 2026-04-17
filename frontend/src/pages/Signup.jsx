import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './auth.css'

export default function Signup() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [role, setRole] = useState('customer')
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', password: '', confirm: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handle = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    if (form.password !== form.confirm) {
      setError('Нууц үг таарахгүй байна'); return
    }
    setLoading(true)
    setError('')
    try {
      const user = await register({
        full_name: form.full_name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        role,
      })

      if (user.role === 'tailor') {
        navigate('/tailor', { replace: true })
      } else {
        navigate('/', { replace: true })
      }
    } catch (err) {
      setError(err.message || 'Бүртгүүлэхэд алдаа гарлаа')
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
          <p className="auth-card__eyebrow">Шинэ бүртгэл</p>
          <h2 className="auth-card__heading">Бүртгүүлэх</h2>
          <div className="auth-card__accent" />

          <form onSubmit={submit}>
            <div className="auth-field">
              <label className="auth-field__label">ОВОГ НЭР</label>
              <input
                name="full_name"
                type="text"
                placeholder="Таны нэрийг оруулна уу"
                value={form.full_name}
                onChange={handle}
                required
                className="auth-field__input"
              />
            </div>

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
                autoComplete="new-password"
                className="auth-field__input"
              />
            </div>

            <div className="auth-field">
              <label className="auth-field__label">НУУЦ ҮГ ДАВТАХ</label>
              <input
                name="confirm"
                type="password"
                placeholder="••••••••••"
                value={form.confirm}
                onChange={handle}
                required
                autoComplete="new-password"
                className="auth-field__input"
              />
            </div>

            {error && <div className="auth-error">{error}</div>}

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? 'Түр хүлээнэ үү...' : 'БҮРТГҮҮЛЭХ'}
            </button>
          </form>

          <p className="auth-footer">
            Бүртгэлтэй юу?
            <Link to="/login">Нэвтрэх →</Link>
          </p>
        </div>
      </main>
    </div>
  )
}
