import { useEffect, useRef, useState } from 'react'
import { api } from '../api'
import { useAuth } from '../context/AuthContext'
import './OrderChat.css'

const POLL_INTERVAL_MS = 15000

const formatMessageTime = (value) =>
  new Date(value).toLocaleString('mn-MN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

export default function OrderChat({ orderId, title = 'Чат' }) {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const listRef = useRef(null)

  const loadMessages = async ({ silent = false } = {}) => {
    if (!silent) setLoading(true)
    try {
      const data = await api.get(`/chat/orders/${orderId}/messages`)
      setMessages(data.messages)
      setError('')
    } catch (err) {
      if (!silent) setError(err.message)
    } finally {
      if (!silent) setLoading(false)
    }
  }

  useEffect(() => {
    loadMessages()
    const id = setInterval(() => loadMessages({ silent: true }), POLL_INTERVAL_MS)
    return () => clearInterval(id)
  }, [orderId])

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight })
  }, [messages.length])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const trimmed = message.trim()
    if (!trimmed || sending) return

    setSending(true)
    setError('')
    try {
      const data = await api.post(`/chat/orders/${orderId}/messages`, {
        message_body: trimmed,
      })
      setMessages(prev => [...prev, {
        ...data.message,
        sender_name: user?.full_name,
      }])
      setMessage('')
    } catch (err) {
      setError(err.message)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="order-chat">
      <div className="order-chat__header">
        <div>
          <h3 className="order-chat__title">{title}</h3>
          <p className="order-chat__subtitle">Захиалгатай холбоотой асуулт, тодруулгыг энд бичнэ.</p>
        </div>
        <button
          type="button"
          className="order-chat__refresh"
          onClick={() => loadMessages()}
          disabled={loading}
        >
          Шинэчлэх
        </button>
      </div>

      {error && <div className="order-chat__error">{error}</div>}

      <div className="order-chat__messages" ref={listRef}>
        {loading ? (
          <div className="order-chat__empty">Чатыг ачааллаж байна...</div>
        ) : messages.length === 0 ? (
          <div className="order-chat__empty">Одоогоор мессеж алга. Анхны мессежээ бичнэ үү.</div>
        ) : (
          messages.map(item => {
            const mine = item.sender_id === user?.id
            return (
              <div
                key={item.id}
                className={`order-chat__message${mine ? ' order-chat__message--mine' : ''}`}
              >
                <div className="order-chat__bubble">
                  <div className="order-chat__meta">
                    <span>{mine ? 'Та' : item.sender_name}</span>
                    <time>{formatMessageTime(item.sent_at)}</time>
                  </div>
                  <div className="order-chat__body">{item.message_body}</div>
                </div>
              </div>
            )
          })
        )}
      </div>

      <form className="order-chat__form" onSubmit={handleSubmit}>
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Мессеж бичих..."
          rows={3}
          maxLength={1000}
        />
        <div className="order-chat__form-bottom">
          <span>{message.length}/1000</span>
          <button type="submit" disabled={sending || !message.trim()}>
            {sending ? 'Илгээж байна...' : 'Илгээх'}
          </button>
        </div>
      </form>
    </div>
  )
}
