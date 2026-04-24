import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import TryOnModal from './TryOnModal'
import './GalleryPreview.css'

export default function GalleryPreview() {
  const [garments, setGarments] = useState([])
  const [loading, setLoading]   = useState(true)
  const [tryOnGarment, setTryOnGarment] = useState(null)

  useEffect(() => {
    // 4 shirheg l haruulna, buur ni Zahialga dr l haragdaarai
    api.get('/garments')
      .then(data => setGarments((data.garments || []).slice(0, 4)))
      .catch(() => setGarments([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <section className="gallery">
      <div className="gallery__bg" />
      <div className="container">
        <h2 className="section-title" style={{ color: 'var(--cream)' }}>
          Хувцасны цомог
        </h2>
        <span className="gold-line" />
        <p className="section-subtitle" style={{ color: 'rgba(245,239,224,0.65)' }}>
          Буриад хувцасны уламжлалт загваруудтай танилцаарай.
        </p>

        {loading ? (
          <div className="gallery__loading">Ачааллаж байна...</div>
        ) : garments.length === 0 ? (
          <div className="gallery__loading">Одоогоор загвар байхгүй байна.</div>
        ) : (
          <div className="gallery__grid">
            {garments.map((g) => (
              <div className="gallery__item" key={g.id}>
                {g.image_url ? (
                  <img src={g.image_url} alt={g.name} className="gallery__img" />
                ) : (
                  <div className="gallery__img gallery__img--placeholder">✂</div>
                )}
                <div className="gallery__overlay">
                  {g.category_name && (
                    <span className="gallery__category">{g.category_name}</span>
                  )}
                  <h3 className="gallery__name">{g.name}</h3>
                  <button
                    type="button"
                    className="gallery__tryon"
                    onClick={() => setTryOnGarment(g)}
                  >
                    Өмсөөд үзэх →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="gallery__more">
          <Link to="/zahialga" className="btn-secondary">
            Бүгдийг үзэх →
          </Link>
        </div>
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
