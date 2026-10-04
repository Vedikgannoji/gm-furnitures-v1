import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Check } from 'lucide-react'
import { useToast } from '@/context/ToastContext'

export const Footer: React.FC = () => {
  const { showToast } = useToast()
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 sm:gap-10 pb-12 sm:pb-14 border-b border-border">
          {/* Brand Manifesto */}
          <div className="lg:col-span-2 pr-0 lg:pr-8">
            <Link to="/" className="inline-block">
              <span className="text-sm font-semibold tracking-[0.25em] uppercase text-foreground">
                GM FURNITURE
              </span>
            </Link>
            <p className="mt-3 text-xs text-muted leading-relaxed max-w-sm">
              Handcrafted solid wood furniture and architectural interiors by GM Group. Designed for modern living spaces across India.
            </p>

            <div className="mt-6">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-foreground mb-1.5">
                Newsletter & Updates
              </p>
              <p className="text-xs text-muted mb-3">
                Receive invitations to new furniture releases and interior design updates.
              </p>
              <form onSubmit={handleSubscribe} className="flex max-w-sm">
                <input
                  type="email"
                  required
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-surface border border-border border-r-0 px-3 py-2 text-xs text-foreground placeholder:text-muted focus:outline-none focus:border-foreground flex-1"
                />
                <button
                  type="submit"
                  className="bg-foreground text-background px-4 py-2 text-xs uppercase tracking-wider font-medium hover:bg-black/80 transition-colors flex items-center gap-1 shrink-0"
                >
                  {subscribed ? <Check className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
                </button>
              </form>
            </div>
          </div>

          {/* Shop */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-foreground mb-4">
              Catalog
            </h4>
            <ul className="space-y-2.5 text-xs text-muted">
              <li>
                <Link to="/shop" className="hover:text-foreground transition-colors">
                  All Furniture
                </Link>
              </li>
              <li>
                <Link to="/shop/sofas" className="hover:text-foreground transition-colors">
                  Sofas & Sectionals
                </Link>
              </li>
              <li>
                <Link to="/shop/chairs" className="hover:text-foreground transition-colors">
                  Lounge Chairs
                </Link>
              </li>
              <li>
                <Link to="/shop/tables" className="hover:text-foreground transition-colors">
                  Coffee & Side Tables
                </Link>
              </li>
              <li>
                <Link to="/shop/dining" className="hover:text-foreground transition-colors">
                  Dining Tables & Chairs
                </Link>
              </li>
              <li>
                <Link to="/shop/beds" className="hover:text-foreground transition-colors">
                  Beds & Headboards
                </Link>
              </li>
              <li>
                <Link to="/shop/storage" className="hover:text-foreground transition-colors">
                  Storage & Credenzas
                </Link>
              </li>
            </ul>
          </div>

          {/* Rooms & Collections */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-foreground mb-4">
              Curations
            </h4>
            <ul className="space-y-2.5 text-xs text-muted">
              <li>
                <Link to="/rooms" className="hover:text-foreground transition-colors flex items-center justify-between">
                  <span>Shop by Room</span>
                  <span className="text-[9px] uppercase px-1.5 py-0.5 bg-zinc-100 text-zinc-500 font-medium">Soon</span>
                </Link>
              </li>
              <li>
                <Link to="/rooms" className="hover:text-foreground transition-colors flex items-center justify-between">
                  <span>Living & Dining Rooms</span>
                  <span className="text-[9px] uppercase px-1.5 py-0.5 bg-zinc-100 text-zinc-500 font-medium">Soon</span>
                </Link>
              </li>
              <li>
                <Link to="/rooms" className="hover:text-foreground transition-colors flex items-center justify-between">
                  <span>Bedroom & Studio</span>
                  <span className="text-[9px] uppercase px-1.5 py-0.5 bg-zinc-100 text-zinc-500 font-medium">Soon</span>
                </Link>
              </li>
              <li>
                <Link to="/collections" className="hover:text-foreground transition-colors flex items-center justify-between">
                  <span>Signature Collections</span>
                  <span className="text-[9px] uppercase px-1.5 py-0.5 bg-zinc-100 text-zinc-500 font-medium">Soon</span>
                </Link>
              </li>
              <li>
                <Link to="/collections" className="hover:text-foreground transition-colors flex items-center justify-between">
                  <span>The Minimalist Line</span>
                  <span className="text-[9px] uppercase px-1.5 py-0.5 bg-zinc-100 text-zinc-500 font-medium">Soon</span>
                </Link>
              </li>
              <li>
                <Link to="/collections" className="hover:text-foreground transition-colors flex items-center justify-between">
                  <span>Nordic Atelier</span>
                  <span className="text-[9px] uppercase px-1.5 py-0.5 bg-zinc-100 text-zinc-500 font-medium">Soon</span>
                </Link>
              </li>
              <li>
                <Link to="/collections" className="hover:text-foreground transition-colors flex items-center justify-between">
                  <span>Architectural Series</span>
                  <span className="text-[9px] uppercase px-1.5 py-0.5 bg-zinc-100 text-zinc-500 font-medium">Soon</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Support & Legal */}
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
                <Link to="/policies/shipping" className="hover:text-foreground transition-colors">
                  White-Glove Shipping
                </Link>
              </li>
              <li>
                <Link to="/policies/returns" className="hover:text-foreground transition-colors">
                  Returns & Guarantee
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
                <Link to="/faq" className="hover:text-foreground transition-colors">
                  Care & FAQ
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
          <p>© {new Date().getFullYear()} GM Furniture Atelier. All rights reserved.</p>
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
