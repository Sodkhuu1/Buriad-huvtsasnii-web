import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../api'
import './NotificationBell.css'

const POLL_INTERVAL_MS = 30000  // 30 sek

// Niy uy-d nyy ulaan tsegtee batdaltai medegel charuulah
// Daragad sangiitir/dropdown nedeg, dosor ni 30-d daragdsan jagsaalt baina
export default function NotificationBell() {
  const [count, setCount]   = useState(0)
  const [open, setOpen]     = useState(false)
  const [items, setItems]   = useState([])
  const [loading, setLoading] = useState(false)
  const wrapRef = useRef(null)
  const navigate = useNavigate()
  const { user } = useAuth()

  // Unread count-iig polling
  useEffect(() => {
    let cancelled = false
    const fetchCount = async () => {
      try {
        const data = await api.get('/notifications/unread-count')
        if (!cancelled) setCount(data.count)
      } catch {
        // Login mededgu uyed silentlaad
      }
    }
    fetchCount()
    const tid = setInterval(fetchCount, POLL_INTERVAL_MS)
    return () => { cancelled = true; clearInterval(tid) }
  }, [])

  // Gadnaas darah uyed dropdown-iig hahna
  useEffect(() => {
    if (!open) return
    const onClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  const toggleOpen = async () => {
    if (open) {
      setOpen(false)
      return
    }
    setOpen(true)
    setLoading(true)
    try {
      const data = await api.get('/notifications')
      setItems(data.notifications)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  const handleItemClick = async (n) => {
    // Unread baival uneshen tagdaa
    if (!n.is_read) {
      try {
        await api.patch(`/notifications/${n.id}/read`)
        setItems(prev => prev.map(it => it.id === n.id ? { ...it, is_read: true } : it))
        setCount(c => Math.max(0, c - 1))
      } catch { /* ignore */ }
    }
    setOpen(false)

    // Order-tai holboson bol uurnih ni rolt-d hamaarsan order detail-руу очно
    if (n.order_id) {
      if (user?.role === 'tailor')   navigate(`/tailor/orders/${n.order_id}`)
      else if (user?.role === 'admin') navigate(`/admin/orders`)
      else                           navigate(`/my-orders/${n.order_id}`)
    }
  }

  const handleMarkAll = async () => {
    try {
      await api.patch('/notifications/read-all')
      setItems(prev => prev.map(it => ({ ...it, is_read: true })))
      setCount(0)
    } catch { /* ignore */ }
  }

  return (
    <div className="nb-wrap" ref={wrapRef}>
      <button
        className="nb-trigger"
        onClick={toggleOpen}
        aria-label="Мэдэгдэл"
      >
        <span className="nb-icon" aria-hidden="true">🔔</span>
        {count > 0 && (
          <span className="nb-badge">{count > 9 ? '9+' : count}</span>
        )}
      </button>

      {open && (
        <div className="nb-dropdown">
          <div className="nb-header">
            <span className="nb-title">Мэдэгдэл</span>
            {count > 0 && (
              <button className="nb-mark-all" onClick={handleMarkAll}>
                Бүгдийг уншсан
              </button>
            )}
          </div>

          <div className="nb-list">
            {loading && <div className="nb-empty">Ачааллаж байна...</div>}
            {!loading && items.length === 0 && (
              <div className="nb-empty">Мэдэгдэл алга</div>
            )}
            {!loading && items.map(n => (
              <button
                key={n.id}
                className={`nb-item ${!n.is_read ? 'is-unread' : ''}`}
                onClick={() => handleItemClick(n)}
              >
                <div className="nb-item-title">{n.title}</div>
                <div className="nb-item-content">{n.content}</div>
                <div className="nb-item-time">
                  {new Date(n.sent_at).toLocaleString('mn-MN', {
                    month: 'short', day: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
