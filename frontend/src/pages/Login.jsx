import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './auth.css'

const brandItems = [
  'Захиалгын урсгал илүү ойлгомжтой',
  'Брэндийн нэр, өнгө төрх нэг мөр',
  'Соёлын утгыг танилцуулах орон зай',
]

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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
      setError(err.message || 'Нэвтрэх үед алдаа гарлаа')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <aside className="auth-brand">
        <Link to="/" className="auth-brand__back">← Дэнз рүү буцах</Link>
        <span className="auth-brand__pill">Дэнз</span>
        <h1 className="auth-brand__title">Буриад хувцасны захиалгыг илүү цэгцтэй эхлүүлэх орчин.</h1>
        <p className="auth-brand__desc">
          Нэвтэрснээр та захиалгаа хянах, хэмжээсээ хадгалах, оёдлын явцаа илүү ойлгомжтой дагах боломжтой.
        </p>

        <div className="auth-brand__list">
          {brandItems.map((item, index) => (
            <div className="auth-brand__item" key={item}>
              <span>{`0${index + 1}`}</span>
              <p>{item}</p>
            </div>
          ))}
        </div>
      </aside>

      <main className="auth-form-area">
        <div className="auth-card">
          <p className="auth-card__eyebrow">Welcome back</p>
          <h2 className="auth-card__heading">Нэвтрэх</h2>
          <p className="auth-card__intro">Дэнзийн системд нэвтэрч захиалга, загвар, мэдээллээ үргэлжлүүлээрэй.</p>

          <form onSubmit={submit}>
            <div className="auth-field">
              <label className="auth-field__label">И-мэйл</label>
              <input
                name="email"
                type="email"
                placeholder="name@example.com"
                value={form.email}
                onChange={handle}
                required
                autoComplete="email"
                className="auth-field__input"
              />
            </div>

            <div className="auth-field">
              <label className="auth-field__label">Нууц үг</label>
              <input
                name="password"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={handle}
                required
                autoComplete="current-password"
                className="auth-field__input"
              />
            </div>

            <div className="auth-forgot">
              <button type="button">Нууц үгээ сэргээх</button>
            </div>

            {error && <div className="auth-error">{error}</div>}

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? 'Нэвтэрч байна...' : 'Нэвтрэх'}
            </button>
          </form>

          <p className="auth-footer">
            Бүртгэлгүй юу?
            <Link to="/signup">Бүртгүүлэх</Link>
          </p>
        </div>
      </main>
    </div>
  )
}
