import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Lock, Mail, User, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/context/ToastContext'
import { useAuth } from '@/context/AuthContext'
import { GoogleLogin } from '@react-oauth/google'

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

export const AuthPage: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { showToast } = useToast()
  const { login, register, loginWithGoogle, isAuthenticated } = useAuth()

  const [tab, setTab] = useState<'login' | 'register' | 'forgot'>('login')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')

  const redirectUrl = searchParams.get('redirect') || '/account'

  // If already authenticated, redirect
  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectUrl, { replace: true })
    }
  }, [isAuthenticated, navigate, redirectUrl])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setIsLoading(true)

    try {
      if (tab === 'login') {
        await login(email, password)
        showToast('Signed In', 'Welcome back to your GM Atelier account.', 'success')
        navigate(redirectUrl, { replace: true })
      } else if (tab === 'register') {
        await register(name, email, password)
        showToast('Account Created', 'Welcome to GM Furniture. Your profile is ready.', 'success')
        navigate(redirectUrl, { replace: true })
      } else {
        // Forgot password note
        showToast('Recovery Link Dispatched', 'If this email exists, password reset instructions have been sent.', 'info')
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
      await loginWithGoogle(credentialResponse.credential)
      showToast('Google Sign-In Successful', 'Authenticated with Google account.', 'success')
      navigate(redirectUrl, { replace: true })
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
          GM FURNITURE
        </span>
        <h1 className="text-2xl font-light tracking-tight text-foreground mt-3">
          {tab === 'login' && 'Client Portal Access'}
          {tab === 'register' && 'Create Client Account'}
          {tab === 'forgot' && 'Account Recovery'}
        </h1>
        <p className="text-xs text-muted mt-2">
          {tab === 'login' && 'Manage your architectural orders, white-glove deliveries, and curated wishlist.'}
          {tab === 'register' && 'Join GM Atelier to save spatial room plans and access private editions.'}
          {tab === 'forgot' && 'Enter your registered email to receive a secure restoration token.'}
        </p>
      </div>

      {/* Switcher Tabs */}
      {tab !== 'forgot' && (
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
                  text={tab === 'login' ? 'signin_with' : 'signup_with'}
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
                      'Google OAuth requires GOOGLE_CLIENT_ID and VITE_GOOGLE_CLIENT_ID in your .env file. Please add your Google Client ID to enable instant Google Sign-In.'
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
                Or Continue With Email
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
                  placeholder="e.g. Aditya Mehta"
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
                placeholder="name@company.com"
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

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isLoading}
              className="w-full text-xs uppercase tracking-widest font-semibold"
            >
              {tab === 'login' && 'Sign In to Account'}
              {tab === 'register' && 'Create Client Profile'}
              {tab === 'forgot' && 'Dispatch Recovery Email'}
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
