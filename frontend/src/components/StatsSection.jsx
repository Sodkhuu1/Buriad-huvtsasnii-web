import './StatsSection.css'

const stats = [
  { value: '200+', label: 'загварын суурь сан' },
  { value: '1500+', label: 'захиалгын боломжит урсгал' },
  { value: '50+', label: 'жилийн өв, хэв маягийн агуулга' },
  { value: '98%', label: 'илүү ойлгомжтой хэрэглэгчийн туршлага' },
]

export default function StatsSection() {
  return (
    <section className="stats">
      <div className="container">
        <div className="stats__panel">
          <div className="stats__lead">
            <span className="section-eyebrow stats__eyebrow">System Value</span>
            <h2 className="stats__title">Дэнзийн шинэ төрх нь тоо баримт, итгэл, соёлын үнэ цэнийг зэрэг мэдрүүлнэ.</h2>
            <p className="stats__text">
              Платформын гол давуу талыг товч, нүдэнд шууд буух байдлаар байршуулснаар брэнд илүү мэргэжлийн,
              харин үйлчилгээ нь илүү найдвартай харагдана.
            </p>
          </div>

          <div className="stats__grid">
            {stats.map((item) => (
              <article className="stats__item" key={item.label}>
                <span className="stats__value">{item.value}</span>
                <span className="stats__label">{item.label}</span>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
