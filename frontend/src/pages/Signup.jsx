import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './auth.css'

export default function Signup() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({ full_name: '', email: '', phone: '', password: '', confirm: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handle = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()

    if (form.password !== form.confirm) {
      setError('Нууц үг таарахгүй байна')
      return
    }

    setLoading(true)
    setError('')

    try {
      await register({
        full_name: form.full_name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        role: 'customer',
      })

      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message || 'Бүртгүүлэх үед алдаа гарлаа')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <aside className="auth-brand">
        <Link to="/" className="auth-brand__back">← Дэнз рүү буцах</Link>
        <span className="auth-brand__pill">Дэнз</span>
        <h1 className="auth-brand__title">Өөрийн дүр, хэмжээнд тохирсон захиалгаа нэг системээс эхлүүл.</h1>
        <p className="auth-brand__desc">
          Биеийн хэмжээсээ хадгалж, оёдолчидтой шууд холбогдон үндэсний хувцасны захиалгаа хялбар удирдах боломж.
        </p>

        <div className="auth-brand__list">
          <div className="auth-brand__item">
            <span>01</span>
            <p>Хувийн хэмжээсээ хадгалах</p>
          </div>
          <div className="auth-brand__item">
            <span>02</span>
            <p>Оёдолчидтой шууд чатлах</p>
          </div>
          <div className="auth-brand__item">
            <span>03</span>
            <p>Захиалгын явцаа хянах</p>
          </div>
        </div>
      </aside>

      <main className="auth-form-area">
        <div className="auth-card">
          <p className="auth-card__eyebrow">Create account</p>
          <h2 className="auth-card__heading">Бүртгүүлэх</h2>
          <p className="auth-card__intro">Дэнзийн системд нэгдэж, үндэсний хувцасны соёлыг мэдрээрэй.</p>

          <form onSubmit={submit}>
            <div className="auth-field">
              <label className="auth-field__label">Овог нэр</label>
              <input
                name="full_name"
                type="text"
                placeholder="Жишээ: Батмөнх Отгон"
                value={form.full_name}
                onChange={handle}
                required
                className="auth-field__input"
              />
            </div>

            <div className="auth-field auth-field--split">
              <div>
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

              <div>
                <label className="auth-field__label">Утас</label>
                <input
                  name="phone"
                  type="tel"
                  placeholder="9911 2233"
                  value={form.phone}
                  onChange={handle}
                  className="auth-field__input"
                />
              </div>
            </div>

            <div className="auth-field auth-field--split">
              <div>
                <label className="auth-field__label">Нууц үг</label>
                <input
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handle}
                  required
                  autoComplete="new-password"
                  className="auth-field__input"
                />
              </div>

              <div>
                <label className="auth-field__label">Давтах</label>
                <input
                  name="confirm"
                  type="password"
                  placeholder="••••••••"
                  value={form.confirm}
                  onChange={handle}
                  required
                  autoComplete="new-password"
                  className="auth-field__input"
                />
              </div>
            </div>

            {error && <div className="auth-error">{error}</div>}

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? 'Бүртгэж байна...' : 'Бүртгүүлэх'}
            </button>
          </form>

          <p className="auth-footer">
            Бүртгэлтэй юу?
            <Link to="/login">Нэвтрэх</Link>
          </p>
        </div>
      </main>
    </div>
  )
}
