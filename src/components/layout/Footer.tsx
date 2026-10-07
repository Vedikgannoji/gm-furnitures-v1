import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Check } from 'lucide-react'
import { useToast } from '@/context/ToastContext'
import { useSettings } from '@/context/SettingsContext'

export const Footer: React.FC = () => {
  const { showToast } = useToast()
  const { settings } = useSettings()
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault()
    if (email) {
      setSubscribed(true)
      showToast('Subscribed', 'Thank you for subscribing to our newsletter.', 'success')
      setEmail('')
    }
  }

  return (
    <footer className="bg-background border-t border-border pt-12 sm:pt-14 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 pb-12 sm:pb-14 border-b border-border">
          {/* Brand Manifesto */}
          <div className="lg:col-span-2 pr-0 lg:pr-8">
            <Link to="/" className="inline-block">
              <span className="text-sm font-semibold tracking-[0.25em] uppercase text-foreground">
                {settings.storeName || 'GM FURNITURE'}
              </span>
            </Link>
            <p className="mt-3 text-xs text-muted leading-relaxed max-w-sm">
              Handcrafted solid wood furniture and architectural interiors by GM Group. Designed for modern living spaces across India.
            </p>
            {settings.gstin && (
              <p className="mt-2 text-[11px] text-muted tracking-wider">
                GSTIN: <span className="font-mono text-foreground font-medium">{settings.gstin}</span>
              </p>
            )}

            <div className="mt-6">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-foreground mb-1.5">
                Newsletter & Updates
              </p>
              <p className="text-xs text-muted mb-3">
                Receive invitations to new furniture releases and interior design updates.
              </p>
              <form onSubmit={handleSubscribe} className="flex w-full max-w-sm">
                <input
                  type="email"
                  required
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-surface border border-border border-r-0 px-3 py-2 text-xs text-foreground placeholder:text-muted focus:outline-none focus:border-foreground flex-1 min-w-0"
                />
                <button
                  type="submit"
                  className="bg-foreground text-background px-4 py-2 text-xs uppercase tracking-wider font-medium hover:bg-black/80 transition-colors flex items-center justify-center shrink-0 min-w-[44px]"
                  aria-label="Subscribe to newsletter"
                >
                  {subscribed ? <Check className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
                </button>
              </form>
            </div>
          </div>

          {/* Collection */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-foreground mb-4">
              Collection
            </h4>
            <ul className="space-y-2.5 text-xs text-muted">
              <li>
                <Link to="/shop" className="hover:text-foreground transition-colors">
                  View Total Collection
                </Link>
              </li>
              <li>
                <Link to="/shop" className="hover:text-foreground transition-colors">
                  New Arrivals
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Support & Policies */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-foreground mb-4">
              Customer Support & Policies
            </h4>
            <ul className="space-y-2.5 text-xs text-muted">
              <li>
                <Link to="/account" className="hover:text-foreground transition-colors">
                  My Orders & Account
                </Link>
              </li>
              <li>
                <Link to="/policies/privacy" className="hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/policies/terms" className="hover:text-foreground transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-foreground transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between text-[11px] text-muted space-y-4 md:space-y-0">
          <p>© {new Date().getFullYear()} {settings.storeName || 'GM Furniture'}. All rights reserved.</p>
          <div className="flex items-center space-x-6">
            <a
              href="https://www.instagram.com/gm_interiors9/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors flex items-center gap-1 font-medium"
              aria-label="GM Interiors on Instagram"
            >
              <span>Instagram (@gm_interiors9)</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
