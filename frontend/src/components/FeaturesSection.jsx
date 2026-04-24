import './FeaturesSection.css'

const features = [
  {
    id: '01',
    title: 'Брэндийн нэртэй, танигдахуйц төрх',
    desc: 'Дэнзийн өнгө, хэлбэр, copywriting-ийг нэг хэв маягт оруулж системийн бүх дэлгэц дээр танигдах мэдрэмж өгнө.',
  },
  {
    id: '02',
    title: 'Захиалгын урсгал илүү ойлгомжтой',
    desc: 'Алхам бүрийн зорилгыг тодруулж, хэрэглэгч хаана яваагаа алдахгүйгээр хэмжээс ба загвараа бүрдүүлнэ.',
  },
  {
    id: '03',
    title: 'Соёлын агуулга илүү ойр болно',
    desc: 'Зөвхөн хувцас үзүүлэхээс илүүтэй хээ, хэрэглээ, утга санааг уншихад таатай бүтэц бий болгоно.',
  },
  {
    id: '04',
    title: 'Оёдолчны ажил ч үнэ цэнтэй харагдана',
    desc: 'Гар урлалын чанар, захиалгын онцлог, хувийн тохируулгыг премиум мэдрэмжтэйгээр илэрхийлнэ.',
  },
]

export default function FeaturesSection() {
  return (
    <section className="features ornament-bg">
      <div className="container">
        <div className="features__intro">
          <span className="section-eyebrow">Яагаад Дэнз гэж?</span>
          <h2 className="section-title">Брэнд, захиалга, соёлын мэдээллийг нэг цэвэр урсгалд нэгтгэнэ.</h2>
          <span className="gold-line" />
          <p className="section-subtitle">
            Дэнз бол зүгээр нэг вэб хуудас биш. Энэ нь уламжлалт буриад хувцсыг захиалах, ойлгох,
            танилцуулах туршлагыг нэг нүүр царайтай болгох систем юм.
          </p>
        </div>

        <div className="features__grid">
          {features.map((feature) => (
            <article className="features__card" key={feature.id}>
              <span className="features__index">{feature.id}</span>
              <h3 className="features__title">{feature.title}</h3>
              <p className="features__desc">{feature.desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
