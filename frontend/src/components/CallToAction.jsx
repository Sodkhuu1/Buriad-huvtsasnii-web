import { Link } from 'react-router-dom'
import './CallToAction.css'

export default function CallToAction() {
  return (
    <section className="cta">
      <div className="cta__bg" />
      <div className="container">
        <div className="cta__inner">
          <span className="section-eyebrow cta__eyebrow">Start with Denz</span>
          <h2 className="cta__title">Дэнзтэй хамт уламжлалт хувцасны туршлагаа өнөөдрөөс илүү дэгтэй болго.</h2>
          <p className="cta__desc">
            Хэмжээгээ оруулж захиалгаа эхлүүлэх, эсвэл эхлээд утга агуулгатай нь танилцах аль ч урсгал одоо илүү тодорхой,
            илүү брэндийн мэдрэмжтэй боллоо.
          </p>
          <div className="cta__buttons">
            <Link to="/zahialga" className="btn-primary">Захиалга эхлэх</Link>
            <Link to="/huvtsasnii-utga" className="btn-secondary cta__secondary">Утга, хэв маяг үзэх</Link>
          </div>
        </div>
      </div>
    </section>
  )
}
