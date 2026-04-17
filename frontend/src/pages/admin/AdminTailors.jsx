import { useState, useEffect } from 'react'
import { api } from '../../api'
import { USER_STATUS_LABEL, userStatusBadgeClass } from './adminUtils'

const EMPTY_FORM = { full_name: '', email: '', phone: '', password: '', business_name: '', specialization: '' }

export default function AdminTailors() {
  const [tailors, setTailors]         = useState([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState('')
  const [actionLoading, setActionLoading] = useState(null)
  const [showModal, setShowModal]     = useState(false)
  const [form, setForm]               = useState(EMPTY_FORM)
  const [formError, setFormError]     = useState('')
  const [formLoading, setFormLoading] = useState(false)

  useEffect(() => {
    api.get('/admin/tailors')
      .then(d => setTailors(d.tailors ?? []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const toggleVerify = async (id, current) => {
    setActionLoading(id)
    try {
      await api.put(`/admin/tailors/${id}/verify`, { verified: !current })
      setTailors(prev =>
        prev.map(t => t.id === id ? { ...t, verified: !current } : t)
      )
    } catch (err) {
      alert(err.message)
    } finally {
      setActionLoading(null)
    }
  }

  const handleField = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }))

  const submitCreate = async e => {
    e.preventDefault()
    setFormLoading(true)
    setFormError('')
    try {
      const d = await api.post('/admin/tailors', form)
      setTailors(prev => [d.tailor, ...prev])
      setShowModal(false)
      setForm(EMPTY_FORM)
    } catch (err) {
      setFormError(err.message)
    } finally {
      setFormLoading(false)
    }
  }

  const changeStatus = async (id, status) => {
    setActionLoading(id)
    try {
      const d = await api.put(`/admin/users/${id}/status`, { status })
      setTailors(prev => prev.map(t => t.id === id ? { ...t, status: d.user.status } : t))
    } catch (err) {
      alert(err.message)
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div>
      <h1 className="ad-page-title">Оёдолчид</h1>
      <p className="ad-page-sub">Оёдолчдын баталгаажуулалт болон статусыг удирдана уу.</p>

      {error && <div className="ad-error">{error}</div>}

      {showModal && (
        <div className="ad-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="ad-modal" onClick={e => e.stopPropagation()}>
            <h2 className="ad-modal__title">Оёдолчин нэмэх</h2>
            <form onSubmit={submitCreate}>
              {[
                { name: 'full_name',      label: 'Овог нэр',          required: true  },
                { name: 'email',          label: 'И-мэйл',            required: true  },
                { name: 'phone',          label: 'Утас',              required: false },
                { name: 'password',       label: 'Нууц үг',           required: true, type: 'password' },
                { name: 'business_name',  label: 'Бизнесийн нэр',     required: false },
                { name: 'specialization', label: 'Мэргэшлийн чиглэл', required: false },
              ].map(f => (
                <div key={f.name} className="ad-modal__field">
                  <label>{f.label}</label>
                  <input
                    name={f.name}
                    type={f.type || 'text'}
                    value={form[f.name]}
                    onChange={handleField}
                    required={f.required}
                  />
                </div>
              ))}
              {formError && <div className="ad-error">{formError}</div>}
              <div className="ad-modal__actions">
                <button type="button" className="ad-btn ad-btn--neutral" onClick={() => setShowModal(false)}>
                  Цуцлах
                </button>
                <button type="submit" className="ad-btn ad-btn--success" disabled={formLoading}>
                  {formLoading ? 'Хадгалж байна...' : 'Нэмэх'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="ad-card">
        <div className="ad-section-header">
          <h2 className="ad-section-title">
            Оёдолчдын жагсаалт
            {!loading && (
              <span style={{ fontWeight: 400, fontSize: '0.85rem', color: 'var(--text-light)', marginLeft: 6 }}>
                ({tailors.length})
              </span>
            )}
          </h2>
          <button className="ad-btn ad-btn--success" onClick={() => setShowModal(true)}>
            + Оёдолчин нэмэх
          </button>
        </div>

        {loading ? (
          <div className="ad-loading">Ачааллаж байна...</div>
        ) : tailors.length === 0 ? (
          <div className="ad-empty">
            <div className="ad-empty__icon">✂</div>
            <p>Оёдолчин бүртгэгдээгүй байна</p>
          </div>
        ) : (
          <table className="ad-table">
            <thead>
              <tr>
                <th>Нэр</th>
                <th>И-мэйл</th>
                <th>Бизнесийн нэр</th>
                <th>Захиалга</th>
                <th>Үнэлгээ</th>
                <th>Баталгаа</th>
                <th>Төлөв</th>
                <th>Үйлдэл</th>
              </tr>
            </thead>
            <tbody>
              {tailors.map(t => (
                <tr key={t.id}>
                  <td style={{ fontWeight: 500 }}>{t.full_name}</td>
                  <td className="ad-table__muted">{t.email}</td>
                  <td>{t.business_name ?? '—'}</td>
                  <td className="ad-table__muted">{t.order_count ?? 0}</td>
                  <td>
                    {t.rating
                      ? <span>⭐ {Number(t.rating).toFixed(1)}</span>
                      : <span className="ad-table__muted">—</span>
                    }
                  </td>
                  <td>
                    {t.verified
                      ? <span className="ad-badge ad-badge--active">✓ Баталгаажсан</span>
                      : <span className="ad-badge ad-badge--inactive">Баталгаагүй</span>
                    }
                  </td>
                  <td>
                    <span className={`ad-badge ${userStatusBadgeClass(t.status)}`}>
                      {USER_STATUS_LABEL[t.status] ?? t.status}
                    </span>
                  </td>
                  <td>
                    <div className="ad-btn-group">
                      <button
                        className={`ad-btn ${t.verified ? 'ad-btn--neutral' : 'ad-btn--success'}`}
                        disabled={actionLoading === t.id}
                        onClick={() => toggleVerify(t.id, t.verified)}
                      >
                        {t.verified ? 'Цуцлах' : 'Батлах'}
                      </button>
                      {t.status !== 'blocked' ? (
                        <button
                          className="ad-btn ad-btn--danger"
                          disabled={actionLoading === t.id}
                          onClick={() => changeStatus(t.id, 'blocked')}
                        >
                          Хаах
                        </button>
                      ) : (
                        <button
                          className="ad-btn ad-btn--success"
                          disabled={actionLoading === t.id}
                          onClick={() => changeStatus(t.id, 'active')}
                        >
                          Нээх
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
