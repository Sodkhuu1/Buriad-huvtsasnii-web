import { useState } from 'react'
import { Client } from '@gradio/client'
import './TryOnModal.css'

// yisol/IDM-VTON — huggingface deerh virtual try-on model
const SPACE = 'yisol/IDM-VTON'

export default function TryOnModal({ garment, onClose, onProceedToOrder }) {
  const [userPhoto, setUserPhoto]   = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  const [resultUrl, setResultUrl]   = useState('')

  // hereglegchiin file songohod bdag
  const handleFile = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    setUserPhoto(f)
    setPreviewUrl(URL.createObjectURL(f))
    setError('')
    setResultUrl('')
  }

  // flat zurag bvl tuuniig ashiglana, baihgvi vyd jirin image_url
  const garmentImageUrl = garment.flat_image_url || garment.image_url

  const runTryOn = async () => {
    if (!userPhoto) { setError('Өөрийн бүтэн биеийн зургаа оруулна уу'); return }
    if (!garmentImageUrl) { setError('Энэ загварт зураг байхгүй байна'); return }

    setLoading(true)
    setError('')
    setResultUrl('')

    try {
      // garment zurgiig blob bolgoj avna, cors aldaa gargaval backend-eer damjuulah heregtei bolno
      const garmentBlob = await fetch(garmentImageUrl).then(r => {
        if (!r.ok) throw new Error('Загварын зургийг татаж чадсангүй')
        return r.blob()
      })

      const app = await Client.connect(SPACE)

      // IDM-VTON /tryon input: [humanImg(dict), garmImg, desc, useAutoMask, autoCrop, steps, seed]
      const result = await app.predict('/tryon', [
        { background: userPhoto, layers: [], composite: null },
        garmentBlob,
        garment.name || 'garment',
        true,
        true,
        30,
        42,
      ])

      // buun output ni [image, masked_img] maygaar irne
      const first = Array.isArray(result.data) ? result.data[0] : result.data
      const url = first?.url || first?.path || (typeof first === 'string' ? first : '')
      if (!url) throw new Error('Үр дүн олдсонгүй')
      setResultUrl(url)
    } catch (err) {
      // Space queue etsdee hvleehgvi vyd alge bolno
      setError(err?.message || 'Өмсөөд үзэхэд алдаа гарлаа. Дахин оролдоорой.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="tryon-overlay" onClick={onClose}>
      <div className="tryon-modal" onClick={e => e.stopPropagation()}>
        <button className="tryon-modal__close" onClick={onClose} aria-label="Хаах">✕</button>

        <h2 className="tryon-modal__title">Өмсөөд үзэх</h2>
        <p className="tryon-modal__sub">
          <strong>{garment.name}</strong> загвар дээр өөрийн зургаа тохируулж үзнэ үү
        </p>

        <div className="tryon-modal__body">
          {/* Zvvn tald — hereglegch zurag oruulah */}
          <div className="tryon-col">
            <h3 className="tryon-col__title">1. Өөрийн зураг</h3>
            <div className="tryon-tips">
              Бүтэн биеийн зураг, энгийн дэвсгэртэй, гар нь харагдахаар.
            </div>
            <label className="tryon-upload">
              {previewUrl ? (
                <img src={previewUrl} alt="Таны зураг" className="tryon-upload__preview" />
              ) : (
                <div className="tryon-upload__placeholder">
                  <div className="tryon-upload__icon">+</div>
                  <div>Зураг сонгох</div>
                </div>
              )}
              <input type="file" accept="image/*" onChange={handleFile} hidden />
            </label>
          </div>

          {/* Dund ni — songoson huvtsas */}
          <div className="tryon-col">
            <h3 className="tryon-col__title">2. Загвар</h3>
            <div className="tryon-garment">
              {garmentImageUrl ? (
                <img src={garmentImageUrl} alt={garment.name} className="tryon-garment__img" />
              ) : (
                <div className="tryon-garment__placeholder">✂</div>
              )}
              {!garment.flat_image_url && garment.image_url && (
                <div className="tryon-garment__note">
                  Тэгшилсэн зураг байхгүй тул үр дүн бага зэрэг чанар муутай байж магадгүй.
                </div>
              )}
            </div>
          </div>

          {/* Baruun tald — vr dun */}
          <div className="tryon-col">
            <h3 className="tryon-col__title">3. Үр дүн</h3>
            <div className="tryon-result">
              {loading ? (
                <div className="tryon-result__loading">
                  <div className="tryon-spinner" />
                  <div>Процесс явагдаж байна...</div>
                  <div className="tryon-result__hint">Ойролцоогоор 30 секунд</div>
                </div>
              ) : resultUrl ? (
                <img src={resultUrl} alt="Үр дүн" className="tryon-result__img" />
              ) : (
                <div className="tryon-result__empty">
                  Зургаа оруулаад "Өмсөөд үзэх" товчийг дарна уу
                </div>
              )}
            </div>
          </div>
        </div>

        {error && <div className="tryon-error">{error}</div>}

        <div className="tryon-actions">
          <button className="btn-secondary" onClick={onClose} disabled={loading}>
            Хаах
          </button>
          <button
            className="btn-primary"
            onClick={runTryOn}
            disabled={loading || !userPhoto}
          >
            {loading ? 'Түр хүлээнэ үү...' : resultUrl ? 'Дахин оролдох' : 'Өмсөөд үзэх →'}
          </button>
          {resultUrl && onProceedToOrder && (
            <button className="btn-primary tryon-actions__order" onClick={onProceedToOrder}>
              Энэ загвараар захиалах →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
