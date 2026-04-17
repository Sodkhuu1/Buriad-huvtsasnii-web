import { Link } from 'react-router-dom'
import './GalleryPreview.css'

const items = [
  {
    img: 'https://images.unsplash.com/photo-1594038984077-b46b5f9ac9bc?w=600&auto=format&fit=crop&q=80',
    title: 'Буриад дэгэл',
    category: 'Эрэгтэй хувцас',
  },
  {
    img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&auto=format&fit=crop&q=80',
    title: 'Торгон дэл',
    category: 'Эмэгтэй хувцас',
  },
  {
    img: 'https://images.unsplash.com/photo-1592198084033-aade902d1aae?w=600&auto=format&fit=crop&q=80',
    title: 'Тэргүүний малгай',
    category: 'Малгай',
  },
  {
    img: 'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=600&auto=format&fit=crop&q=80',
    title: 'Буриад гутал',
    category: 'Гутал',
  },
]

export default function GalleryPreview() {
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

        <div className="gallery__grid">
          {items.map((item, i) => (
            <Link to="/huvtsasnii-utga" className="gallery__item" key={i}>
              <img src={item.img} alt={item.title} className="gallery__img" />
              <div className="gallery__overlay">
                <span className="gallery__category">{item.category}</span>
                <h3 className="gallery__name">{item.title}</h3>
                <span className="gallery__link">Дэлгэрэнгүй →</span>
              </div>
            </Link>
          ))}
        </div>

        <div className="gallery__more">
          <Link to="/huvtsasnii-utga" className="btn-secondary">
            Бүгдийг үзэх →
          </Link>
        </div>
      </div>
    </section>
  )
}
