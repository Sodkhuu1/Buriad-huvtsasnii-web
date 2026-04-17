import './TestimonialsSection.css'

const testimonials = [
  {
    name: 'Болормаа Д.',
    role: 'Хэрэглэгч',
    text: 'Тогтмол хэмжээс оруулан захиалсан хувцас маань биед яг таарч ирсэн. Чанар маш сайн, дархны ажил нарийн.',
    rating: 5,
  },
  {
    name: 'Эрдэнэбаяр Г.',
    role: 'Захиалагч',
    text: 'Веб сайтаар дамжуулан хэмжээс оруулах процесс хялбар байлаа. Захиалсан дэгэлийг хугацаанд нь хүргэж өгсөнд баярлалаа.',
    rating: 5,
  },
  {
    name: 'Номинчулуун Б.',
    role: 'Хэрэглэгч',
    text: 'Хувцасны утга учрын тайлбар маш дэлгэрэнгүй, ойлгомжтой. Буриад соёлоо гүнзгийрүүлж мэдэж авлаа.',
    rating: 5,
  },
]

export default function TestimonialsSection() {
  return (
    <section className="testimonials">
      <div className="container">
        <h2 className="section-title">Хэрэглэгчдийн сэтгэгдэл</h2>
        <span className="gold-line" />
        <p className="section-subtitle">
          Манай захиалагчид, судлаачдын туршлага.
        </p>

        <div className="testimonials__grid">
          {testimonials.map((t, i) => (
            <div className="testimonials__card" key={i}>
              <div className="testimonials__stars">
                {'★'.repeat(t.rating)}
              </div>
              <p className="testimonials__text">"{t.text}"</p>
              <div className="testimonials__author">
                <div className="testimonials__avatar">
                  {t.name[0]}
                </div>
                <div>
                  <div className="testimonials__name">{t.name}</div>
                  <div className="testimonials__role">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
