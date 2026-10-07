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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [token, setToken] = useState<string | null>(() => {
    return typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null
  })
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    return typeof window !== 'undefined' ? !!localStorage.getItem(TOKEN_KEY) : false
  })
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false)

  // Verify session on mount or when token changes
  useEffect(() => {
    let isMounted = true

    async function checkAuth() {
      const storedToken = localStorage.getItem(TOKEN_KEY)
      if (!storedToken) {
        if (isMounted) {
          setUser(null)
          setIsLoading(false)
        }
        return
      }

      try {
        const { ok, data } = await apiFetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${storedToken}` },
        })

        if (ok) {
          if (isMounted) {
            setUser(data.user)
            setToken(storedToken)
          }
        } else {
          localStorage.removeItem(TOKEN_KEY)
          if (isMounted) {
            setUser(null)
            setToken(null)
          }
        }
      } catch (err) {
        console.error('Session verification error:', err)
      } finally {
        if (isMounted) setIsLoading(false)
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
    setToken(data.token)
    setUser(data.user)
    return data.user
  }

  const logout = () => {
    setIsLoggingOut(true)
    localStorage.removeItem(TOKEN_KEY)
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
