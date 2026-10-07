import React, { createContext, useContext, useState, useEffect } from 'react'
import { apiFetch } from '@/lib/api'

export interface UserProfile {
  id: string
  name: string
  email: string
  provider: string
  role?: string
  avatar_url?: string
}

interface AuthContextType {
  user: UserProfile | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  isLoggingOut: boolean
  login: (email: string, password: string) => Promise<UserProfile>
  register: (name: string, email: string, password: string) => Promise<UserProfile>
  loginWithGoogle: (credential: string) => Promise<UserProfile>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const TOKEN_KEY = 'gm_auth_token'
const USER_KEY = 'gm_auth_user'

/**
 * Safely parse a JWT payload on the client without verifying the signature
 * (signature is verified by the backend on each API request).
 * Used for instant zero-latency session hydration so ProtectedRoute never
 * sees null user or redirects before network verification completes.
 */
function decodeTokenPayload(token: string): UserProfile | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const base64Url = parts[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    const parsed = JSON.parse(jsonPayload)
    if (!parsed || !parsed.id || !parsed.email) return null
    // If token has an exp claim and is already expired, reject it
    if (parsed.exp && parsed.exp * 1000 < Date.now()) {
      return null
    }
    return {
      id: parsed.id,
      name: parsed.name || parsed.email.split('@')[0],
      email: parsed.email,
      provider: parsed.provider || 'local',
      role: parsed.role || 'customer',
      avatar_url: parsed.avatar_url,
    }
  } catch {
    return null
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => {
    return typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null
  })

  // Synchronously hydrate user profile to eliminate race conditions
  const [user, setUser] = useState<UserProfile | null>(() => {
    if (typeof window === 'undefined') return null
    const storedToken = localStorage.getItem(TOKEN_KEY)
    if (!storedToken) return null

    // 1. Try cached user object
    const storedUser = localStorage.getItem(USER_KEY)
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser) as UserProfile
        if (parsed && parsed.id && parsed.email) {
          return parsed
        }
      } catch {
        // Fall through to token decoding
      }
    }

    // 2. Fallback: decode unexpired JWT token payload
    const decoded = decodeTokenPayload(storedToken)
    if (decoded) {
      try {
        localStorage.setItem(USER_KEY, JSON.stringify(decoded))
      } catch {
        // Ignore quota errors
      }
      return decoded
    }

    return null
  })

  // Only set isLoading to true if there's a token but user couldn't be hydrated synchronously
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    const storedToken = localStorage.getItem(TOKEN_KEY)
    if (!storedToken) return false
    const storedUser = localStorage.getItem(USER_KEY)
    if (storedUser) return false
    // If we have token and couldn't hydrate, we must wait for checkAuth
    return !decodeTokenPayload(storedToken)
  })

  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false)

  // Verify session with the backend asynchronously
  useEffect(() => {
    let isMounted = true

    async function checkAuth() {
      const storedToken = localStorage.getItem(TOKEN_KEY)
      if (!storedToken) {
        if (isMounted) {
          setUser(null)
          setToken(null)
          setIsLoading(false)
        }
        localStorage.removeItem(USER_KEY)
        return
      }

      try {
        const { ok, status, data } = await apiFetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${storedToken}` },
        })

        if (ok && data?.user) {
          if (isMounted) {
            setUser(data.user)
            setToken(storedToken)
          }
          localStorage.setItem(USER_KEY, JSON.stringify(data.user))
        } else if (status === 401 || status === 403) {
          // Token is definitively invalid or expired on the server
          localStorage.removeItem(TOKEN_KEY)
          localStorage.removeItem(USER_KEY)
          if (isMounted) {
            setUser(null)
            setToken(null)
          }
        } else {
          // Server error 5xx or database spin-up lag: preserve active local session
          console.warn(`[Auth] /api/auth/me returned status ${status}. Retaining local session.`)
        }
      } catch (err) {
        // Network connection error / temporary offline: preserve active local session
        console.warn('[Auth] Session verification network error:', err)
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    checkAuth()

    return () => { isMounted = false }
  }, [])

  const login = async (email: string, password: string): Promise<UserProfile> => {
    const { ok, data } = await apiFetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    if (!ok) throw new Error(data.error || 'Failed to sign in.')
    localStorage.setItem(TOKEN_KEY, data.token)
    localStorage.setItem(USER_KEY, JSON.stringify(data.user))
    setToken(data.token)
    setUser(data.user)
    return data.user
  }

  const register = async (name: string, email: string, password: string): Promise<UserProfile> => {
    const { ok, data } = await apiFetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    })
    if (!ok) throw new Error(data.error || 'Failed to create account.')
    localStorage.setItem(TOKEN_KEY, data.token)
    localStorage.setItem(USER_KEY, JSON.stringify(data.user))
    setToken(data.token)
    setUser(data.user)
    return data.user
  }

  const loginWithGoogle = async (credential: string): Promise<UserProfile> => {
    const { ok, data } = await apiFetch('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential }),
    })
    if (!ok) throw new Error(data.error || 'Google authentication failed.')
    localStorage.setItem(TOKEN_KEY, data.token)
    localStorage.setItem(USER_KEY, JSON.stringify(data.user))
    setToken(data.token)
    setUser(data.user)
    return data.user
  }

  const logout = () => {
    setIsLoggingOut(true)
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setToken(null)
    setUser(null)
    setTimeout(() => {
      setIsLoggingOut(false)
    }, 600)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        isLoggingOut,
        login,
        register,
        loginWithGoogle,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
