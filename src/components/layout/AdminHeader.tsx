import React from 'react'
import { Link } from 'react-router-dom'
import { Menu, Search, ExternalLink } from 'lucide-react'

interface AdminHeaderProps {
  onMobileMenuToggle: () => void
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ onMobileMenuToggle }) => {
  return (
    <header className="h-14 sm:h-16 bg-background border-b border-border px-3 sm:px-8 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={onMobileMenuToggle}
          className="lg:hidden w-10 h-10 flex items-center justify-center text-foreground hover:text-muted transition-colors rounded active:bg-zinc-100"
          aria-label="Toggle admin sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Mobile Logo Brand */}
        <Link to="/admin" className="lg:hidden flex items-center gap-2">
          <img src="/logo.png" alt="GM Logo" className="h-6 w-auto object-contain" />
          <span className="text-xs font-semibold tracking-widest uppercase text-foreground">
            ADMIN
          </span>
        </Link>

        {/* Global Admin Search Bar (Desktop/Tablet) */}
        <div className="relative hidden sm:block w-72">
          <input
            type="text"
            placeholder="Search orders, SKU, customers..."
            className="w-full h-9 bg-surface pl-8 pr-3 text-xs border border-border focus:border-foreground focus:outline-none placeholder:text-muted"
          />
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-3 text-muted" />
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <Link
          to="/"
          target="_blank"
          rel="noopener noreferrer"
          className="h-8 px-2.5 sm:px-3 text-[11px] font-medium uppercase tracking-wider text-muted hover:text-foreground hover:bg-surface border border-border flex items-center gap-1.5 transition-colors"
          title="Open live storefront in new tab"
        >
          <span>Storefront</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>
    </header>
  )
}
