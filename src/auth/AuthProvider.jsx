import React, { createContext, useContext, useState, useEffect } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { logout as clearToken, getToken, isTokenExpired } from '../services/authService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('authUser')) || null
    } catch {
      return null
    }
  })

  useEffect(() => {
    if (user) localStorage.setItem('authUser', JSON.stringify(user))
    else localStorage.removeItem('authUser')
  }, [user])

  const navigate = useNavigate()

  // auto-check token expiry on mount and periodically
  useEffect(() => {
    function checkToken() {
      const token = getToken()
      if (token && isTokenExpired(token)) {
        // token expired -> clear state and redirect to login
        setUser(null)
        clearToken()
        navigate('/login', { replace: true })
      }
    }

    checkToken()
    const id = setInterval(checkToken, 60 * 1000)
    return () => clearInterval(id)
  }, [navigate])

  const login = (user) => {
    setUser(user)
  }

  const logout = () => {
    setUser(null)
    clearToken() // ✅ JWT token törlése is
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

export function RequireAuth({ children }) {
  const auth = useAuth()
  const location = useLocation()

  if (!auth || !auth.user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}
