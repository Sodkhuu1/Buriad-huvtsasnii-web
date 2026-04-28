import { Link } from 'react-router-dom'
import './Footer.css'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__top">
          <div className="footer__brand">
            <div className="footer__logo">
              <span className="footer__logo-mark">Д</span>
              <div className="footer__logo-text">
                <span className="footer__logo-main">Дэнз</span>
                <span className="footer__logo-sub">буриад хувцасны захиалга</span>
              </div>
            </div>

            <p className="footer__brand-desc">
              Дэнз нь уламжлалт буриад хувцасны захиалга, танин мэдэхүй, брэндийн туршлагыг нэг дор төвлөрүүлсэн
              илүү орчин үеийн вэб систем юм.
            </p>

            <div className="footer__chips">
              <span>Хэмжээ</span>
              <span>Загвар</span>
              <span>Соёлын утга</span>
            </div>
          </div>

          <div className="footer__col">
            <h4 className="footer__col-title">Навигаци</h4>
            <ul className="footer__links">
              <li><Link to="/">Эхлэл</Link></li>
              <li><Link to="/zahialga">Захиалга өгөх</Link></li>
              <li><Link to="/huvtsasnii-utga">Утга, хэв маяг</Link></li>
              <li><Link to="/bidnii-tuhaid">Бидний тухай</Link></li>
            </ul>
          </div>

          <div className="footer__col">
            <h4 className="footer__col-title">Холбоо</h4>
            <ul className="footer__links footer__links--contact">
              <li>Улаанбаатар, Монгол</li>
              <li>+976 9900 0000</li>
              <li>info@denz.mn</li>
              <li>Даваа-Баасан 09:00-18:00</li>
            </ul>
          </div>

          <div className="footer__col footer__col--action">
            <h4 className="footer__col-title">Шууд эхлэх</h4>
            <p className="footer__action-text">Хэрэглэгчийг шууд захиалгын урсгал руу оруулах товч одоо footer дээр ч тод харагдана.</p>
            <Link to="/zahialga" className="btn-primary footer__cta">Захиалга эхлэх</Link>
          </div>
        </div>

        <div className="footer__bottom">
          <p>© 2026 Дэнз. Бүх эрх хуулиар хамгаалагдсан.</p>
          <p>Дипломын ажлын хүрээнд хөгжүүлсэн брэндийн систем</p>
        </div>
      </div>
    </footer>
  )
}
