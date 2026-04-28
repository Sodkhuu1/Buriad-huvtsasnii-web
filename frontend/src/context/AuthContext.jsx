// AuthContext.jsx — global login state
//
// Token is stored in an httpOnly cookie set by the server, so JS can't read it.
// We only keep the user profile in React state. On first mount we hit /auth/me
// to verify the session is still valid (user may have been blocked, cookie may
// have expired, etc.).
//
// Any component can call useAuth() to:
//   - see the current user (or null)
//   - check `loading` while the initial session is being verified
//   - call login / register / logout

import { createContext, useContext, useEffect, useState } from 'react'
import { flushSync } from 'react-dom'
import { api } from '../api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  // On mount, verify the session by asking the server who we are.
  // If the cookie is missing/expired, this will 401 and we stay logged out.
  useEffect(() => {
    let cancelled = false
    api.get('/auth/me')
      .then(data => { if (!cancelled) setUser(data.user) })
      .catch(() => { if (!cancelled) setUser(null) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const refreshUser = async () => {
    const data = await api.get('/auth/me')
    setUser(data.user)
    return data.user
  }

  const login = async (email, password) => {
    const data = await api.post('/auth/login', { email, password })
    flushSync(() => setUser(data.user))
    return data.user
  }

  const register = async (payload) => {
    const data = await api.post('/auth/register', payload)
    flushSync(() => setUser(data.user))
    return data.user
  }

  const logout = async () => {
    try { await api.post('/auth/logout') } catch { /* clear regardless */ }
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser, setUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
