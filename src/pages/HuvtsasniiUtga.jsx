import { useState } from 'react'
import './HuvtsasniiUtga.css'

const PARTS = [
  {
    id: 'malgai',
    label: 'Малгай',
    meaning: 'Тэнгэртэй холбох гүүр',
    description:
      'Буриад малгайн оройд "улаан дэлбэ" буюу улаан торгон товч байдаг нь нарыг, амьдралын эрч хүчийг бэлэгддэг. Малгайн дугуй хэлбэр нь тэнгэрийн хонхорыг дуурайдаг бөгөөд өвөг дээдсийн сүнстэй холбоо тогтоох утга агуулдаг. Малгайны тоорцог хэсгийн чимэглэл нь эзнийхээ овог аймгийг ялган таних тэмдэг болдог байв.',
  },
  {
    id: 'zakh',
    label: 'Зах',
    meaning: 'Нэр хүнд ба нийгмийн зэрэг',
    description:
      'Дэгэлийн зах нь хүний нэр хүнд, нийгмийн байр суурийг илэрхийлдэг чухал элемент. Захын чимэглэлийн нарийн байдал, ашигласан материалын чанар нь эзнийхээ гэр бүлийн чинээлэг байдлыг харуулдаг. Торгон зах — тод улаан өнгөтэй байвал хатан хааны зэрэглэлийг илтгэнэ. Өдөр тутмын дэгэлийн зах хөвөн эдээр, баярын дэгэл торгоор хийгддэг.',
  },
  {
    id: 'energer',
    label: 'Энгэр',
    meaning: 'Зүрх сэтгэлийн хаалга',
    description:
      'Энгэр нь дэгэлийн урд талын гол чимэглэлтэй хэсэг. Эрэгтэйчүүдийн дэгэлд баруун гар тал дээр, эмэгтэйчүүдийнхэд зүүн тал дээр давхцуулан оёдог. Энгэрийн хэмжилгэ, зэс товчлуур, алтан утасны хатгамал нь оёдолчны гоёл чимэглэлийн ур дүйн гол илэрхийлэл болдог. Зарим нутгийн энгэрт "тавдаг" буюу хамгаалалтын тэмдэг оёдог.',
  },
  {
    id: 'deel',
    label: 'Дэгэл',
    meaning: 'Буриад соёлын баримт бичиг',
    description:
      'Дэгэл нь Буриад хувцасны үндсэн хэсэг бөгөөд хонины ноосоор дотор дэвсэж, гадна талыг торго эсвэл өтгөн даавуугаар бүрнэ. Дэгэлийн урт нь эзний насыг илэрхийлдэг — залуу хүний дэгэл богинохон, ахмад настны дэгэл бүтэн уртдаа байдаг. Дэгэлийн өнгө нь овог, аймаг, улирлыг заана: улаан — баярын, хөх — өдөр тутмын, цагаан — ёслолын.',
  },
  {
    id: 'bus',
    label: 'Бүс',
    meaning: 'Эрч хүч ба эрхэм байдал',
    description:
      'Бүс нь зөвхөн хувцас барих зориулалттай бус, эзнийхээ нийгмийн байр сууринг илэрхийлдэг. Эрэгтэйчүүдийн бүс нь торгон, гялалзсан өнгөтэй байдаг бол ахмад настнуудынх ноосон, тайван өнгөтэй. Бүс бол эрэгтэй хүний эрч хүч, дайчин зориг, ар гэрийн тулгыг бэлэгддэг. Бүс ороогүй хүн "дутуу" хэмээн тооцогддог байв.',
  },
  {
    id: 'khantsui',
    label: 'Ханцуй',
    meaning: 'Мориной туурайн дурсамж',
    description:
      'Ханцуйны үзүүр нь "туурай ханцуй" хэмээх морины туурайн хэлбэртэй байдаг нь мал сүрэг, мориг хүндэтгэх гүн утга агуулдаг. Ханцуйны үзүүрийн чимэглэл — гурвалжин хатгамал, алт, мөнгөн цув — нь оёдолчны ур чадварыг харуулах гол хэсэг болдог. Урт ханцуй нь хүйтэн, чийгтэй уур амьсгалд гарыг хамгаалж, ажил хийхдээ хойш нугалдаг.',
  },
  {
    id: 'gutal',
    label: 'Гутал',
    meaning: 'Газар дэлхийтэй нийлэх',
    description:
      'Буриад гутал нь дээш эргэж харсан хошуутай онцлогтой. Гутлын хошуу дээш эргэсэн байдаг нь газар дэлхийг гишгэхгүй, газар эхийг хайрлах ёс заншлыг агуулдаг гэж уламжлалт үзэлд тайлбарладаг. Гуталны ул хатуу арьсаар хийгдэж, морь унаж, нуга тал алхах боломжийг хангадаг. Торгон чимэглэл нь баярын гуталд байдаг.',
  },
]

const PART_MAP = Object.fromEntries(PARTS.map(p => [p.id, p]))

function FigureSVG({ hovered, onHover, onLeave }) {
  const h = (id) => ({
    onMouseEnter: () => onHover(id),
    onMouseLeave: onLeave,
    className: `part-group${hovered === id ? ' part-group--active' : ''}`,
  })

  return (
    <svg
      viewBox="0 0 300 556"
      xmlns="http://www.w3.org/2000/svg"
      className="figure-svg"
      aria-label="Буриад хувцасны интерактив зураг"
    >
      {/* ── Boots (Гутал) ──────────────────────────────── */}
      <g {...h('gutal')}>
        {/* Left boot body */}
        <path d="M 90,468 L 126,468 L 128,530 L 88,530 Z" fill="#2d1a0e" />
        {/* Left boot upturned toe */}
        <path d="M 88,524 Q 76,520 74,512 Q 80,506 90,510 L 90,524 Z" fill="#2d1a0e" />
        {/* Left boot shine */}
        <path d="M 94,472 L 122,472 L 122,478 L 94,478 Z" fill="#3d2a1a" />
        {/* Left boot red trim */}
        <path d="M 90,468 L 126,468 L 126,476 L 90,476 Z" fill="#8B1A2A" />
        {/* Right boot body */}
        <path d="M 174,468 L 210,468 L 212,530 L 172,530 Z" fill="#2d1a0e" />
        {/* Right boot upturned toe */}
        <path d="M 212,524 Q 224,520 226,512 Q 220,506 210,510 L 210,524 Z" fill="#2d1a0e" />
        {/* Right boot shine */}
        <path d="M 178,472 L 206,472 L 206,478 L 178,478 Z" fill="#3d2a1a" />
        {/* Right boot red trim */}
        <path d="M 174,468 L 210,468 L 210,476 L 174,476 Z" fill="#8B1A2A" />
      </g>

      {/* ── Main Deel body (Дэгэл) ─────────────────────── */}
      <g {...h('deel')}>
        <path d="M 88,138 L 212,138 L 232,468 L 68,468 Z" fill="#1B2D42" />
        {/* Hem red trim */}
        <path d="M 70,450 L 230,450 L 232,468 L 68,468 Z" fill="#8B1A2A" />
        {/* Hem gold line */}
        <path d="M 70,450 L 230,450 L 229,454 L 71,454 Z" fill="#C9A227" />
        {/* Left hem gold line */}
        <path d="M 70,454 L 230,454 L 229,458 L 71,458 Z" fill="#8B1A2A" />
      </g>

      {/* ── Sleeves (Ханцуй) ───────────────────────────── */}
      <g {...h('khantsui')}>
        {/* Left sleeve */}
        <path d="M 90,142 L 52,148 L 20,290 L 48,298 L 84,168 Z" fill="#1B2D42" />
        {/* Left hoof cuff */}
        <path d="M 20,284 Q 12,290 14,302 Q 26,308 44,300 L 48,298 L 20,290 Z" fill="#1B2D42" />
        {/* Left cuff trim */}
        <path d="M 20,284 L 48,292 L 46,298 L 18,290 Z" fill="#8B1A2A" />
        <path d="M 18,290 L 46,298 L 44,302 L 16,296 Z" fill="#C9A227" />
        {/* Right sleeve */}
        <path d="M 210,142 L 248,148 L 280,290 L 252,298 L 216,168 Z" fill="#1B2D42" />
        {/* Right hoof cuff */}
        <path d="M 280,284 Q 288,290 286,302 Q 274,308 256,300 L 252,298 L 280,290 Z" fill="#1B2D42" />
        {/* Right cuff trim */}
        <path d="M 280,284 L 252,292 L 254,298 L 282,290 Z" fill="#8B1A2A" />
        <path d="M 282,290 L 254,298 L 256,302 L 284,296 Z" fill="#C9A227" />
      </g>

      {/* ── Belt (Бүс) ─────────────────────────────────── */}
      <g {...h('bus')}>
        <path d="M 91,284 L 209,284 L 211,308 L 89,308 Z" fill="#8B4513" />
        {/* Belt gold border top */}
        <path d="M 91,284 L 209,284 L 209,290 L 91,290 Z" fill="#C9A227" />
        {/* Belt gold border bottom */}
        <path d="M 89,302 L 211,302 L 211,308 L 89,308 Z" fill="#C9A227" />
        {/* Belt buckle */}
        <rect x="135" y="289" width="30" height="14" rx="3" fill="#C9A227" />
        <rect x="139" y="293" width="22" height="6" rx="2" fill="#8B4513" />
        <circle cx="150" cy="296" r="3" fill="#C9A227" />
      </g>

      {/* ── Energer / Chest panel (Энгэр) ─────────────── */}
      <g {...h('energer')}>
        <path d="M 138,142 L 176,152 L 182,286 L 134,282 Z" fill="#C9A227" />
        {/* Decorative stripe lines */}
        <line x1="139" y1="164" x2="176" y2="170" stroke="#8B1A2A" strokeWidth="3" />
        <line x1="140" y1="182" x2="177" y2="188" stroke="#8B1A2A" strokeWidth="3" />
        <line x1="141" y1="200" x2="178" y2="206" stroke="#8B1A2A" strokeWidth="3" />
        <line x1="142" y1="218" x2="179" y2="224" stroke="#8B1A2A" strokeWidth="3" />
        <line x1="143" y1="236" x2="179" y2="241" stroke="#8B1A2A" strokeWidth="3" />
        <line x1="143" y1="255" x2="179" y2="260" stroke="#8B1A2A" strokeWidth="3" />
        {/* Gold trim on energer edge */}
        <path d="M 138,142 L 142,142 L 148,290 L 134,282 Z" fill="#8B1A2A" opacity="0.6" />
      </g>

      {/* ── Collar (Зах) ───────────────────────────────── */}
      <g {...h('zakh')}>
        {/* Left collar side */}
        <path d="M 120,114 Q 148,106 150,108 L 148,138 Q 130,132 116,136 Z" fill="#8B1A2A" />
        {/* Right collar side */}
        <path d="M 180,114 Q 152,106 150,108 L 152,138 Q 170,132 184,136 Z" fill="#8B1A2A" />
        {/* Gold collar trim */}
        <path d="M 120,114 Q 148,106 180,114 L 178,120 Q 150,112 122,120 Z" fill="#C9A227" />
        <path d="M 116,136 Q 148,126 184,136 L 182,142 Q 150,132 118,142 Z" fill="#C9A227" />
      </g>

      {/* ── Head (not interactive) ─────────────────────── */}
      <g id="head">
        {/* Neck */}
        <rect x="138" y="106" width="24" height="20" rx="4" fill="#D4A574" />
        {/* Head */}
        <circle cx="150" cy="82" r="30" fill="#D4A574" />
        {/* Eyes */}
        <ellipse cx="140" cy="80" rx="4" ry="4.5" fill="#2d1a0e" />
        <ellipse cx="160" cy="80" rx="4" ry="4.5" fill="#2d1a0e" />
        <circle cx="141" cy="79" r="1.5" fill="white" />
        <circle cx="161" cy="79" r="1.5" fill="white" />
        {/* Eyebrows */}
        <path d="M 135,73 Q 140,70 145,73" stroke="#2d1a0e" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <path d="M 155,73 Q 160,70 165,73" stroke="#2d1a0e" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        {/* Nose */}
        <path d="M 148,85 Q 150,90 152,85" stroke="#b88a60" strokeWidth="1.2" fill="none" />
        {/* Mouth */}
        <path d="M 143,96 Q 150,101 157,96" stroke="#b07050" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      </g>

      {/* ── Hat (Малгай) ───────────────────────────────── */}
      <g {...h('malgai')}>
        {/* Hat dome - main body (dark blue) */}
        <path d="M 112,67 Q 112,32 150,16 Q 188,32 188,67 Z" fill="#1B2D42" />
        {/* Hat dome - upper section (deep red) */}
        <path d="M 122,62 Q 122,36 150,22 Q 178,36 178,62 Z" fill="#8B1A2A" />
        {/* Hat decorative band (gold) */}
        <path d="M 112,67 Q 150,75 188,67 L 186,62 Q 150,70 114,62 Z" fill="#C9A227" />
        {/* Hat brim */}
        <path d="M 98,70 Q 150,82 202,70 L 196,64 Q 150,74 104,64 Z" fill="#0D1B2A" />
        {/* Hat brim gold line */}
        <path d="M 98,70 Q 150,76 202,70 L 202,72 Q 150,78 98,72 Z" fill="#C9A227" />
        {/* Top knob gold ball */}
        <circle cx="150" cy="18" r="9" fill="#C9A227" />
        <circle cx="150" cy="18" r="6" fill="#E3B84A" />
        <circle cx="148" cy="16" r="2" fill="white" opacity="0.5" />
        {/* Second decorative ring */}
        <ellipse cx="150" cy="44" rx="16" ry="4" fill="#C9A227" opacity="0.5" />
      </g>
    </svg>
  )
}

export default function HuvtsasniiUtga() {
  const [hovered, setHovered] = useState(null)
  const activePart = hovered ? PART_MAP[hovered] : null

  return (
    <main className="huvtsas-page">

      {/* Header */}
      <div className="huvtsas-header ornament-bg">
        <h1 className="section-title">Хувцасны утга судлал</h1>
        <span className="gold-line" />
        <p className="section-subtitle">
          Буриад дэгэлийн хэсэг бүр тусгай утга, түүх агуулдаг.
          Хулганаа хэсэг дээр аваачиж нууцыг нь нээ.
        </p>
      </div>

      {/* Interactive section */}
      <section className="huvtsas-body container">

        {/* Left — figure */}
        <div className="huvtsas-figure-wrap">
          <FigureSVG
            hovered={hovered}
            onHover={setHovered}
            onLeave={() => setHovered(null)}
          />

          {/* Part labels */}
          <div className="huvtsas-labels">
            {PARTS.map(p => (
              <button
                key={p.id}
                className={`huvtsas-label-btn${hovered === p.id ? ' active' : ''}`}
                onMouseEnter={() => setHovered(p.id)}
                onMouseLeave={() => setHovered(null)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right — info panel */}
        <div className="huvtsas-info">
          {activePart ? (
            <div className="huvtsas-card" key={activePart.id}>
              <div className="huvtsas-card__tag">{activePart.label}</div>
              <h2 className="huvtsas-card__meaning">{activePart.meaning}</h2>
              <span className="gold-line" style={{ margin: '16px 0' }} />
              <p className="huvtsas-card__text">{activePart.description}</p>
            </div>
          ) : (
            <div className="huvtsas-hint">
              <div className="huvtsas-hint__icon">☜</div>
              <p className="huvtsas-hint__text">
                Хувцасны аль нэг хэсэгт хулганаа аваачиж
                <br />утга, түүхийг нь уншаарай
              </p>
              <div className="huvtsas-hint__dots">
                {PARTS.map(p => (
                  <span
                    key={p.id}
                    className="huvtsas-hint__dot"
                    style={{ animationDelay: `${PARTS.indexOf(p) * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

      </section>

      {/* Bottom — part chips row */}
      <section className="huvtsas-chips-section container">
        <div className="huvtsas-chips">
          {PARTS.map(p => (
            <button
              key={p.id}
              className={`huvtsas-chip${hovered === p.id ? ' active' : ''}`}
              onMouseEnter={() => setHovered(p.id)}
              onMouseLeave={() => setHovered(null)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </section>

    </main>
  )
}
