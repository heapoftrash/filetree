import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { authMe, setAuthToken, clearAuthToken, getAuthToken, loginLocal } from '../api/client'

export interface User {
  email: string
  name?: string
  picture?: string
  is_admin?: boolean
}

interface AuthContextValue {
  user: User | null
  loading: boolean
  isAuthenticated: boolean
  login: (provider: 'google' | 'github' | 'local', credentials?: { username: string; password: string }) => void
  logout: () => void
  setTokenFromUrl: () => boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const location = useLocation()

  const checkAuth = useCallback(async () => {
    const token = getAuthToken()
    if (!token) {
      setUser(null)
      setLoading(false)
      return
    }
    try {
      const u = await authMe()
      setUser(u)
    } catch {
      clearAuthToken()
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  const setTokenFromUrl = useCallback(() => {
    const hash = window.location.hash
    if (hash.startsWith('#token=')) {
      const token = hash.slice(7)
      if (token) {
        setAuthToken(token)
        window.history.replaceState({}, '', window.location.pathname + window.location.search)
        return true
      }
    }
    return false
  }, [])

  useEffect(() => {
    setTokenFromUrl()
    checkAuth()
  }, [checkAuth, setTokenFromUrl])

  const login = useCallback(
    async (provider: 'google' | 'github' | 'local', credentials?: { username: string; password: string }) => {
      const from = (location.state as { from?: string })?.from || location.pathname || '/files'
      const redirect = from.startsWith('/') ? from : '/' + from
      if (provider === 'google') {
        const state = from.startsWith('/') ? from.slice(1) : from
        window.location.href = `/api/auth/google?state=${encodeURIComponent(state)}`
        return
      }
      if (provider === 'github') {
        window.location.href = `/api/auth/github?state=${encodeURIComponent(redirect.replace(/^\//, ''))}`
        return
      }
      if (provider === 'local' && credentials) {
        const { token } = await loginLocal(credentials.username, credentials.password, redirect)
        setAuthToken(token)
        const u = await authMe()
        setUser(u)
        navigate(redirect, { replace: true })
      }
    },
    [location.state, location.pathname, navigate],
  )

  const logout = useCallback(() => {
    clearAuthToken()
    setUser(null)
    navigate('/login', { replace: true })
  }, [navigate])

  const value: AuthContextValue = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
    setTokenFromUrl,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
