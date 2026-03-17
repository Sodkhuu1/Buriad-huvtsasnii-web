import { Link } from 'react-router-dom'
import './HeroSection.css'

export default function HeroSection() {
  return (
    <section className="hero">
      {/* Decorative overlay pattern */}
      <div className="hero__pattern" />

      {/* Top banner */}
      <div className="hero__banner">
        <span className="hero__banner-line" />
        <span className="hero__banner-text">
          ᠪᠤᠷᠢᠶᠠᠳ · БУРИАД · BURYAD
        </span>
        <span className="hero__banner-line" />
      </div>

      {/* Headline */}
      <div className="hero__headline">
        <h1 className="hero__title">
          Буриад хувцасны
          <br />
          <span className="hero__title-accent">уламжлал ба захиалга</span>
        </h1>
        <p className="hero__desc">
          Биеийн хэмжээсээ оруулан уламжлалт буриад хувцас захиалах,
          <br className="hero__desc-br" />
          хувцасны гарал үүсэл, утга учрыг танин мэдэх боломжтой.
        </p>
      </div>

      {/* Two main cards */}
      <div className="hero__cards">

        {/* Card 1: Захиалга */}
        <Link to="/zahialga" className="hero__card hero__card--order">
          <div className="hero__card-img-wrap">
            <img
              src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&auto=format&fit=crop&q=80"
              alt="Буриад хувцас захиалга"
              className="hero__card-img"
            />
            <div className="hero__card-overlay" />
          </div>
          <div className="hero__card-body">
            <span className="hero__card-tag">01</span>
            <h2 className="hero__card-title">Захиалга өгөх</h2>
            <p className="hero__card-text">
              Биеийн хэмжээсээ оруулан гар аргаар оёсон уламжлалт
              буриад хувцас захиалаарай.
            </p>
            <div className="hero__card-cta">
              <span>Захиалга өгөх</span>
              <span className="hero__card-arrow">→</span>
            </div>
          </div>
        </Link>

        {/* Card 2: Хувцасны утга */}
        <Link to="/huvtsasnii-utga" className="hero__card hero__card--learn">
          <div className="hero__card-img-wrap">
            <img
              src="https://images.unsplash.com/photo-1594038984077-b46b5f9ac9bc?w=800&auto=format&fit=crop&q=80"
              alt="Буриад хувцасны утга"
              className="hero__card-img"
            />
            <div className="hero__card-overlay" />
          </div>
          <div className="hero__card-body">
            <span className="hero__card-tag">02</span>
            <h2 className="hero__card-title">Хувцасны утга судлах</h2>
            <p className="hero__card-text">
              Буриад хувцасны гарал үүсэл, тэмдэг тэмдэглэгээ,
              уламжлалт хээ угалзын утга учрыг нэгдэж судлаарай.
            </p>
            <div className="hero__card-cta">
              <span>Судлах</span>
              <span className="hero__card-arrow">→</span>
            </div>
          </div>
        </Link>
      </div>

      {/* Scroll hint */}
      <div className="hero__scroll">
        <span className="hero__scroll-label">Доош гүйлгэх</span>
        <span className="hero__scroll-icon">⌄</span>
      </div>
    </section>
  )
}
