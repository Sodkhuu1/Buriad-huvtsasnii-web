import { useState } from 'react'
import './Zahialga.css'

// ── Placeholder data (later replaced with API calls) ──────────────────────────

const DESIGNS = [
  {
    id: 1,
    name: 'Дэгэл',
    category: 'Эмэгтэй',
    price: 280000,
    img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&auto=format&fit=crop&q=80',
    desc: 'Уламжлалт буриад гадуур хувцас. Баяр ёслолын үеэр өмсдөг.',
  },
  {
    id: 2,
    name: 'Тэрлэг',
    category: 'Эрэгтэй',
    price: 220000,
    img: 'https://images.unsplash.com/photo-1594038984077-b46b5f9ac9bc?w=600&auto=format&fit=crop&q=80',
    desc: 'Буриад эрэгтэйчүүдийн өдөр тутмын болон ёслолын хувцас.',
  },
  {
    id: 3,
    name: 'Хантааз',
    category: 'Эмэгтэй',
    price: 180000,
    img: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop&q=80',
    desc: 'Уламжлалт хантааз — дэгэлийн дотор өмсдөг богино хувцас.',
  },
  {
    id: 4,
    name: 'Үсний чимэглэл',
    category: 'Хүүхэд',
    price: 95000,
    img: 'https://images.unsplash.com/photo-1503944583220-79d4dd0955e5?w=600&auto=format&fit=crop&q=80',
    desc: 'Хүүхдэд зориулсан буриад уламжлалт хувцас.',
  },
]

const TAILORS = [
  {
    id: 1,
    name: 'Цэцэгмаа Б.',
    location: 'Улаанбаатар, Сүхбаатар дүүрэг',
    rating: 4.9,
    orders: 128,
    days: '10–14 хоног',
    img: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
    specialization: 'Эмэгтэй хувцас, дэгэл',
  },
  {
    id: 2,
    name: 'Батбаяр Д.',
    location: 'Улаанбаатар, Баянгол дүүрэг',
    rating: 4.7,
    orders: 94,
    days: '7–10 хоног',
    img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    specialization: 'Эрэгтэй хувцас, тэрлэг',
  },
  {
    id: 3,
    name: 'Номинчимэг С.',
    location: 'Дархан-Уул аймаг',
    rating: 4.8,
    orders: 61,
    days: '14–21 хоног',
    img: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80',
    specialization: 'Хүүхэд болон эмэгтэй хувцас',
  },
]

const STEPS = ['Загвар', 'Хэмжээс', 'Оёдолчин', 'Батлах']

const EMPTY_MEASUREMENTS = {
  height: '', chest: '', waist: '', hip: '', sleeve: '', shoulder: '',
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function Zahialga() {
  const [step, setStep] = useState(0)
  const [selectedDesign, setSelectedDesign] = useState(null)
  const [measurements, setMeasurements] = useState(EMPTY_MEASUREMENTS)
  const [selectedTailor, setSelectedTailor] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [errors, setErrors] = useState({})

  // ── Step navigation ────────────────────────────────────────────────────────

  const goNext = () => {
    if (step === 0 && !selectedDesign) {
      setErrors({ design: 'Загвар сонгоно уу' })
      return
    }
    if (step === 1) {
      const errs = {}
      Object.entries(measurements).forEach(([key, val]) => {
        if (!val) errs[key] = 'Шаардлагатай'
      })
      if (Object.keys(errs).length) { setErrors(errs); return }
    }
    if (step === 2 && !selectedTailor) {
      setErrors({ tailor: 'Оёдолчин сонгоно уу' })
      return
    }
    setErrors({})
    setStep(s => s + 1)
  }

  const goBack = () => { setErrors({}); setStep(s => s - 1) }

  const handleSubmit = () => {
    // TODO: send to backend POST /api/orders
    setSubmitted(true)
  }

  const handleMeasurement = (e) => {
    setMeasurements(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setErrors(prev => ({ ...prev, [e.target.name]: undefined }))
  }

  // ── Submitted screen ───────────────────────────────────────────────────────

  if (submitted) {
    return (
      <main className="zahialga-page">
        <div className="zahialga-success">
          <div className="zahialga-success__icon">✓</div>
          <h2 className="zahialga-success__title">Захиалга амжилттай!</h2>
          <p className="zahialga-success__text">
            Таны захиалга <strong>{selectedTailor.name}</strong>-д илгээгдлээ.<br />
            Оёдолчин тантай удахгүй холбогдох болно.
          </p>
          <div className="zahialga-success__summary">
            <span>{selectedDesign.name}</span>
            <span>·</span>
            <span>{selectedTailor.days}</span>
            <span>·</span>
            <span>{selectedDesign.price.toLocaleString()}₮</span>
          </div>
          <button className="btn-primary" onClick={() => { setStep(0); setSelectedDesign(null); setMeasurements(EMPTY_MEASUREMENTS); setSelectedTailor(null); setSubmitted(false) }}>
            Шинэ захиалга
          </button>
        </div>
      </main>
    )
  }

  // ── Main page ──────────────────────────────────────────────────────────────

  return (
    <main className="zahialga-page">

      {/* Page header */}
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
            <div className="zahialga-steps__circle">
              {i < step ? '✓' : i + 1}
            </div>
            <span className="zahialga-steps__label">{label}</span>
            {i < STEPS.length - 1 && <div className="zahialga-steps__line" />}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="zahialga-content container">

        {/* ── STEP 0: Загвар сонгох ────────────────────────────────────────── */}
        {step === 0 && (
          <div className="zahialga-section">
            <h2 className="zahialga-section__title">Загвар сонгоно уу</h2>
            {errors.design && <p className="zahialga-error">{errors.design}</p>}
            <div className="design-grid">
              {DESIGNS.map(d => (
                <button
                  key={d.id}
                  className={`design-card${selectedDesign?.id === d.id ? ' design-card--selected' : ''}`}
                  onClick={() => { setSelectedDesign(d); setErrors({}) }}
                >
                  <div className="design-card__img-wrap">
                    <img src={d.img} alt={d.name} className="design-card__img" />
                    {selectedDesign?.id === d.id && (
                      <div className="design-card__check">✓</div>
                    )}
                  </div>
                  <div className="design-card__body">
                    <span className="design-card__category">{d.category}</span>
                    <h3 className="design-card__name">{d.name}</h3>
                    <p className="design-card__desc">{d.desc}</p>
                    <span className="design-card__price">{d.price.toLocaleString()}₮-с эхлэн</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP 1: Хэмжээс оруулах ─────────────────────────────────────── */}
        {step === 1 && (
          <div className="zahialga-section">
            <h2 className="zahialga-section__title">Биеийн хэмжээс оруулах</h2>
            <p className="zahialga-section__hint">
              Бүх хэмжээсийг сантиметрээр оруулна уу. Яаж хэмжихийг мэдэхгүй бол{' '}
              <a href="#" className="zahialga-link">заавар үзэх</a>.
            </p>

            <div className="measure-grid">
              {[
                { name: 'height',   label: 'Өндөр',       icon: '↕', hint: 'Толгойноос хөлийн ул хүртэл' },
                { name: 'chest',    label: 'Цээж',        icon: '○', hint: 'Цээжний хамгийн өргөн хэсэг' },
                { name: 'waist',    label: 'Бүсэлхий',   icon: '○', hint: 'Хамгийн нарийн хэсэг' },
                { name: 'hip',      label: 'Ташаа',       icon: '○', hint: 'Ташааны хамгийн өргөн хэсэг' },
                { name: 'sleeve',   label: 'Гарын урт',   icon: '↔', hint: 'Мөрнөөс бугуй хүртэл' },
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

        {/* ── STEP 2: Оёдолчин сонгох ─────────────────────────────────────── */}
        {step === 2 && (
          <div className="zahialga-section">
            <h2 className="zahialga-section__title">Оёдолчин сонгоно уу</h2>
            {errors.tailor && <p className="zahialga-error">{errors.tailor}</p>}
            <div className="tailor-list">
              {TAILORS.map(t => (
                <button
                  key={t.id}
                  className={`tailor-card${selectedTailor?.id === t.id ? ' tailor-card--selected' : ''}`}
                  onClick={() => { setSelectedTailor(t); setErrors({}) }}
                >
                  <img src={t.img} alt={t.name} className="tailor-card__avatar" />
                  <div className="tailor-card__info">
                    <h3 className="tailor-card__name">{t.name}</h3>
                    <p className="tailor-card__spec">{t.specialization}</p>
                    <p className="tailor-card__location">📍 {t.location}</p>
                  </div>
                  <div className="tailor-card__meta">
                    <div className="tailor-card__rating">★ {t.rating}</div>
                    <div className="tailor-card__orders">{t.orders} захиалга</div>
                    <div className="tailor-card__days">⏱ {t.days}</div>
                  </div>
                  {selectedTailor?.id === t.id && (
                    <div className="tailor-card__selected-badge">✓</div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP 3: Захиалга батлах ──────────────────────────────────────── */}
        {step === 3 && (
          <div className="zahialga-section">
            <h2 className="zahialga-section__title">Захиалгаа шалгаад батлаарай</h2>

            <div className="confirm-grid">

              {/* Design summary */}
              <div className="confirm-card">
                <h3 className="confirm-card__title">Сонгосон загвар</h3>
                <div className="confirm-card__design">
                  <img src={selectedDesign.img} alt={selectedDesign.name} className="confirm-card__img" />
                  <div>
                    <p className="confirm-card__design-name">{selectedDesign.name}</p>
                    <p className="confirm-card__design-cat">{selectedDesign.category}</p>
                    <p className="confirm-card__price">{selectedDesign.price.toLocaleString()}₮-с эхлэн</p>
                  </div>
                </div>
              </div>

              {/* Measurements summary */}
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

              {/* Tailor summary */}
              <div className="confirm-card">
                <h3 className="confirm-card__title">Оёдолчин</h3>
                <div className="confirm-tailor">
                  <img src={selectedTailor.img} alt={selectedTailor.name} className="confirm-tailor__avatar" />
                  <div>
                    <p className="confirm-tailor__name">{selectedTailor.name}</p>
                    <p className="confirm-tailor__location">{selectedTailor.location}</p>
                    <p className="confirm-tailor__days">Хугацаа: {selectedTailor.days}</p>
                  </div>
                </div>
              </div>

            </div>

            <div className="confirm-note">
              <p>Та захиалгаа баталсны дараа оёдолчин таны захиалгыг хянаж, үнэ болон нарийвчилсан мэдээллийг тантай тохирно.</p>
            </div>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="zahialga-nav">
          {step > 0 && (
            <button className="btn-secondary zahialga-nav__back" onClick={goBack}>
              ← Буцах
            </button>
          )}
          {step < 3 ? (
            <button className="btn-primary zahialga-nav__next" onClick={goNext}>
              Үргэлжлүүлэх →
            </button>
          ) : (
            <button className="btn-primary zahialga-nav__submit" onClick={handleSubmit}>
              Захиалга илгээх ✓
            </button>
          )}
        </div>

      </div>
    </main>
  )
}
