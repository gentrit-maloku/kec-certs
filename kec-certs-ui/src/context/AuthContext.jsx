import { createContext, useContext, useState } from 'react'
import { login as loginApi } from '../api/auth.api'

const AuthContext = createContext(null)

// Decode JWT payload without a library
function parseJwt(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(json)
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user')
    return saved ? JSON.parse(saved) : null
  })

  const login = async (email, password) => {
    const { data } = await loginApi(email, password)
    const { accessToken } = data

    const claims = parseJwt(accessToken)
    const userData = {
      id: claims['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'],
      email: claims['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'],
      name: claims['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'],
      role: claims['role'],
    }

    localStorage.setItem('token', accessToken)
    localStorage.setItem('user', JSON.stringify(userData))
    setToken(accessToken)
    setUser(userData)

    return userData
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
  }

  const hasRole = (...roles) => roles.includes(user?.role)

  const isAtLeast = (role) => {
    const order = ['Viewer', 'User', 'Admin', 'SuperAdmin']
    return order.indexOf(user?.role) >= order.indexOf(role)
  }

  return (
    <AuthContext.Provider value={{ token, user, login, logout, hasRole, isAtLeast }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
