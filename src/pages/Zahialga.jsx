import { useState, useEffect } from 'react'
import { api } from '../api'
import { useAuth } from '../context/AuthContext'
import './Zahialga.css'

const STEPS = ['Загвар', 'Хэмжээс', 'Оёдолчин', 'Батлах']

const EMPTY_MEASUREMENTS = {
  height: '', chest: '', waist: '', hip: '', sleeve: '', shoulder: '',
}

// ── Auth Modal ────────────────────────────────────────────────────────────────

function AuthModal({ onSuccess, onClose }) {
  const { login, register } = useAuth()
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
      if (tab === 'login') {
        await login(form.email, form.password)
      } else {
        await register({ ...form, role: 'customer' })
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

// ── Main component ────────────────────────────────────────────────────────────

export default function Zahialga() {
  const { user } = useAuth()

  const [step, setStep] = useState(0)
  const [selectedDesign, setSelectedDesign] = useState(null)
  const [measurements, setMeasurements] = useState(EMPTY_MEASUREMENTS)
  const [selectedTailor, setSelectedTailor] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [submittedOrder, setSubmittedOrder] = useState(null)
  const [errors, setErrors] = useState({})
  const [showAuthModal, setShowAuthModal] = useState(false)

  // API data
  const [designs, setDesigns] = useState([])
  const [tailors, setTailors] = useState([])
  const [loadingDesigns, setLoadingDesigns] = useState(true)
  const [loadingTailors, setLoadingTailors] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [apiError, setApiError] = useState('')

  // Load garment designs on mount
  useEffect(() => {
    api.get('/garments')
      .then(data => setDesigns(data.garments))
      .catch(() => setApiError('Загварын мэдээлэл татахад алдаа гарлаа'))
      .finally(() => setLoadingDesigns(false))
  }, [])

  // Load tailors when reaching step 2
  useEffect(() => {
    if (step === 2 && tailors.length === 0) {
      setLoadingTailors(true)
      api.get('/tailors')
        .then(data => setTailors(data.tailors))
        .catch(() => setApiError('Оёдолчдын мэдээлэл татахад алдаа гарлаа'))
        .finally(() => setLoadingTailors(false))
    }
  }, [step])

  // ── Step navigation ──────────────────────────────────────────────────────

  const goNext = () => {
    if (step === 0 && !selectedDesign) { setErrors({ design: 'Загвар сонгоно уу' }); return }
    if (step === 1) {
      const errs = {}
      Object.entries(measurements).forEach(([k, v]) => { if (!v) errs[k] = 'Шаардлагатай' })
      if (Object.keys(errs).length) { setErrors(errs); return }
    }
    if (step === 2 && !selectedTailor) { setErrors({ tailor: 'Оёдолчин сонгоно уу' }); return }
    setErrors({})
    setStep(s => s + 1)
  }

  const goBack = () => { setErrors({}); setStep(s => s - 1) }

  const handleMeasurement = (e) => {
    setMeasurements(p => ({ ...p, [e.target.name]: e.target.value }))
    setErrors(p => ({ ...p, [e.target.name]: undefined }))
  }

  // ── Submit ───────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!user) {
      setShowAuthModal(true)
      return
    }
    await doSubmit()
  }

  const doSubmit = async () => {
    setSubmitLoading(true)
    setApiError('')
    try {
      const data = await api.post('/orders', {
        design_id:    selectedDesign.id,
        tailor_id:    selectedTailor.id,
        measurements,
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
    setStep(0); setSelectedDesign(null); setMeasurements(EMPTY_MEASUREMENTS)
    setSelectedTailor(null); setSubmitted(false); setSubmittedOrder(null); setErrors({})
  }

  // ── Success screen ───────────────────────────────────────────────────────

  if (submitted && submittedOrder) {
    return (
      <main className="zahialga-page">
        <div className="zahialga-success">
          <div className="zahialga-success__icon">✓</div>
          <h2 className="zahialga-success__title">Захиалга амжилттай!</h2>
          <p className="zahialga-success__text">
            Таны захиалга <strong>{selectedTailor.full_name}</strong>-д илгээгдлээ.<br />
            Оёдолчин тантай удахгүй холбогдох болно.
          </p>
          <div className="zahialga-success__summary">
            <span>{selectedDesign.name}</span>
            <span>·</span>
            <span>#{submittedOrder.order_number}</span>
            <span>·</span>
            <span>{Number(submittedOrder.total_amount).toLocaleString()}₮</span>
          </div>
          <button className="btn-primary" onClick={reset}>Шинэ захиалга</button>
        </div>
      </main>
    )
  }

  // ── Main page ────────────────────────────────────────────────────────────

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
          Дөрвөн алхмаар биеийн хэмжээсэндээ тохирсон буриад хувцас захиалаарай.
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

        {/* ── STEP 0: Загвар сонгох ─────────────────────────────────────── */}
        {step === 0 && (
          <div className="zahialga-section">
            <h2 className="zahialga-section__title">Загвар сонгоно уу</h2>
            {errors.design && <p className="zahialga-error">{errors.design}</p>}

            {loadingDesigns ? (
              <div className="zahialga-loading">Ачааллаж байна...</div>
            ) : (
              <div className="design-grid">
                {designs.map(d => (
                  <button
                    key={d.id}
                    className={`design-card${selectedDesign?.id === d.id ? ' design-card--selected' : ''}`}
                    onClick={() => { setSelectedDesign(d); setErrors({}) }}
                  >
                    <div className="design-card__img-wrap">
                      <img src={d.image_url} alt={d.name} className="design-card__img" />
                      {selectedDesign?.id === d.id && <div className="design-card__check">✓</div>}
                    </div>
                    <div className="design-card__body">
                      <span className="design-card__category">{d.category_name} · {d.audience}</span>
                      <h3 className="design-card__name">{d.name}</h3>
                      <p className="design-card__desc">{d.ceremonial_use}</p>
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
              Бүх хэмжээсийг сантиметрээр оруулна уу.
            </p>
            <div className="measure-grid">
              {[
                { name: 'height',   label: 'Өндөр',        icon: '↕', hint: 'Толгойноос хөлийн ул хүртэл' },
                { name: 'chest',    label: 'Цээж',         icon: '○', hint: 'Цээжний хамгийн өргөн хэсэг' },
                { name: 'waist',    label: 'Бүсэлхий',    icon: '○', hint: 'Хамгийн нарийн хэсэг' },
                { name: 'hip',      label: 'Ташаа',        icon: '○', hint: 'Ташааны хамгийн өргөн хэсэг' },
                { name: 'sleeve',   label: 'Гарын урт',    icon: '↔', hint: 'Мөрнөөс бугуй хүртэл' },
                { name: 'shoulder', label: 'Мөрний өргөн', icon: '↔', hint: 'Мөрний хоорондох зай' },
              ].map(field => (
                <div key={field.name} className="measure-field">
                  <label className="measure-field__label">
                    <span className="measure-field__icon">{field.icon}</span>
                    {field.label}
                  </label>
                  <div className="measure-field__input-wrap">
                    <input
                      type="number"
                      name={field.name}
                      value={measurements[field.name]}
                      onChange={handleMeasurement}
                      placeholder="0"
                      min="1"
                      className={`measure-field__input${errors[field.name] ? ' measure-field__input--error' : ''}`}
                    />
                    <span className="measure-field__unit">см</span>
                  </div>
                  <span className="measure-field__hint">{field.hint}</span>
                  {errors[field.name] && <span className="zahialga-error">{errors[field.name]}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP 2: Оёдолчин сонгох ───────────────────────────────────── */}
        {step === 2 && (
          <div className="zahialga-section">
            <h2 className="zahialga-section__title">Оёдолчин сонгоно уу</h2>
            {errors.tailor && <p className="zahialga-error">{errors.tailor}</p>}

            {loadingTailors ? (
              <div className="zahialga-loading">Ачааллаж байна...</div>
            ) : (
              <div className="tailor-list">
                {tailors.map(t => (
                  <button
                    key={t.id}
                    className={`tailor-card${selectedTailor?.id === t.id ? ' tailor-card--selected' : ''}`}
                    onClick={() => { setSelectedTailor(t); setErrors({}) }}
                  >
                    <img src={t.avatar_url} alt={t.full_name} className="tailor-card__avatar" />
                    <div className="tailor-card__info">
                      <h3 className="tailor-card__name">{t.full_name}</h3>
                      <p className="tailor-card__spec">{t.specialization}</p>
                      <p className="tailor-card__business">{t.business_name}</p>
                    </div>
                    <div className="tailor-card__meta">
                      <div className="tailor-card__rating">★ {t.rating}</div>
                      <div className="tailor-card__days">⏱ {t.min_lead_days}–{t.max_lead_days} хоног</div>
                    </div>
                    {selectedTailor?.id === t.id && (
                      <div className="tailor-card__selected-badge">✓</div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── STEP 3: Батлах ────────────────────────────────────────────── */}
        {step === 3 && (
          <div className="zahialga-section">
            <h2 className="zahialga-section__title">Захиалгаа шалгаад батлаарай</h2>

            <div className="confirm-grid">

              <div className="confirm-card">
                <h3 className="confirm-card__title">Сонгосон загвар</h3>
                <div className="confirm-card__design">
                  <img src={selectedDesign.image_url} alt={selectedDesign.name} className="confirm-card__img" />
                  <div>
                    <p className="confirm-card__design-name">{selectedDesign.name}</p>
                    <p className="confirm-card__design-cat">{selectedDesign.category_name}</p>
                    <p className="confirm-card__price">{Number(selectedDesign.base_price).toLocaleString()}₮-с эхлэн</p>
                  </div>
                </div>
              </div>

              <div className="confirm-card">
                <h3 className="confirm-card__title">Хэмжээс</h3>
                <div className="confirm-measurements">
                  {Object.entries(measurements).map(([key, val]) => (
                    <div key={key} className="confirm-measurement-row">
                      <span className="confirm-measurement-key">
                        {{ height: 'Өндөр', chest: 'Цээж', waist: 'Бүсэлхий', hip: 'Ташаа', sleeve: 'Гарын урт', shoulder: 'Мөрний өргөн' }[key]}
                      </span>
                      <span className="confirm-measurement-val">{val} см</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="confirm-card">
                <h3 className="confirm-card__title">Оёдолчин</h3>
                <div className="confirm-tailor">
                  <img src={selectedTailor.avatar_url} alt={selectedTailor.full_name} className="confirm-tailor__avatar" />
                  <div>
                    <p className="confirm-tailor__name">{selectedTailor.full_name}</p>
                    <p className="confirm-tailor__business">{selectedTailor.business_name}</p>
                    <p className="confirm-tailor__days">Хугацаа: {selectedTailor.min_lead_days}–{selectedTailor.max_lead_days} хоног</p>
                  </div>
                </div>
              </div>

            </div>

            <div className="confirm-note">
              {user
                ? <p>Та захиалгаа баталсны дараа оёдолчин таны захиалгыг хянаж, үнэ болон нарийвчилсан мэдээллийг тантай тохирно.</p>
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
          {step < 3 ? (
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
