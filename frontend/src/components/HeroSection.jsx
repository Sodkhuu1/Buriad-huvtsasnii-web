import { Link } from 'react-router-dom'
import './HeroSection.css'

const signals = [
  'Хэмжээнд суурилсан захиалга',
  'Соёлын тайлбартай загварын сан',
  'Оёдолчин, захиалагчийг холбосон урсгал',
]

const journeys = [
  {
    label: '01',
    title: 'Захиалгаа бүрдүүл',
    text: 'Биеийн хэмжээгээ оруулаад өөрт тохирсон буриад хувцсыг итгэлтэйгээр захиална.',
    link: '/zahialga',
    cta: 'Захиалга эхлэх',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&auto=format&fit=crop&q=80',
    tone: 'order',
  },
  {
    label: '02',
    title: 'Утга, хэв маягийг тань',
    text: 'Хээ угалз, өнгө, хэрэглээний тайлбарыг уншиж хувцас бүрийн цаад утгыг ойлгоно.',
    link: '/huvtsasnii-utga',
    cta: 'Судалж үзэх',
    image: 'https://res.cloudinary.com/dizjdjrfh/image/upload/v1776685154/content_buriad_002_1_vf80r3.jpg',
    tone: 'learn',
  },
]

export default function HeroSection() {
  return (
    <section className="hero">
      <div className="hero__backdrop" />
      <div className="hero__texture" />

      <div className="container hero__layout">
        <div className="hero__content">
          <span className="hero__eyebrow">Дэнз • Буриад хувцасны захиалга</span>

          <h1 className="hero__title">
            Дэнз
            <span className="hero__title-accent"> Уламжлалыг илүү ойр мэдэр.</span>
          </h1>

          <p className="hero__desc">
            Энэхүү платформ нь хэрэглэгчдэд биеийн хэмжээнд тохируулан буриад хувцас захиалах, загварыг өөрийн зураг дээр туршиж харах, мөн хувцасны соёлын утга, бэлгэдлийг танин мэдэх боломжийг нэг дор бүрдүүлсэн.
          </p>

          <div className="hero__actions">
            <Link to="/zahialga" className="btn-primary">Захиалга өгөх</Link>
            <Link to="/bidnii-tuhaid" className="btn-secondary">Брэндийн тухай</Link>
          </div>

          <div className="hero__signals">
            {signals.map((signal) => (
              <div className="hero__signal" key={signal}>
                <span className="hero__signal-dot" />
                <span>{signal}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="hero__visual">
          <div className="hero__editorial section-shell">
            <span className="hero__editorial-label">Brand Note</span>
            <h2 className="hero__editorial-title">Соёлын нарийн утгыг дижитал орчинд илүү ойлгомжтой, илүү тансаг хүргэнэ.</h2>
            <p className="hero__editorial-text">
              Дэнзийн зорилго бол захиалга өгөх процессыг сайхан харагдуулахаас илүүтэй соёлын үнэ цэнийг
              эмх цэгцтэйгээр мэдрүүлэх юм.
            </p>
            <div className="hero__editorial-metrics">
              <div>
                <strong>3 алхам</strong>
                <span>захиалгын урсгал</span>
              </div>
              <div>
                <strong>1 систем</strong>
                <span>брэнд, тайлбар, захиалга</span>
              </div>
            </div>
          </div>

          <div className="hero__cards">
            {journeys.map((item) => (
              <Link key={item.title} to={item.link} className={`hero__card hero__card--${item.tone}`}>
                <div className="hero__card-imageWrap">
                  <img src={item.image} alt={item.title} className="hero__card-image" />
                </div>
                <div className="hero__card-overlay" />
                <div className="hero__card-body">
                  <span className="hero__card-label">{item.label}</span>
                  <h3 className="hero__card-title">{item.title}</h3>
                  <p className="hero__card-text">{item.text}</p>
                  <span className="hero__card-link">
                    {item.cta}
                    <span>→</span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
