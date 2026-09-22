import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Lock, Mail, User, ArrowRight, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/context/ToastContext'

export const AuthPage: React.FC = () => {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [tab, setTab] = useState<'login' | 'register' | 'forgot'>('login')
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')

  const handleDemoFill = () => {
    setEmail('aditya.mehta@studioarch.in')
    setPassword('atelier2026')
    setName('Aditya Mehta')
    showToast('Demo Credentials Filled', 'Ready to sign in to client portal.', 'info')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    setTimeout(() => {
      setIsLoading(false)
      if (tab === 'login') {
        showToast('Signed In', 'Welcome back to GM Atelier Client Portal.', 'success')
        navigate('/account')
      } else if (tab === 'register') {
        showToast('Account Created', 'Your client profile is initialized.', 'success')
        navigate('/account')
      } else {
        showToast('Reset Link Dispatched', 'Check your email inbox for password recovery.', 'info')
        setTab('login')
      }
    }, 1000)
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16 sm:py-24">
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
            onClick={() => setTab('login')}
            className={`pb-3 transition-colors ${
              tab === 'login'
                ? 'border-b-2 border-foreground text-foreground font-semibold'
                : 'text-muted hover:text-foreground'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setTab('register')}
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
                placeholder="name@studioarch.in"
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
                    onClick={() => setTab('forgot')}
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

        {/* Demo Fast Autofill */}
        {tab === 'login' && (
          <div className="mt-6 pt-4 border-t border-border">
            <button
              type="button"
              onClick={handleDemoFill}
              className="w-full py-2 bg-background border border-border hover:border-foreground text-[11px] text-muted hover:text-foreground uppercase tracking-wider font-medium transition-colors"
            >
              Use Demo Client Credentials
            </button>
          </div>
        )}

        {tab === 'forgot' && (
          <div className="mt-6 pt-4 border-t border-border text-center">
            <button
              type="button"
              onClick={() => setTab('login')}
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
