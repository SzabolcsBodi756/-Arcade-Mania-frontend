import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import * as authService from '../services/authService'

function Login({ loginFn, initialValues } = {}) {
  const [username, setUsername] = useState(initialValues?.username || '')
  const [password, setPassword] = useState(initialValues?.password || '')
  const [message, setMessage] = useState(null)
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()
  const location = useLocation()
  const auth = useAuth()

  const from = location.state?.from?.pathname || '/'

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (loading) return

    setMessage(null)

    const cleanUsername = username.trim()
    const cleanPassword = password.trim()

    if (!cleanUsername || !cleanPassword) {
      setMessage({ type: 'error', text: 'Felhasználónév és jelszó megadása kötelező.' })
      return
    }

    setLoading(true)

    try {
      const loginFunc = loginFn || authService.login
      const user = await loginFunc(cleanUsername, cleanPassword)


      auth?.login?.(user)

      setUsername('')
      setPassword('')

      setMessage({ type: 'success', text: 'Succes' })

      setTimeout(() => {
        navigate(from, { replace: true })
      }, 300)
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.message || 'Wrong credentials'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <main style={{ textAlign: 'center', marginTop: 100, padding: 20 }}>
        <h2 style={{ fontFamily: "'Press Start 2P', cursive" }}>
          Login
        </h2>

        <form onSubmit={handleSubmit} style={{ maxWidth: 360, margin: '0 auto' }}>
          <input
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={loading}
            required
          />

          <input
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        {message && (
          <div
            style={{
              marginTop: 12,
              color: message.type === 'error' ? 'salmon' : 'lightgreen'
            }}
          >
            {message.text}
          </div>
        )}
      </main>
    </div>
  )
}

export default Login
