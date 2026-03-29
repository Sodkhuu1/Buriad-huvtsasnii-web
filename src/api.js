// api.js — central place for all backend requests
//
// How it works:
// 1. Every request goes through the `request` function
// 2. It automatically adds the JWT token from localStorage (if logged in)
// 3. If the server returns an error, it throws it so we can catch it in the component

const BASE_URL = 'http://localhost:5000/api'

const request = async (path, options = {}) => {
  const headers = { 'Content-Type': 'application/json', ...options.headers }

  const token = localStorage.getItem('token')
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers })
  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.message || 'Алдаа гарлаа')
  }

  return data
}

export const api = {
  get:  (path)         => request(path),
  post: (path, body)   => request(path, { method: 'POST',  body: JSON.stringify(body) }),
  put:  (path, body)   => request(path, { method: 'PUT',   body: JSON.stringify(body) }),
  del:  (path)         => request(path, { method: 'DELETE' }),
}
