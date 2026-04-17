import './FeaturesSection.css'

const features = [
  {
    icon: '📐',
    title: 'Хэмжээс оруулах',
    desc: 'Биеийн хэмжээсийг онлайнаар оруулан хувийн тохиргоотой хувцас захиалах боломжтой.',
  },
  {
    icon: '🧵',
    title: 'Гар оёдол',
    desc: 'Туршлагатай дархнуудын гар оёдлоор уламжлалт аргаар хийгдсэн жинхэнэ буриад хувцас.',
  },
  {
    icon: '🔴',
    title: 'Уламжлалт материал',
    desc: 'Дэл, торго, бөс зэрэг уламжлалт материалыг ашиглан эртний хэв маягийг хадгална.',
  },
  {
    icon: '📖',
    title: 'Утга судлал',
    desc: 'Буриад хувцас дахь хээ угалз, өнгө, хэлбэр бүрийн гүн утгыг тайлбарлан өгнө.',
  },
  {
    icon: '🚚',
    title: 'Хүргэлтийн үйлчилгээ',
    desc: 'Монгол улсын нутаг дэвсгэрт хурдан найдвартай хүргэлтийн үйлчилгээ үзүүлнэ.',
  },
  {
    icon: '💬',
    title: 'Зөвлөх үйлчилгээ',
    desc: 'Хувцасны дизайн, материал, хэмжээний талаар мэргэжилтний зөвлөгөө авах боломж.',
  },
]

export default function FeaturesSection() {
  return (
    <section className="features ornament-bg">
      <div className="container">
        <h2 className="section-title">Манай үйлчилгээ</h2>
        <span className="gold-line" />
        <p className="section-subtitle">
          Уламжлалт буриад хувцасны захиалга, судалгаа хоёрыг нэг дор
          хялбархан хийх боломжийг танд олгоно.
        </p>

        <div className="features__grid">
          {features.map((f, i) => (
            <div className="features__card" key={i}>
              <div className="features__icon">{f.icon}</div>
              <h3 className="features__title">{f.title}</h3>
              <p className="features__desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
