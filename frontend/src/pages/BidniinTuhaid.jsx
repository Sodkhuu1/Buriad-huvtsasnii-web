import { Link } from 'react-router-dom'
import './BidniinTuhaid.css'

const VALUES = [
  {
    icon: '✦',
    title: 'Уламжлал',
    desc: 'Буриад хувцасны хээ угалз, бэлгэдлийг гажуудуулалгүй, жинхэнэ хэлбэрээр нь хадгалж оёно.',
  },
  {
    icon: '◈',
    title: 'Гар урлал',
    desc: 'Туршлагатай оёдолчид гар дээр нягт нямбай оёдог тул чанарт нь найдаж болно.',
  },
  {
    icon: '⬡',
    title: 'Хэмжээнд тохирсон',
    desc: 'Захиалагч бүрийн биеийн хэмжээгээр тусад нь огтолж оёдог, стандарт хэв байхгүй.',
  },
  {
    icon: '◎',
    title: 'Ил тод үйлчилгээ',
    desc: 'Захиалга авснаас хүлээлгэн өгөх хүртэл явц бүрийг мэдэгдэж, шууд харилцана.',
  },
]

// Денз-ийн санал болгодог үндсэн зүйлс
const SERVICES = [
  {
    num: '01',
    title: 'Буриад дээл',
    desc: 'Эрэгтэй, эмэгтэй буриад дээл, тэрлэг өдөр тутмын болон ёслолын зориулалтаар захиалгаар оёно.',
  },
  {
    num: '02',
    title: 'Малгай ба гутал',
    desc: 'Буриад уламжлалт малгай, гутал зэрэг иж бүрдлийг хувцастай зохицуулан хийнэ.',
  },
  {
    num: '03',
    title: 'Уужи ба хослол',
    desc: 'Эмэгтэй уужи, энгэрийн чимэглэл, бүсийг бэлгэдлийн дагуу нийлүүлж бэлдэнэ.',
  },
  {
    num: '04',
    title: 'Засвар, тохируулга',
    desc: 'Хуучин буриад хувцсыг сэлбэх, хэмжээнд нь тааруулж засах ажил гүйцэтгэнэ.',
  },
]

const TIMELINE = [
  { year: 'Эхэн үе', event: 'Гэр бүлийн уламжлалт оёдлоор буриад хувцас оёж эхэлсэн' },
  { year: 'Өсөлт', event: 'Захиалга нэмэгдэж, тогтмол үйлчлүүлэгчидтэй болсон' },
  { year: 'Өргөжилт', event: 'Дээлээс гадна малгай, гутал, иж бүрдэл нэмсэн' },
  { year: 'Өнөөдөр', event: 'Цахимаар захиалга авч, улс даяар хүргэдэг болсон' },
]

export default function BidniinTuhaid() {
  return (
    <main className="about-page">

      {/* Hero */}
      <section className="about-hero ornament-bg">
        <div className="container about-hero__inner">
          <span className="section-eyebrow">Дэнз · Бидний тухай</span>
          <h1 className="section-title about-hero__title">
            Буриад хувцасны<br />уламжлалт оёдол
          </h1>
          <span className="gold-line" />
          <p className="section-subtitle">
            Дэнз бол буриад үндэсний хувцасыг гар урлалаар оёдог оёдлын газар.
            Бид дээл, малгай, иж бүрдлийг захиалагч бүрийн хэмжээ, хүсэлд тааруулан,
            уламжлалт хээ бэлгэдлийг хадгалж бүтээдэг.
          </p>
        </div>
      </section>

      {/* Манай тухай */}
      <section className="about-story container">
        <div className="about-story__grid">
          <div className="about-story__text">
            <span className="section-eyebrow">Бидний тухай</span>
            <h2 className="about-story__title">Утга бүхий<br />ширхэг бүр гараар</h2>
            <p>
              Буриад дээл, уужи, малгайн ард зуун жилийн түүх, бэлгэдэл нуугдаж байдаг.
              Дэнз тэр уламжлалыг хүндэтгэн, орчин үеийн захиалагчид хүргэх зорилготой.
            </p>
            <p>
              Бид олон жилийн оёдлын туршлагадаа тулгуурлан буриад хувцасыг
              жинхэнэ хэлбэрээр нь хадгалж оёдог. Захиалагч бүрийн биеийн хэмжээ,
              сонгосон даавуу, хээ угалзыг нь сонсож, тусад нь бүтээдэг.
            </p>
            <Link to="/zahialga" className="btn-primary about-story__cta">
              Захиалга өгөх
            </Link>
          </div>

          <div className="about-story__timeline">
            <h3 className="about-story__tl-title">Бидний зам</h3>
            <div className="about-timeline">
              {TIMELINE.map((item, i) => (
                <div key={i} className="about-timeline__item">
                  <div className="about-timeline__dot" />
                  <div className="about-timeline__body">
                    <span className="about-timeline__year">{item.year}</span>
                    <span className="about-timeline__event">{item.event}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Үнэт зүйлс */}
      <section className="about-values-section">
        <div className="container">
          <div className="about-values-header">
            <span className="section-eyebrow">Зарчим</span>
            <h2 className="section-title">Бидний үнэт зүйлс</h2>
            <span className="gold-line" />
          </div>

          <div className="about-values-grid">
            {VALUES.map((v) => (
              <div key={v.title} className="about-value-card section-shell">
                <span className="about-value-card__icon">{v.icon}</span>
                <h3 className="about-value-card__title">{v.title}</h3>
                <p className="about-value-card__desc">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Үйлчилгээ */}
      <section className="about-tech container">
        <div className="about-tech__header">
          <span className="section-eyebrow">Үйлчилгээ</span>
          <h2 className="section-title">Бидний санал болгох</h2>
          <span className="gold-line" />
        </div>

        <div className="about-tech-grid">
          {SERVICES.map((s) => (
            <div key={s.num} className="about-tech-card">
              <div className="about-tech-card__num">{s.num}</div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Холбоо барих */}
      <section className="about-team-section container">
        <div className="about-team__header">
          <span className="section-eyebrow">Холбоо барих</span>
          <h2 className="section-title">Бидэнтэй холбогдох</h2>
          <span className="gold-line" />
          <p className="section-subtitle">
            Захиалга, үнийн санал болон бусад асуултаа доорх сувгуудаар бичээрэй.
            Facebook хуудсаар маань бүтээлүүдийн жишээ, шинэ загваруудыг үзэж болно.
          </p>
        </div>

        {/* TODO: жинхэнэ утас, хаяг, имэйлээ энд тавь */}
        <div className="about-team-grid">
          <div className="about-team-card section-shell">
            <div className="about-team-card__avatar">f</div>
            <h3 className="about-team-card__name">Facebook</h3>
            <span className="about-team-card__role">Буриад үндэсний хувцас</span>
            <p className="about-team-card__bio">
              <a
                href="https://www.facebook.com/buriadyndesnii.huvtsas"
                target="_blank"
                rel="noopener noreferrer"
              >
                facebook.com/buriadyndesnii.huvtsas
              </a>
            </p>
          </div>
          <div className="about-team-card section-shell">
            <div className="about-team-card__avatar">☎</div>
            <h3 className="about-team-card__name">Утас</h3>
            <span className="about-team-card__role">Захиалга, лавлагаа</span>
            <p className="about-team-card__bio">9X XX XX XX</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="about-cta container">
        <div className="about-cta__inner section-shell ornament-bg">
          <span className="section-eyebrow">Эхлэх цаг болсон</span>
          <h2 className="about-cta__title">Өөрийн буриад хувцсаа захиалаарай</h2>
          <span className="gold-line" />
          <p className="about-cta__sub">
            Биеийн хэмжээсээ оруулж, загвараа сонгоод хэдхэн минутад захиалгаа явуулна.
          </p>
          <div className="about-cta__actions">
            <Link to="/zahialga" className="btn-primary">Захиалга эхлэх</Link>
            <Link to="/huvtsasnii-utga" className="btn-secondary">Хувцасны утга</Link>
          </div>
        </div>
      </section>

    </main>
  )
}
