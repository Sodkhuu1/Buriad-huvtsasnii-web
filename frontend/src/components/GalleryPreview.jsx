import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import TryOnModal from './TryOnModal'
import './GalleryPreview.css'

export default function GalleryPreview() {
  const [garments, setGarments] = useState([])
  const [loading, setLoading] = useState(true)
  const [tryOnGarment, setTryOnGarment] = useState(null)

  useEffect(() => {
    api.get('/garments')
      .then(data => setGarments((data.garments || []).slice(0, 4)))
      .catch(() => setGarments([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <section className="gallery">
      <div className="gallery__bg" />
      <div className="container">
        <div className="gallery__intro">
          <div className="gallery__intro-copy">
            <span className="section-eyebrow gallery__eyebrow">Lookbook</span>
            <h2 className="section-title gallery__title">Дэнз дээрх загварын сонголтууд илүү редакцлаг, илүү итгэлтэй харагдана.</h2>
            <span className="gold-line gallery__line" />
            <p className="section-subtitle gallery__subtitle">
              Оёдолчдын оруулсан загвар бүрийг нэгэн жигд танилцуулж, хэрэглэгчдэд сонголт хийхэд хялбар,
              сонирхолтой харагдахаар зохион байгууллаа.
            </p>
          </div>

          <div className="gallery__aside section-shell">
            <p className="gallery__aside-label">Selected pieces</p>
            <p className="gallery__aside-text">
              Загвар харах, өмсөж үзэх, дараа нь шууд захиалгын урсгал руу шилжих холбоос одоо илүү тод болсон.
            </p>
            <Link to="/zahialga" className="btn-secondary gallery__aside-link">
              Бүх загвар руу орох
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="gallery__loading">Загваруудыг уншиж байна...</div>
        ) : garments.length === 0 ? (
          <div className="gallery__loading">Одоогоор харагдах загвар алга байна.</div>
        ) : (
          <div className="gallery__grid">
            {garments.map((garment) => (
              <article className="gallery__item" key={garment.id}>
                {garment.image_url ? (
                  <img src={garment.image_url} alt={garment.name} className="gallery__img" />
                ) : (
                  <div className="gallery__img gallery__img--placeholder">✦</div>
                )}

                <div className="gallery__overlay">
                  {garment.category_name && (
                    <span className="gallery__category">{garment.category_name}</span>
                  )}
                  <h3 className="gallery__name">{garment.name}</h3>
                  <div className="gallery__actions">
                    <button
                      type="button"
                      className="gallery__tryon"
                      onClick={() => setTryOnGarment(garment)}
                    >
                      Өмсөж үзэх
                    </button>
                    <Link to="/zahialga" className="gallery__link">
                      Захиалга →
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {tryOnGarment && (
        <TryOnModal
          garment={tryOnGarment}
          onClose={() => setTryOnGarment(null)}
        />
      )}
    </section>
  )
}
