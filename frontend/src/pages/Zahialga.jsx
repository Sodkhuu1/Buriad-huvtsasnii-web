import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../context/AuthContext'
import MeasurementGuide from '../components/MeasurementGuide'
import TryOnModal from '../components/TryOnModal'
import './Zahialga.css'

const STEPS = [
  { label: 'Загвар', note: 'сонголтоо хий' },
  { label: 'Хэмжээс', note: 'биеийн мэдээллээ оруул' },
  { label: 'Баталгаажуулах', note: 'захиалгаа илгээ' },
]

const EMPTY_MEASUREMENTS = {
  height: '',
  chest: '',
  waist: '',
  hip: '',
  sleeve: '',
  shoulder: '',
}

const MEASURE_LABELS = {
  height: 'Өндөр',
  chest: 'Цээж',
  waist: 'Бүсэлхий',
  hip: 'Ташаа',
  sleeve: 'Гарын урт',
  shoulder: 'Мөрний өргөн',
}

const formatPrice = (value) => `${Number(value || 0).toLocaleString()}₮`

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
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <button className="auth-modal__close" onClick={onClose}>✕</button>
        <span className="auth-modal__eyebrow">Дэнз account</span>
        <h2 className="auth-modal__title">Захиалгаа илгээхийн өмнө нэвтэрнэ үү</h2>
        <p className="auth-modal__sub">Бүртгэлтэй бол нэвтэрнэ, үгүй бол түргэн бүртгэл үүсгээд захиалгаа шууд үргэлжлүүлж болно.</p>

        <div className="auth-modal__tabs">
          <button
            className={`auth-modal__tab${tab === 'login' ? ' active' : ''}`}
            onClick={() => { setTab('login'); setError('') }}
          >
            Нэвтрэх
          </button>
          <button
            className={`auth-modal__tab${tab === 'register' ? ' active' : ''}`}
            onClick={() => { setTab('register'); setError('') }}
          >
            Бүртгүүлэх
          </button>
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
            {loading ? 'Түр хүлээнэ үү...' : tab === 'login' ? 'Нэвтрээд үргэлжлүүлэх' : 'Бүртгүүлээд үргэлжлүүлэх'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function Zahialga() {
  const { user } = useAuth()

  const [step, setStep] = useState(0)
  const [selectedDesign, setSelectedDesign] = useState(null)
  const [measurements, setMeasurements] = useState(EMPTY_MEASUREMENTS)
  const [customNote, setCustomNote] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submittedOrder, setSubmittedOrder] = useState(null)
  const [errors, setErrors] = useState({})
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [tryOnDesign, setTryOnDesign] = useState(null)

  const [designs, setDesigns] = useState([])
  const [loadingDesigns, setLoadingDesigns] = useState(true)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [apiError, setApiError] = useState('')
  const currentStep = STEPS[step]

  useEffect(() => {
    api.get('/garments')
      .then(data => setDesigns(data.garments))
      .catch(err => setApiError(err.message || 'Загварын мэдээлэл татахад алдаа гарлаа'))
      .finally(() => setLoadingDesigns(false))
  }, [])

  const goNext = () => {
    if (step === 0 && !selectedDesign) {
      setErrors({ design: 'Эхлээд нэг загвар сонгоно уу' })
      return
    }

    if (step === 1) {
      const nextErrors = {}
      Object.entries(measurements).forEach(([key, value]) => {
        if (!value) {
          nextErrors[key] = 'Шаардлагатай'
        }
      })

      if (Object.keys(nextErrors).length) {
        setErrors(nextErrors)
        return
      }
    }

    setErrors({})
    setStep((current) => current + 1)
  }

  const goBack = () => {
    setErrors({})
    setStep((current) => current - 1)
  }

  const handleMeasurement = (e) => {
    setMeasurements(p => ({ ...p, [e.target.name]: e.target.value }))
    setErrors(p => ({ ...p, [e.target.name]: undefined }))
  }

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
    setStep(0)
    setSelectedDesign(null)
    setMeasurements(EMPTY_MEASUREMENTS)
    setCustomNote('')
    setSubmitted(false)
    setSubmittedOrder(null)
    setErrors({})
  }

  if (submitted && submittedOrder) {
    return (
      <main className="zahialga-page">
        <section className="zahialga-success container">
          <div className="zahialga-success__icon">✓</div>
          <h2 className="zahialga-success__title">Захиалга амжилттай илгээгдлээ</h2>
          <p className="zahialga-success__text">
            Дэнзийн систем таны захиалгыг бүртгэлээ. Оёдолчин тань дэлгэрэнгүй мэдээллийг шалгаад
            удахгүй холбогдох болно.
          </p>

          <div className="zahialga-success__details">
            <div className="zahialga-success__row">
              <span>Захиалгын дугаар</span>
              <strong>#{submittedOrder.order_number}</strong>
            </div>
            <div className="zahialga-success__row">
              <span>Сонгосон загвар</span>
              <strong>{selectedDesign.name}</strong>
            </div>
            {selectedDesign.tailor_name && (
              <div className="zahialga-success__row">
                <span>Оёдолчин</span>
                <strong>{selectedDesign.tailor_name}</strong>
              </div>
            )}
            <div className="zahialga-success__row">
              <span>Дүн</span>
              <strong>{formatPrice(submittedOrder.total_amount)}</strong>
            </div>
          </div>

          <div className="zahialga-success__actions">
            <Link to={`/my-orders/${submittedOrder.id}`} className="btn-primary">
              Захиалгаа харах
            </Link>
            <button className="zahialga-success__secondary" onClick={reset}>
              Шинэ захиалга эхлэх
            </button>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="zahialga-page">
      {showAuthModal && (
        <AuthModal
          onSuccess={() => {
            setShowAuthModal(false)
            doSubmit()
          }}
          onClose={() => setShowAuthModal(false)}
        />
      )}

      {tryOnDesign && (
        <TryOnModal
          garment={tryOnDesign}
          onClose={() => setTryOnDesign(null)}
        />
      )}

      <section className="zahialga-topbar container">
        <div className="zahialga-topbar__titleWrap">
          <span className="section-eyebrow zahialga-topbar__eyebrow">Denz order</span>
          <h1 className="zahialga-topbar__title">Захиалга</h1>
        </div>

        <div className="zahialga-topbar__meta">
          <span className="zahialga-topbar__meta-label">Алхам {step + 1} / {STEPS.length}</span>
          <strong className="zahialga-topbar__meta-value">{currentStep.label}</strong>
        </div>
      </section>

      <div
        className="zahialga-steps container"
        style={{ '--progress-scale': step / (STEPS.length - 1) }}
      >
        <div className="zahialga-steps__rail" />
        <div className="zahialga-steps__progress" />

        {STEPS.map((item, index) => {
          const status = index < step ? 'done' : index === step ? 'active' : 'idle'

          return (
            <div key={item.label} className={`zahialga-steps__item zahialga-steps__item--${status}`}>
              <span className="zahialga-steps__badge">{index < step ? '✓' : `0${index + 1}`}</span>
              <div className="zahialga-steps__copy">
                <span className="zahialga-steps__label">{item.label}</span>
                <span className="zahialga-steps__note">{item.note}</span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="zahialga-content container section-shell">
        {apiError && <div className="zahialga-api-error">{apiError}</div>}

        {step === 0 && (
          <section className="zahialga-section">
            <div className="zahialga-section__header">
              <h2 className="zahialga-section__title">Загвараа сонгоно уу</h2>
              <p className="zahialga-section__hint">
                Оёдолчдын оруулсан загваруудаас сонгож, хүсвэл өмсөж үзэхээр шалгаж болно.
              </p>
            </div>

            {errors.design && <p className="zahialga-error">{errors.design}</p>}

            {loadingDesigns ? (
              <div className="zahialga-loading">Загваруудыг ачааллаж байна...</div>
            ) : designs.length === 0 ? (
              <div className="zahialga-empty">Одоогоор харагдах загвар алга байна.</div>
            ) : (
              <div className="design-grid">
                {designs.map((design) => (
                  <div
                    key={design.id}
                    role="button"
                    tabIndex={0}
                    className={`design-card${selectedDesign?.id === design.id ? ' design-card--selected' : ''}`}
                    onClick={() => { setSelectedDesign(design); setErrors({}) }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        setSelectedDesign(design)
                        setErrors({})
                      }
                    }}
                  >
                    <div className="design-card__img-wrap">
                      {design.image_url ? (
                        <img src={design.image_url} alt={design.name} className="design-card__img" />
                      ) : (
                        <div className="design-card__img design-card__img--placeholder">✦</div>
                      )}

                      {selectedDesign?.id === design.id && <div className="design-card__check">✓</div>}
                    </div>

                    <div className="design-card__body">
                      {design.category_name && (
                        <span className="design-card__category">
                          {design.category_name}
                          {design.audience ? ` · ${design.audience}` : ''}
                        </span>
                      )}
                      <h3 className="design-card__name">{design.name}</h3>
                      {design.ceremonial_use && <p className="design-card__desc">{design.ceremonial_use}</p>}
                      {design.tailor_name && <p className="design-card__tailor">Оёдолчин: {design.tailor_name}</p>}
                      <span className="design-card__price">{formatPrice(design.base_price)}-с эхлэн</span>

                      <button
                        type="button"
                        className="design-card__tryon"
                        onClick={(e) => {
                          e.stopPropagation()
                          setTryOnDesign(design)
                        }}
                      >
                        Өмсөж үзэх
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {step === 1 && (
          <section className="zahialga-section">
            <div className="zahialga-section__header">
              <h2 className="zahialga-section__title">Биеийн хэмжээсээ оруулна уу</h2>
              <p className="zahialga-section__hint">
                Зааврыг дагаж хэмжээс бүрийг сантиметрээр оруулна. Бүх утга захиалгын хамт хадгалагдана.
              </p>
            </div>

            <MeasurementGuide
              measurements={measurements}
              errors={errors}
              onChange={handleMeasurement}
            />
          </section>
        )}

        {step === 2 && (
          <section className="zahialga-section">
            <div className="zahialga-section__header">
              <h2 className="zahialga-section__title">Захиалгаа баталгаажуулна уу</h2>
              <p className="zahialga-section__hint">
                Илгээхээсээ өмнө загвар, хэмжээс, нэмэлт хүсэлтээ нэгтгэн шалгаарай.
              </p>
            </div>

            <div className="confirm-grid">
              <div className="confirm-card">
                <h3 className="confirm-card__title">Сонгосон загвар</h3>
                <div className="confirm-card__design">
                  {selectedDesign.image_url ? (
                    <img src={selectedDesign.image_url} alt={selectedDesign.name} className="confirm-card__img" />
                  ) : (
                    <div className="confirm-card__img confirm-card__img--placeholder">✦</div>
                  )}

                  <div>
                    <p className="confirm-card__design-name">{selectedDesign.name}</p>
                    {selectedDesign.category_name && <p className="confirm-card__design-cat">{selectedDesign.category_name}</p>}
                    {selectedDesign.tailor_name && <p className="confirm-card__design-tailor">Оёдолчин: {selectedDesign.tailor_name}</p>}
                    <p className="confirm-card__price">{formatPrice(selectedDesign.base_price)}</p>
                  </div>
                </div>
              </div>

              <div className="confirm-card">
                <h3 className="confirm-card__title">Хэмжээс</h3>
                <div className="confirm-measurements">
                  {Object.entries(measurements).map(([key, value]) => (
                    <div key={key} className="confirm-measurement-row">
                      <span className="confirm-measurement-key">{MEASURE_LABELS[key]}</span>
                      <span className="confirm-measurement-val">{value} см</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="confirm-note-input">
              <label className="confirm-note-input__label">Нэмэлт тайлбар, хүсэлт</label>
              <textarea
                className="confirm-note-input__textarea"
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                placeholder="Жишээ нь: Тод улаан өнгөтэй, арай бариу эсгүүртэй байх..."
                rows={4}
              />
            </div>

            <div className="confirm-note">
              {user ? (
                <p>Та захиалга илгээсний дараа оёдолчин захиалгын дэлгэрэнгүйг шалгаж, нарийвчилсан хугацаа болон үнээр холбогдоно.</p>
              ) : (
                <p>Захиалга илгээхийн тулд нэвтрэх шаардлагатай. Илгээх товч дарахад нэвтрэх цонх нээгдэнэ.</p>
              )}
            </div>
          </section>
        )}

        <div className="zahialga-nav">
          {step > 0 && (
            <button className="btn-secondary zahialga-nav__back" onClick={goBack}>
              Буцах
            </button>
          )}

          {step < 2 ? (
            <button className="btn-primary" onClick={goNext}>
              Үргэлжлүүлэх
            </button>
          ) : (
            <button className="btn-primary" onClick={handleSubmit} disabled={submitLoading}>
              {submitLoading ? 'Илгээж байна...' : 'Захиалга илгээх'}
            </button>
          )}
        </div>
      </div>
    </main>
  )
}
