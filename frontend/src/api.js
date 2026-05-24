// api.js — central place for all backend requests
//
// How it works:
// 1. Every request goes through the `request` function
// 2. `credentials: 'include'` sends/receives the httpOnly auth cookie
//    (JS cannot read that cookie — that's the point, it's XSS-safe)
// 3. If the server returns an error, it throws so components can catch it

const getDefaultBaseUrl = () => {
  const hostname = window.location.hostname
  const apiHost = hostname.includes(':') ? `[${hostname}]` : hostname

  return `http://${apiHost}:5000/api`
}

const BASE_URL = (import.meta.env.VITE_API_URL || getDefaultBaseUrl()).replace(/\/$/, '')

const request = async (path, options = {}) => {
  const headers = { 'Content-Type': 'application/json', ...options.headers }
  const url = `${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  })

  // Some endpoints (logout) may return an empty body
  const text = await res.text()
  const data = text ? JSON.parse(text) : {}

  if (!res.ok) {
    const err = new Error(data.message || 'Алдаа гарлаа')
    err.status = res.status
    throw err
  }

  return data
}

export const api = {
  get:   (path)       => request(path),
  post:  (path, body) => request(path, { method: 'POST',  body: body ? JSON.stringify(body) : undefined }),
  put:   (path, body) => request(path, { method: 'PUT',   body: body ? JSON.stringify(body) : undefined }),
  patch: (path, body) => request(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  del:   (path)       => request(path, { method: 'DELETE' }),
}
