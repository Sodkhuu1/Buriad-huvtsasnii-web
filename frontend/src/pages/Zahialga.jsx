import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../context/AuthContext'
import MeasurementGuide from '../components/MeasurementGuide'
import './Zahialga.css'

const STEPS = ['Загвар', 'Хэмжээс', 'Баталгаажуулах']

const EMPTY_MEASUREMENTS = {
  height: '', chest: '', waist: '', hip: '', sleeve: '', shoulder: '',
}

const MEASURE_LABELS = {
  height: 'Өндөр', chest: 'Цээж', waist: 'Бүсэлхий',
  hip: 'Ташаа', sleeve: 'Гарын урт', shoulder: 'Мөрний өргөн',
}

// ─── Auth Modal ───────────────────────────────────────────────────────────────

function AuthModal({ onSuccess, onClose }) {
  const { login, register } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('login')
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handle = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      let user
      if (tab === 'login') {
        user = await login(form.email, form.password)
      } else {
        user = await register({ ...form, role: 'customer' })
      }
      if (user.role === 'tailor') {
        navigate('/tailor', { replace: true })
        return
      }
      onSuccess()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={e => e.stopPropagation()}>
        <button className="auth-modal__close" onClick={onClose}>✕</button>
        <h2 className="auth-modal__title">Захиалга өгөхийн тулд нэвтэрнэ үү</h2>
        <p className="auth-modal__sub">Бүртгэл үүсгэх эсвэл нэвтэрч захиалгаа дуусгана уу.</p>

        <div className="auth-modal__tabs">
          <button className={`auth-modal__tab${tab === 'login' ? ' active' : ''}`} onClick={() => { setTab('login'); setError('') }}>Нэвтрэх</button>
          <button className={`auth-modal__tab${tab === 'register' ? ' active' : ''}`} onClick={() => { setTab('register'); setError('') }}>Бүртгүүлэх</button>
        </div>

        <form onSubmit={submit} className="auth-modal__form">
          {tab === 'register' && (
            <>
              <input name="full_name" placeholder="Овог нэр" value={form.full_name} onChange={handle} required className="auth-modal__input" />
              <input name="phone" placeholder="Утасны дугаар" value={form.phone} onChange={handle} className="auth-modal__input" />
            </>
          )}
          <input name="email" type="email" placeholder="И-мэйл" value={form.email} onChange={handle} required className="auth-modal__input" />
          <input name="password" type="password" placeholder="Нууц үг" value={form.password} onChange={handle} required className="auth-modal__input" />
          {error && <p className="auth-modal__error">{error}</p>}
          <button type="submit" className="btn-primary auth-modal__submit" disabled={loading}>
            {loading ? 'Түр хүлээнэ үү...' : tab === 'login' ? 'Нэвтрэх' : 'Бүртгүүлэх'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function Zahialga() {
  const { user } = useAuth()

  const [step, setStep]                   = useState(0)
  const [selectedDesign, setSelectedDesign] = useState(null)
  const [measurements, setMeasurements]   = useState(EMPTY_MEASUREMENTS)
  const [customNote, setCustomNote]       = useState('')
  const [submitted, setSubmitted]         = useState(false)
  const [submittedOrder, setSubmittedOrder] = useState(null)
  const [errors, setErrors]               = useState({})
  const [showAuthModal, setShowAuthModal] = useState(false)

  const [designs, setDesigns]             = useState([])
  const [loadingDesigns, setLoadingDesigns] = useState(true)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [apiError, setApiError]           = useState('')

  useEffect(() => {
    api.get('/garments')
      .then(data => setDesigns(data.garments))
      .catch(err => setApiError(err.message || 'Загварын мэдээлэл татахад алдаа гарлаа'))
      .finally(() => setLoadingDesigns(false))
  }, [])

  // ── Navigation ──────────────────────────────────────────────────────────────

  const goNext = () => {
    if (step === 0 && !selectedDesign) { setErrors({ design: 'Загвар сонгоно уу' }); return }
    if (step === 1) {
      const errs = {}
      Object.entries(measurements).forEach(([k, v]) => { if (!v) errs[k] = 'Шаардлагатай' })
      if (Object.keys(errs).length) { setErrors(errs); return }
    }
    setErrors({})
    setStep(s => s + 1)
  }

  const goBack = () => { setErrors({}); setStep(s => s - 1) }

  const handleMeasurement = (e) => {
    setMeasurements(p => ({ ...p, [e.target.name]: e.target.value }))
    setErrors(p => ({ ...p, [e.target.name]: undefined }))
  }

  // ── Submit ──────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!user) { setShowAuthModal(true); return }
    await doSubmit()
  }

  const doSubmit = async () => {
    setSubmitLoading(true)
    setApiError('')
    try {
      const data = await api.post('/orders', {
        design_id: selectedDesign.id,
        tailor_id: selectedDesign.tailor_id,
        measurements,
        custom_note: customNote || undefined,
      })
      setSubmittedOrder(data.order)
      setSubmitted(true)
    } catch (err) {
      setApiError(err.message)
    } finally {
      setSubmitLoading(false)
    }
  }

  const reset = () => {
    setStep(0); setSelectedDesign(null)
    setMeasurements(EMPTY_MEASUREMENTS); setCustomNote('')
    setSubmitted(false); setSubmittedOrder(null); setErrors({})
  }

  // ── Success screen ──────────────────────────────────────────────────────────

  if (submitted && submittedOrder) {
    return (
      <main className="zahialga-page">
        <div className="zahialga-success">
          <div className="zahialga-success__icon">✓</div>
          <h2 className="zahialga-success__title">Захиалга амжилттай!</h2>
          <p className="zahialga-success__text">
            Таны захиалга амжилттай илгээгдлээ.<br />
            Оёдолчин тантай удахгүй холбогдох болно.
          </p>
          <div className="zahialga-success__details">
            <div className="zahialga-success__row">
              <span>Захиалгын дугаар</span>
              <strong>#{submittedOrder.order_number}</strong>
            </div>
            <div className="zahialga-success__row">
              <span>Загвар</span>
              <strong>{selectedDesign.name}</strong>
            </div>
            {selectedDesign.tailor_name && (
              <div className="zahialga-success__row">
                <span>Оёдолчин</span>
                <strong>{selectedDesign.tailor_name}</strong>
              </div>
            )}
            <div className="zahialga-success__row">
              <span>Үнэ</span>
              <strong>{Number(submittedOrder.total_amount).toLocaleString()}₮</strong>
            </div>
          </div>
          <div className="zahialga-success__actions">
            <Link to={`/my-orders/${submittedOrder.id}`} className="btn-primary">
              Захиалгаа харах
            </Link>
            <button className="zahialga-success__secondary" onClick={reset}>
              Шинэ захиалга өгөх
            </button>
          </div>
        </div>
      </main>
    )
  }

  // ── Main render ─────────────────────────────────────────────────────────────

  return (
    <main className="zahialga-page">
      {showAuthModal && (
        <AuthModal
          onSuccess={() => { setShowAuthModal(false); doSubmit() }}
          onClose={() => setShowAuthModal(false)}
        />
      )}

      {/* Header */}
      <div className="zahialga-header ornament-bg">
        <h1 className="zahialga-header__title section-title">Захиалга өгөх</h1>
        <span className="gold-line" />
        <p className="zahialga-header__sub section-subtitle">
          Гурван алхмаар биеийн хэмжээсэндээ тохирсон буриад хувцас захиалаарай.
        </p>
      </div>

      {/* Step indicator */}
      <div className="zahialga-steps container">
        {STEPS.map((label, i) => (
          <div key={i} className={`zahialga-steps__item${i <= step ? ' active' : ''}${i < step ? ' done' : ''}`}>
            <div className="zahialga-steps__circle">{i < step ? '✓' : i + 1}</div>
            <span className="zahialga-steps__label">{label}</span>
            {i < STEPS.length - 1 && <div className="zahialga-steps__line" />}
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="zahialga-content container">

        {apiError && <div className="zahialga-api-error">{apiError}</div>}

        {/* ── STEP 0: Загвар сонгох ──────────────────────────────────────── */}
        {step === 0 && (
          <div className="zahialga-section">
            <h2 className="zahialga-section__title">Загвар сонгоно уу</h2>
            <p className="zahialga-section__hint">
              Оёдолчдын оруулсан загваруудаас сонгоно уу. Загвар бүр оёдолчны нэртэй хамт харагдана.
            </p>
            {errors.design && <p className="zahialga-error">{errors.design}</p>}

            {loadingDesigns ? (
              <div className="zahialga-loading">Ачааллаж байна...</div>
            ) : designs.length === 0 ? (
              <div className="zahialga-empty">Одоогоор загвар оруулаагүй байна.</div>
            ) : (
              <div className="design-grid">
                {designs.map(d => (
                  <button
                    key={d.id}
                    className={`design-card${selectedDesign?.id === d.id ? ' design-card--selected' : ''}`}
                    onClick={() => { setSelectedDesign(d); setErrors({}) }}
                  >
                    <div className="design-card__img-wrap">
                      {d.image_url ? (
                        <img src={d.image_url} alt={d.name} className="design-card__img" />
                      ) : (
                        <div className="design-card__img design-card__img--placeholder">✂</div>
                      )}
                      {selectedDesign?.id === d.id && <div className="design-card__check">✓</div>}
                    </div>
                    <div className="design-card__body">
                      {d.category_name && (
                        <span className="design-card__category">{d.category_name}{d.audience ? ` · ${d.audience}` : ''}</span>
                      )}
                      <h3 className="design-card__name">{d.name}</h3>
                      {d.ceremonial_use && <p className="design-card__desc">{d.ceremonial_use}</p>}
                      {d.tailor_name && <p className="design-card__tailor">Оёдолчин: {d.tailor_name}</p>}
                      <span className="design-card__price">{Number(d.base_price).toLocaleString()}₮-с эхлэн</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── STEP 1: Хэмжээс оруулах ───────────────────────────────────── */}
        {step === 1 && (
          <div className="zahialga-section">
            <h2 className="zahialga-section__title">Биеийн хэмжээс оруулах</h2>
            <p className="zahialga-section__hint">
              Хэмжээс бүрийг дарж заавар харна уу. Бүх хэмжээсийг сантиметрээр оруулна.
            </p>
            <MeasurementGuide
              measurements={measurements}
              errors={errors}
              onChange={handleMeasurement}
            />
          </div>
        )}

        {/* ── STEP 2: Баталгаажуулах ────────────────────────────────────── */}
        {step === 2 && (
          <div className="zahialga-section">
            <h2 className="zahialga-section__title">Захиалгаа шалгаад батлаарай</h2>
            <p className="zahialga-section__hint">
              Бүх мэдээллийг нягталж үзээд захиалгаа илгээнэ үү.
            </p>

            <div className="confirm-grid">
              {/* Сонгосон загвар */}
              <div className="confirm-card">
                <h3 className="confirm-card__title">Загвар</h3>
                <div className="confirm-card__design">
                  {selectedDesign.image_url ? (
                    <img src={selectedDesign.image_url} alt={selectedDesign.name} className="confirm-card__img" />
                  ) : (
                    <div className="confirm-card__img confirm-card__img--placeholder">✂</div>
                  )}
                  <div>
                    <p className="confirm-card__design-name">{selectedDesign.name}</p>
                    {selectedDesign.category_name && <p className="confirm-card__design-cat">{selectedDesign.category_name}</p>}
                    {selectedDesign.tailor_name && <p className="confirm-card__design-tailor">Оёдолчин: {selectedDesign.tailor_name}</p>}
                    <p className="confirm-card__price">{Number(selectedDesign.base_price).toLocaleString()}₮</p>
                  </div>
                </div>
              </div>

              {/* Хэмжээс */}
              <div className="confirm-card">
                <h3 className="confirm-card__title">Хэмжээс</h3>
                <div className="confirm-measurements">
                  {Object.entries(measurements).map(([key, val]) => (
                    <div key={key} className="confirm-measurement-row">
                      <span className="confirm-measurement-key">{MEASURE_LABELS[key]}</span>
                      <span className="confirm-measurement-val">{val} см</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Нэмэлт тайлбар */}
            <div className="confirm-note-input">
              <label className="confirm-note-input__label">Нэмэлт тайлбар, хүсэлт (заавал биш)</label>
              <textarea
                className="confirm-note-input__textarea"
                value={customNote}
                onChange={e => setCustomNote(e.target.value)}
                placeholder="Жишээ нь: Хатуу торгон материал хүсч байна, улаан өнгөтэй..."
                rows={3}
              />
            </div>

            <div className="confirm-note">
              {user
                ? <p>Та захиалгаа баталсны дараа оёдолчин таны захиалгыг хянаж, нарийвчилсан үнэ болон хугацааг тантай тохирно.</p>
                : <p>Захиалга илгээхийн тулд нэвтрэх шаардлагатай. "Захиалга илгээх" дарахад нэвтрэх цонх нээгдэнэ.</p>
              }
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="zahialga-nav">
          {step > 0 && (
            <button className="btn-secondary zahialga-nav__back" onClick={goBack}>
              ← Буцах
            </button>
          )}
          {step < 2 ? (
            <button className="btn-primary" onClick={goNext}>
              Үргэлжлүүлэх →
            </button>
          ) : (
            <button className="btn-primary" onClick={handleSubmit} disabled={submitLoading}>
              {submitLoading ? 'Илгээж байна...' : 'Захиалга илгээх ✓'}
            </button>
          )}
        </div>

      </div>
    </main>
  )
}
