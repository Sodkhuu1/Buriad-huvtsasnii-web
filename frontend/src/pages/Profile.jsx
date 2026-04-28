import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../context/AuthContext'
import './Profile.css'

const baseForm = {
  full_name: '',
  phone: '',
  gender: '',
  age: '',
  city: '',
  district: '',
  street: '',
  address_detail: '',
}

const roleLabel = {
  customer: 'Захиалагч',
  tailor: 'Оёдолчин',
  admin: 'Админ',
}

export default function Profile() {
  const { user, setUser } = useAuth()
  const [profile, setProfile] = useState(null)
  const [form, setForm] = useState(baseForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    let cancelled = false

    api.get('/auth/profile')
      .then(data => {
        if (cancelled) return
        setProfile(data.profile)
        setForm({
          full_name: data.profile.full_name ?? '',
          phone: data.profile.phone ?? '',
          gender: data.profile.gender ?? '',
          age: data.profile.age ?? '',
          city: data.profile.city ?? '',
          district: data.profile.district ?? '',
          street: data.profile.street ?? '',
          address_detail: data.profile.address_detail ?? '',
        })
      })
      .catch(err => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    setSuccess('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const payload = {
        full_name: form.full_name,
        phone: form.phone,
        gender: form.gender,
        age: form.age === '' ? '' : Number(form.age),
        city: form.city,
        district: form.district,
        street: form.street,
        address_detail: form.address_detail,
      }

      const data = await api.patch('/auth/profile', payload)
      setProfile(data.profile)
      setForm(prev => ({
        ...prev,
        full_name: data.profile.full_name ?? prev.full_name,
        phone: data.profile.phone ?? '',
        gender: data.profile.gender ?? '',
        age: data.profile.age ?? '',
        city: data.profile.city ?? '',
        district: data.profile.district ?? '',
        street: data.profile.street ?? '',
        address_detail: data.profile.address_detail ?? '',
      }))
      setUser?.(data.user)
      setSuccess('Профайл амжилттай хадгалагдлаа')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <main className="profile-page">
        <div className="profile-state">Ачааллаж байна...</div>
      </main>
    )
  }

  if (!profile) {
    return (
      <main className="profile-page">
        <div className="profile-state profile-state--error">
          {error || 'Профайл олдсонгүй'}
        </div>
      </main>
    )
  }

  return (
    <main className="profile-page">
      <section className="profile-hero">
        <div>
          <span className="profile-eyebrow">Account profile</span>
          <h1>Миний профайл</h1>
          <p>Нэр, холбоо барих мэдээлэл, нас, хүйс болон хүргэлтийн үндсэн хаягаа эндээс шинэчилнэ.</p>
        </div>

        <div className="profile-card-mini">
          <div className="profile-avatar">
            <span>{profile.full_name?.[0]?.toUpperCase() || 'Д'}</span>
          </div>
          <div>
            <strong>{profile.full_name}</strong>
            <span>{roleLabel[profile.role] || profile.role}</span>
          </div>
        </div>
      </section>

      <section className="profile-shell">
        <form className="profile-form" onSubmit={handleSubmit}>
          <div className="profile-section">
            <h2>Үндсэн мэдээлэл</h2>
            <div className="profile-grid">
              <label className="profile-field">
                <span>Овог нэр *</span>
                <input
                  name="full_name"
                  value={form.full_name}
                  onChange={handleChange}
                  required
                  maxLength={100}
                />
              </label>

              <label className="profile-field">
                <span>И-мэйл</span>
                <input value={profile.email} disabled />
              </label>

              <label className="profile-field">
                <span>Утас</span>
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  maxLength={20}
                  placeholder="9911 2233"
                />
              </label>

              <label className="profile-field">
                <span>Хүйс</span>
                <select name="gender" value={form.gender} onChange={handleChange}>
                  <option value="">Сонгохгүй</option>
                  <option value="female">Эмэгтэй</option>
                  <option value="male">Эрэгтэй</option>
                  <option value="other">Бусад</option>
                </select>
              </label>

              <label className="profile-field">
                <span>Нас</span>
                <input
                  name="age"
                  type="number"
                  min="0"
                  max="130"
                  value={form.age}
                  onChange={handleChange}
                  placeholder="25"
                />
              </label>

              <label className="profile-field">
                <span>Эрхийн төрөл</span>
                <input value={roleLabel[profile.role] || profile.role} disabled />
              </label>
            </div>
          </div>

          <div className="profile-section">
            <h2>Хаяг</h2>
            <div className="profile-grid">
              <label className="profile-field">
                <span>Хот / Аймаг</span>
                <input
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  maxLength={100}
                  placeholder="Улаанбаатар"
                />
              </label>

              <label className="profile-field">
                <span>Дүүрэг / Сум</span>
                <input
                  name="district"
                  value={form.district}
                  onChange={handleChange}
                  maxLength={100}
                  placeholder="Баянгол"
                />
              </label>

              <label className="profile-field">
                <span>Гудамж, байр</span>
                <input
                  name="street"
                  value={form.street}
                  onChange={handleChange}
                  maxLength={200}
                  placeholder="3-р хороо, 12-р байр"
                />
              </label>

              <label className="profile-field">
                <span>Дэлгэрэнгүй</span>
                <input
                  name="address_detail"
                  value={form.address_detail}
                  onChange={handleChange}
                  placeholder="Орц, давхар, хаалганы дугаар"
                />
              </label>
            </div>
          </div>

          {error && <div className="profile-alert profile-alert--error">{error}</div>}
          {success && <div className="profile-alert profile-alert--success">{success}</div>}

          <div className="profile-actions">
            <Link to={user?.role === 'tailor' ? '/tailor' : '/'} className="profile-secondary">
              Буцах
            </Link>
            <button type="submit" className="profile-primary" disabled={saving}>
              {saving ? 'Хадгалж байна...' : 'Профайл хадгалах'}
            </button>
          </div>
        </form>
      </section>
    </main>
  )
}
