// AuthContext.jsx — global login state
//
// Any component in the app can call useAuth() to:
//   - check if user is logged in (user !== null)
//   - call login(email, password)
//   - call register(...)
//   - call logout()

import { createContext, useContext, useState } from 'react'
import { flushSync } from 'react-dom'
import { api } from '../api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  // On first load, check if there's already a saved user in localStorage
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user')
    return stored ? JSON.parse(stored) : null
  })

  const login = async (email, password) => {
    const data = await api.post('/auth/login', { email, password })
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))
    flushSync(() => setUser(data.user))
    return data.user
  }

  const register = async (payload) => {
    const data = await api.post('/auth/register', payload)
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))
    flushSync(() => setUser(data.user))
    return data.user
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
