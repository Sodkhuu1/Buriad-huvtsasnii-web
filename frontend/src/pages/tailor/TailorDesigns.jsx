import { useState, useEffect } from 'react'
import { api } from '../../api'
import './TailorDesigns.css'

const EMPTY_FORM = {
  name: '', category_id: '', base_price: '', ceremonial_use: '', silhouette: '',
  image_url: '', flat_image_url: '',
}

export default function TailorDesigns() {
  const [designs, setDesigns]       = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')

  const [showModal, setShowModal]   = useState(false)
  const [editing, setEditing]       = useState(null)   // design object being edited
  const [form, setForm]             = useState(EMPTY_FORM)
  const [formError, setFormError]   = useState('')
  const [formLoading, setFormLoading] = useState(false)

  useEffect(() => {
    Promise.all([
      api.get('/tailor/designs'),
      api.get('/garments/categories'),
    ])
      .then(([d, c]) => {
        setDesigns(d.designs)
        setCategories(c.categories)
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setFormError('')
    setShowModal(true)
  }

  const openEdit = (design) => {
    setEditing(design)
    setForm({
      name:            design.name            ?? '',
      category_id:     design.category_id     ?? '',
      base_price:      design.base_price      ?? '',
      ceremonial_use:  design.ceremonial_use  ?? '',
      silhouette:      design.silhouette      ?? '',
      image_url:       design.image_url       ?? '',
      flat_image_url:  design.flat_image_url  ?? '',
    })
    setFormError('')
    setShowModal(true)
  }

  const closeModal = () => { setShowModal(false); setEditing(null) }

  const handleField = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }))

  const submit = async e => {
    e.preventDefault()
    setFormLoading(true)
    setFormError('')
    try {
      const payload = { ...form, base_price: parseFloat(form.base_price) }
      if (editing) {
        const d = await api.put(`/tailor/designs/${editing.id}`, payload)
        setDesigns(prev => prev.map(x => x.id === editing.id ? { ...x, ...d.design, category_name: categories.find(c => c.id === d.design.category_id)?.name } : x))
      } else {
        const d = await api.post('/tailor/designs', payload)
        const catName = categories.find(c => c.id === d.design.category_id)?.name
        setDesigns(prev => [{ ...d.design, category_name: catName }, ...prev])
      }
      closeModal()
    } catch (err) {
      setFormError(err.message)
    } finally {
      setFormLoading(false)
    }
  }

  const deleteDesign = async (id) => {
    if (!confirm('Энэ загварыг устгах уу?')) return
    try {
      await api.del(`/tailor/designs/${id}`)
      setDesigns(prev => prev.filter(x => x.id !== id))
    } catch (err) {
      alert(err.message)
    }
  }

  return (
    <div className="td-page">
      <div className="td-header">
        <div>
          <h1 className="td-title">Загварууд</h1>
          <p className="td-sub">Өөрийн хувцасны загваруудыг удирдана уу</p>
        </div>
        <button className="td-btn td-btn--primary" onClick={openCreate}>
          + Загвар нэмэх
        </button>
      </div>

      {error && <div className="td-error">{error}</div>}

      {showModal && (
        <div className="td-overlay" onClick={closeModal}>
          <div className="td-modal" onClick={e => e.stopPropagation()}>
            <h2 className="td-modal__title">{editing ? 'Загвар засах' : 'Шинэ загвар'}</h2>
            <form onSubmit={submit}>
              <div className="td-field">
                <label>Загварын нэр *</label>
                <input name="name" value={form.name} onChange={handleField} required />
              </div>
              <div className="td-field">
                <label>Ангилал</label>
                <select name="category_id" value={form.category_id} onChange={handleField}>
                  <option value="">— сонгох —</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="td-field">
                <label>Үндсэн үнэ (₮) *</label>
                <input name="base_price" type="number" min="0" value={form.base_price} onChange={handleField} required />
              </div>
              <div className="td-field">
                <label>Ёслолын зориулалт</label>
                <input name="ceremonial_use" value={form.ceremonial_use} onChange={handleField} placeholder="Цагаан сар, гэрлэлтийн ёслол..." />
              </div>
              <div className="td-field">
                <label>Силуэт</label>
                <input name="silhouette" value={form.silhouette} onChange={handleField} placeholder="A-line, шулуун..." />
              </div>
              <div className="td-field">
                <label>Зургийн URL</label>
                <input name="image_url" value={form.image_url} onChange={handleField} placeholder="https://..." />
              </div>
              <div className="td-field">
                {/* try-on deer heregtei, huvtsasiig tegshlej taviad avsan zurag */}
                <label>Тэгшилсэн хувцасны зураг (заавал биш, өмсөөд үзэх боломжид хэрэглэнэ)</label>
                <input name="flat_image_url" value={form.flat_image_url} onChange={handleField} placeholder="https://..." />
              </div>
              {formError && <div className="td-error">{formError}</div>}
              <div className="td-modal__actions">
                <button type="button" className="td-btn td-btn--neutral" onClick={closeModal}>Цуцлах</button>
                <button type="submit" className="td-btn td-btn--primary" disabled={formLoading}>
                  {formLoading ? 'Хадгалж байна...' : editing ? 'Хадгалах' : 'Нэмэх'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="td-loading">Ачааллаж байна...</div>
      ) : designs.length === 0 ? (
        <div className="td-empty">
          <div className="td-empty__icon">✂</div>
          <p>Загвар байхгүй байна. Шинэ загвар нэмнэ үү.</p>
        </div>
      ) : (
        <div className="td-grid">
          {designs.map(d => (
            <div key={d.id} className="td-card">
              {d.image_url && (
                <img src={d.image_url} alt={d.name} className="td-card__img" />
              )}
              <div className="td-card__body">
                <div className="td-card__cat">{d.category_name ?? '—'}</div>
                <h3 className="td-card__name">{d.name}</h3>
                {d.ceremonial_use && <p className="td-card__meta">{d.ceremonial_use}</p>}
                <div className="td-card__price">{Number(d.base_price).toLocaleString()}₮</div>
              </div>
              <div className="td-card__actions">
                <button className="td-btn td-btn--neutral" onClick={() => openEdit(d)}>Засах</button>
                <button className="td-btn td-btn--danger"  onClick={() => deleteDesign(d.id)}>Устгах</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
