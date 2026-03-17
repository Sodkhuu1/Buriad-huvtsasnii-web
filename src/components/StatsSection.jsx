import './StatsSection.css'

const stats = [
  { value: '200+',  label: 'Захиалгын загвар' },
  { value: '1500+', label: 'Амжилттай захиалга' },
  { value: '50+',   label: 'Жилийн уламжлал' },
  { value: '98%',   label: 'Хэрэглэгчийн сэтгэл ханамж' },
]

export default function StatsSection() {
  return (
    <section className="stats">
      <div className="stats__inner ornament-bg">
        <div className="container">
          <div className="stats__grid">
            {stats.map((s, i) => (
              <div className="stats__item" key={i}>
                <span className="stats__value">{s.value}</span>
                <span className="stats__label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
