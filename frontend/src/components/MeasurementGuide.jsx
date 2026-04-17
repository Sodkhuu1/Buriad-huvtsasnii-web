import { useState } from 'react'
import './MeasurementGuide.css'

const FIELDS = [
  {
    name: 'height',
    label: 'Өндөр',
    icon: '↕',
    hint: 'Толгойноос хөлийн ул хүртэл',
    instruction: 'Хананд нуруугаа тулж, гутлаа тайлж зогсоно уу. Толгойн оройноос шалны гадаргуу хүртэл хэмжинэ.',
    tips: ['Шулуун зогсоно уу', 'Өсгийгүй, хавтгай газар дээр зогсоно уу', 'Хэн нэгнээр хэмжүүлэх нь илүү нарийвчилалтай'],
  },
  {
    name: 'chest',
    label: 'Цээж',
    icon: '○',
    hint: 'Цээжний хамгийн өргөн хэсэг',
    instruction: 'Хэмжих тууз цээжний хамгийн бүдүүн хэсгээр, суганы доогуур тойруулна. Гүнзгий амьсгалж хэмжинэ.',
    tips: ['Хэт чангалж болохгүй', 'Тууз газартай параллель байна', 'Нимгэн хувцастай хэмжинэ'],
  },
  {
    name: 'waist',
    label: 'Бүсэлхий',
    icon: '○',
    hint: 'Бүсэлхийн хамгийн нарийн хэсэг',
    instruction: 'Бүсэлхийн хамгийн нарийн хэсгээр (ихэвчлэн хүйсний дээгүүр) хэмжих тууз тойруулна.',
    tips: ['Урагш бөхийж хамгийн нарийн хэсгийг олно уу', 'Хэвийн амьсгалтай хэмжинэ', 'Хэт чанга биш, хэт сул биш'],
  },
  {
    name: 'hip',
    label: 'Ташаа',
    icon: '○',
    hint: 'Ташааны хамгийн өргөн хэсэг',
    instruction: 'Ташааны хамгийн бүдүүн хэсгээр тойруулж хэмжинэ. Ихэвчлэн бүсэлхийнээс 18-23 см доор байна.',
    tips: ['Хөлөө нийлүүлж зогсоно уу', 'Толин дээр тохируулбал илүү нарийвчилалтай', 'Тууз шалтай параллель байх ёстой'],
  },
  {
    name: 'sleeve',
    label: 'Гарын урт',
    icon: '↔',
    hint: 'Мөрнөөс бугуй хүртэл',
    instruction: 'Мөрний оройн цэгээс тохойг бага зэрэг нугалаад, бугуйн ясны доод хэсэг хүртэл хэмжинэ.',
    tips: ['Гараа байгалийн байдлаар доош тавина', 'Тохойг бага зэрэг (15°) нугална', 'Мөрний оройноос эхэлнэ'],
  },
  {
    name: 'shoulder',
    label: 'Мөрний өргөн',
    icon: '↔',
    hint: 'Мөрний хоорондох зай',
    instruction: 'Нэг мөрний оройноос нөгөө мөрний оройн цэг хүртэл нурууны дагуу хэмжинэ.',
    tips: ['Нурууг шулуун байлгана', 'Мөрний ясны хамгийн гадна цэгийг олно уу', 'Өөрөө хэмжихэд хэцүү, тусламж авна уу'],
  },
]

// SVG Body silhouette with measurement indicators
function BodySvg({ active }) {
  return (
    <svg viewBox="0 0 200 440" className="mg-body-svg">
      {/* Body outline */}
      <ellipse cx="100" cy="38" rx="22" ry="26" className="mg-body-part" />
      <path d="M92 62 Q92 75 88 82 L58 95 Q48 98 40 115 L28 170 Q26 178 30 180 L40 178 Q44 176 46 170 L62 120 L68 160 L64 260 L62 340 Q60 360 66 370 L78 372 Q84 370 82 350 L90 260 Q95 245 100 245 Q105 245 110 260 L118 350 Q116 370 122 372 L134 370 Q140 360 138 340 L136 260 L132 160 L138 120 L154 170 Q156 176 160 178 L170 180 Q174 178 172 170 L160 115 Q152 98 142 95 L112 82 Q108 75 108 62" className="mg-body-part" />

      {/* Measurement indicators — only active one is highlighted */}

      {/* Height — full vertical line */}
      <g className={`mg-indicator${active === 'height' ? ' mg-indicator--active' : ''}`}>
        <line x1="18" y1="12" x2="18" y2="370" strokeDasharray="4 3" />
        <line x1="12" y1="12" x2="24" y2="12" />
        <line x1="12" y1="370" x2="24" y2="370" />
      </g>

      {/* Chest */}
      <g className={`mg-indicator${active === 'chest' ? ' mg-indicator--active' : ''}`}>
        <ellipse cx="100" cy="120" rx="38" ry="14" fill="none" strokeDasharray="4 3" />
      </g>

      {/* Waist */}
      <g className={`mg-indicator${active === 'waist' ? ' mg-indicator--active' : ''}`}>
        <ellipse cx="100" cy="160" rx="32" ry="12" fill="none" strokeDasharray="4 3" />
      </g>

      {/* Hip */}
      <g className={`mg-indicator${active === 'hip' ? ' mg-indicator--active' : ''}`}>
        <ellipse cx="100" cy="200" rx="36" ry="14" fill="none" strokeDasharray="4 3" />
      </g>

      {/* Sleeve — arm line */}
      <g className={`mg-indicator${active === 'sleeve' ? ' mg-indicator--active' : ''}`}>
        <line x1="142" y1="95" x2="170" y2="178" strokeDasharray="4 3" />
        <line x1="137" y1="92" x2="147" y2="98" />
        <line x1="165" y1="175" x2="175" y2="181" />
      </g>

      {/* Shoulder */}
      <g className={`mg-indicator${active === 'shoulder' ? ' mg-indicator--active' : ''}`}>
        <line x1="58" y1="95" x2="142" y2="95" strokeDasharray="4 3" />
        <line x1="58" y1="88" x2="58" y2="102" />
        <line x1="142" y1="88" x2="142" y2="102" />
      </g>
    </svg>
  )
}

export default function MeasurementGuide({ measurements, errors, onChange }) {
  const [active, setActive] = useState('height')
  const activeField = FIELDS.find(f => f.name === active)

  return (
    <div className="mg-layout">
      {/* Left — body guide */}
      <div className="mg-guide">
        <div className="mg-guide__visual">
          <BodySvg active={active} />
        </div>
        <div className="mg-guide__info" key={active}>
          <div className="mg-guide__badge">{activeField.icon} {activeField.label}</div>
          <p className="mg-guide__instruction">{activeField.instruction}</p>
          <ul className="mg-guide__tips">
            {activeField.tips.map((tip, i) => (
              <li key={i}>{tip}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Right — inputs */}
      <div className="mg-inputs">
        {FIELDS.map((field, i) => (
          <div
            key={field.name}
            className={`mg-field${active === field.name ? ' mg-field--active' : ''}${measurements[field.name] ? ' mg-field--filled' : ''}`}
            onClick={() => setActive(field.name)}
          >
            <div className="mg-field__number">{i + 1}</div>
            <div className="mg-field__body">
              <label className="mg-field__label">
                <span className="mg-field__icon">{field.icon}</span>
                {field.label}
              </label>
              <span className="mg-field__hint">{field.hint}</span>
            </div>
            <div className="mg-field__input-wrap">
              <input
                type="number"
                name={field.name}
                value={measurements[field.name]}
                onChange={onChange}
                onFocus={() => setActive(field.name)}
                placeholder="0"
                min="1"
                className={`mg-field__input${errors[field.name] ? ' mg-field__input--error' : ''}`}
              />
              <span className="mg-field__unit">см</span>
            </div>
            {measurements[field.name] && <div className="mg-field__check">✓</div>}
            {errors[field.name] && <span className="mg-field__error">{errors[field.name]}</span>}
          </div>
        ))}
      </div>
    </div>
  )
}
