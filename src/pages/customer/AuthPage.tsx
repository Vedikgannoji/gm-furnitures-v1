import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { Lock, Mail, User, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/context/ToastContext'
import { useAuth } from '@/context/AuthContext'
import { GoogleLogin } from '@react-oauth/google'

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

export const AuthPage: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { showToast } = useToast()
  const { user, login, register, loginWithGoogle, logout, isAuthenticated, isLoggingOut } = useAuth()

  const isAdminLogin = location.pathname.startsWith('/admin') || searchParams.get('redirect')?.startsWith('/admin') === true
  const requestedRedirect = searchParams.get('redirect') || ''

  const [tab, setTab] = useState<'login' | 'register' | 'forgot'>('login')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')

  /**
   * Compute the post-login destination based on the authenticated user's
   * actual role and requested redirect. Customer destinations (e.g. /account/orders)
   * are ALWAYS honored, even if the user happens to have admin privileges.
   */
  function getRedirectDestination(loggedInUser: { role?: string }): string {
    // 1. Explicit customer-page redirect (e.g. /account/orders, /checkout, /account) ALWAYS takes precedence
    if (requestedRedirect && !requestedRedirect.startsWith('/admin')) {
      return requestedRedirect
    }
    // 2. Explicit admin redirect is allowed only if the verified role is admin
    if (requestedRedirect && requestedRedirect.startsWith('/admin') && loggedInUser.role === 'admin') {
      return requestedRedirect
    }
    // 3. Explicit admin portal login (/admin/login)
    if (isAdminLogin && loggedInUser.role === 'admin') {
      return '/admin'
    }
    // 4. Default for customer storefront login
    return '/account'
  }

  // If already authenticated, redirect appropriately
  useEffect(() => {
    if (isLoggingOut) return
    if (isAuthenticated && user) {
      if (isAdminLogin) {
        if (user.role === 'admin') {
          navigate(requestedRedirect?.startsWith('/admin') ? requestedRedirect : '/admin', { replace: true })
        } else {
          setErrorMessage('Access denied. Your active account is not an administrator.')
        }
      } else {
        navigate(getRedirectDestination(user), { replace: true })
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user, isAdminLogin, isLoggingOut])

  if (isLoggingOut) {
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (tab === 'register' && password !== confirmPassword) {
      setErrorMessage('Passwords do not match.')
      return
    }

    setIsLoading(true)

    try {
      if (tab === 'login') {
        const loggedInUser = await login(email, password)
        if (isAdminLogin) {
          if (loggedInUser.role === 'admin') {
            showToast('Administrator Authenticated', 'Access granted to management console.', 'success')
            navigate('/admin', { replace: true })
          } else {
            logout()
            setErrorMessage('Access denied. This account does not possess administrator privileges.')
          }
        } else {
          showToast('Signed In', 'Welcome back.', 'success')
          navigate(getRedirectDestination(loggedInUser), { replace: true })
        }
      } else if (tab === 'register') {
        const newUser = await register(name, email, password)
        showToast('Account Created', 'Your account has been created.', 'success')
        navigate(getRedirectDestination(newUser), { replace: true })
      } else {
        showToast('Instructions Sent', 'If an account exists with this email, password reset instructions have been sent.', 'info')
        setTab('login')
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please check your credentials.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSuccess = async (credentialResponse: any) => {
    if (!credentialResponse.credential) {
      setErrorMessage('Google did not return credentials.')
      return
    }

    setIsLoading(true)
    setErrorMessage(null)
    try {
      const loggedInUser = await loginWithGoogle(credentialResponse.credential)
      if (isAdminLogin) {
        if (loggedInUser.role === 'admin') {
          showToast('Administrator Authenticated', 'Access granted to management console.', 'success')
          navigate('/admin', { replace: true })
        } else {
          logout()
          setErrorMessage('Access denied. This Google account does not possess administrator privileges.')
        }
      } else {
        showToast('Signed In', 'Signed in with Google.', 'success')
        navigate(getRedirectDestination(loggedInUser), { replace: true })
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Google authentication failed.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 pt-8 sm:pt-12 pb-16 sm:pb-20">
      {/* Brand Header */}
      <div className="text-center mb-8">
        <span className="text-xs font-semibold uppercase tracking-[0.25em] text-foreground">
          {isAdminLogin ? 'GM FURNITURE — MANAGEMENT' : 'GM FURNITURE'}
        </span>
        <h1 className="text-2xl font-light tracking-tight text-foreground mt-3">
          {isAdminLogin ? 'Administrator Sign In' : (
            tab === 'login' ? 'Welcome Back' : tab === 'register' ? 'Get Started' : 'Account Recovery'
          )}
        </h1>
        <p className="text-xs text-muted mt-2">
          {isAdminLogin ? 'Restricted console. Sign in with administrative credentials.' : (
            tab === 'login' ? 'Sign in to continue.' : tab === 'register' ? 'Create your account.' : 'Enter your email address to reset your password.'
          )}
        </p>
      </div>

      {/* Switcher Tabs (Only for customer portal) */}
      {!isAdminLogin && tab !== 'forgot' && (
        <div className="grid grid-cols-2 border-b border-border mb-6 text-xs uppercase tracking-wider font-medium">
          <button
            onClick={() => {
              setTab('login')
              setErrorMessage(null)
            }}
            className={`pb-3 transition-colors ${
              tab === 'login'
                ? 'border-b-2 border-foreground text-foreground font-semibold'
                : 'text-muted hover:text-foreground'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => {
              setTab('register')
              setErrorMessage(null)
            }}
            className={`pb-3 transition-colors ${
              tab === 'register'
                ? 'border-b-2 border-foreground text-foreground font-semibold'
                : 'text-muted hover:text-foreground'
            }`}
          >
            Register
          </button>
        </div>
      )}

      {/* Form Card */}
      <div className="bg-surface border border-border p-6 sm:p-8">
        {errorMessage && (
          <div className="mb-5 p-3.5 bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {/* Google OAuth Section */}
        {tab !== 'forgot' && (
          <div className="mb-6">
            {googleClientId ? (
              <div className="flex justify-center w-full">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setErrorMessage('Google Sign-In was cancelled or failed.')}
                  theme="outline"
                  size="large"
                  text="continue_with"
                  shape="rectangular"
                  width="100%"
                />
              </div>
            ) : (
              <div className="p-3 bg-white border border-border text-center">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(
                      'Google OAuth requires GOOGLE_CLIENT_ID and VITE_GOOGLE_CLIENT_ID in your .env file.'
                    )
                  }}
                  className="w-full flex items-center justify-center gap-3 py-2 text-xs font-medium text-foreground hover:bg-zinc-50 transition-colors"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.27-2.09 3.665-5.17 3.665-9.12z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.13C3.26 21.36 7.33 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.13z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.13c.95-2.83 3.6-4.96 6.72-4.96z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </button>
              </div>
            )}

            <div className="relative my-6 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <span className="relative px-3 bg-surface text-[10px] uppercase tracking-widest text-muted">
                OR CONTINUE WITH EMAIL
              </span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {tab === 'register' && (
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-muted mb-1">
                Full Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your Name"
                  className="w-full h-10 bg-background border border-border pl-9 pr-3 text-xs focus:border-foreground focus:outline-none"
                />
                <User className="w-4 h-4 absolute left-3 top-3 text-muted" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wider text-muted mb-1">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full h-10 bg-background border border-border pl-9 pr-3 text-xs focus:border-foreground focus:outline-none"
              />
              <Mail className="w-4 h-4 absolute left-3 top-3 text-muted" />
            </div>
          </div>

          {tab !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-medium uppercase tracking-wider text-muted">
                  Password
                </label>
                {tab === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      setTab('forgot')
                      setErrorMessage(null)
                    }}
                    className="text-[10px] text-muted hover:text-foreground underline"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full h-10 bg-background border border-border pl-9 pr-3 text-xs focus:border-foreground focus:outline-none"
                />
                <Lock className="w-4 h-4 absolute left-3 top-3 text-muted" />
              </div>
            </div>
          )}

          {tab === 'register' && (
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-muted mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full h-10 bg-background border border-border pl-9 pr-3 text-xs focus:border-foreground focus:outline-none"
                />
                <Lock className="w-4 h-4 absolute left-3 top-3 text-muted" />
              </div>
            </div>
          )}

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isLoading}
              className="w-full text-xs uppercase tracking-widest font-semibold"
            >
              {tab === 'login' && 'Sign In'}
              {tab === 'register' && 'Register'}
              {tab === 'forgot' && 'Send Instructions'}
            </Button>
          </div>
        </form>

        {tab === 'forgot' && (
          <div className="mt-6 pt-4 border-t border-border text-center">
            <button
              type="button"
              onClick={() => {
                setTab('login')
                setErrorMessage(null)
              }}
              className="text-xs text-muted hover:text-foreground underline"
            >
              &larr; Return to Sign In
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
