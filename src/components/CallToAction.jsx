import { Link } from 'react-router-dom'
import './CallToAction.css'

export default function CallToAction() {
  return (
    <section className="cta">
      <div className="cta__bg" />
      <div className="container">
        <div className="cta__inner">
          <div className="cta__decoration">᠁</div>
          <h2 className="cta__title">
            Өөрийн хувцасаа
            <br />
            <span className="cta__title-accent">өнөөдөр захиалаарай</span>
          </h2>
          <p className="cta__desc">
            Биеийн хэмжээсээ оруулан, загвараа сонгон, гар оёдлоор хийгдсэн
            жинхэнэ буриад хувцастай болоорой.
          </p>
          <div className="cta__buttons">
            <Link to="/zahialga" className="btn-primary">
              Захиалга эхлэх →
            </Link>
            <Link to="/huvtsasnii-utga" className="btn-secondary">
              Хувцасны утга судлах
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
