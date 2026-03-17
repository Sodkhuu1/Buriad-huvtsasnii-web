import { Link } from 'react-router-dom'
import './Footer.css'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__top">

          {/* Brand */}
          <div className="footer__brand">
            <div className="footer__logo">
              <span className="footer__logo-icon">᠁</span>
              <span className="footer__logo-text">
                <span>БУРИАД</span>
                <span className="footer__logo-sub">ХУВЦАС</span>
              </span>
            </div>
            <p className="footer__brand-desc">
              Буриад уламжлалт хувцасны захиалга, утга судлалын онлайн платформ.
              Гар оёдлоор хийгдсэн жинхэнэ буриад хувцас захиалаарай.
            </p>
          </div>

          {/* Nav links */}
          <div className="footer__col">
            <h4 className="footer__col-title">Холбоосууд</h4>
            <ul className="footer__links">
              <li><Link to="/">Нүүр хуудас</Link></li>
              <li><Link to="/zahialga">Захиалга өгөх</Link></li>
              <li><Link to="/huvtsasnii-utga">Хувцасны утга</Link></li>
              <li><Link to="/bidnii-tuhaid">Бидний тухай</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="footer__col">
            <h4 className="footer__col-title">Холбоо барих</h4>
            <ul className="footer__links footer__links--contact">
              <li>📍 Улаанбаатар, Монгол</li>
              <li>📞 +976 9900 0000</li>
              <li>✉️ info@buriad-huvtsas.mn</li>
              <li>🕐 Даваа–Баасан: 09:00–18:00</li>
            </ul>
          </div>
        </div>

        <div className="footer__bottom">
          <p>© 2026 Буриад Хувцас. Бүх эрх хуулиар хамгаалагдсан.</p>
          <p>Дипломын ажлаар хөгжүүлсэн вэб систем</p>
        </div>
      </div>
    </footer>
  )
}
