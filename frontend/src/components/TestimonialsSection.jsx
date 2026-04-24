import './TestimonialsSection.css'

const testimonials = [
  {
    name: 'Болормаа Д.',
    role: 'захиалагч',
    text: 'Хэмжээгээ оруулаад ямар алхам дарааллаар явах нь маш ойлгомжтой болчихсон байна. Илүү брэндлэг, илүү итгэлтэй мэдрэмж төрсөн.',
  },
  {
    name: 'Эрдэнэбаяр Г.',
    role: 'судлаач хэрэглэгч',
    text: 'Хувцасны утга, хэв маягийг тайлбарлаж байгаа хэсэг нь зүгээр нэг каталог биш, соёлын мэдээлэлтэй туршлага болсон нь таалагдсан.',
  },
  {
    name: 'Номинчулуун Б.',
    role: 'оёдлын үйлчилгээ сонирхогч',
    text: 'Дэнзийн шинэ харагдац нь гар урлалын үнэ цэнийг хямд биш, харин чанартай үйлчилгээ мэтээр илэрхийлж байна.',
  },
]

export default function TestimonialsSection() {
  return (
    <section className="testimonials">
      <div className="container">
        <div className="testimonials__intro">
          <span className="section-eyebrow">Feedback</span>
          <h2 className="section-title">Хэрэглэгчид, захиалагчид, соёл сонирхогчдод илүү дэгтэй сэтгэгдэл төрүүлэх UI.</h2>
          <span className="gold-line" />
          <p className="section-subtitle">
            Дэнзийн нүүр царайг сайжруулахдаа зөвхөн гоё харагдах бус, бүтээгдэхүүний үнэ цэнийг зөв мэдрүүлэхэд төвлөрлөө.
          </p>
        </div>

        <div className="testimonials__grid">
          {testimonials.map((item) => (
            <article className="testimonials__card" key={item.name}>
              <span className="testimonials__badge">Дэнзийн сэтгэгдэл</span>
              <p className="testimonials__text">“{item.text}”</p>
              <div className="testimonials__author">
                <div className="testimonials__avatar">{item.name[0]}</div>
                <div>
                  <div className="testimonials__name">{item.name}</div>
                  <div className="testimonials__role">{item.role}</div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
