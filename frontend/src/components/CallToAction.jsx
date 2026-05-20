import { Link } from 'react-router-dom'
import './CallToAction.css'

export default function CallToAction() {
  return (
    <section className="cta">
      <div className="cta__bg" />
      <div className="container">
        <div className="cta__inner">
          <span className="section-eyebrow cta__eyebrow">Start with Denz</span>
          <h2 className="cta__title">Уламжлалыг Дэнзээс мэдэр.</h2>
          <p className="cta__desc">
            Заавал биеэр очих шаардлагагүйгээр зайнаас захиалга өгөх боломжтой боллоо.
          </p>
          <div className="cta__buttons">
            <Link to="/zahialga" className="btn-primary">Захиалга эхлэх</Link>
            <Link to="/huvtsasnii-utga" className="btn-secondary cta__secondary">Хувцасны утга учрыг мэдэх</Link>
          </div>
        </div>
      </div>
    </section>
  )
}
