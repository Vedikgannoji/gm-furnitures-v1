import React from 'react'
import { Menu, Search, ShieldCheck } from 'lucide-react'

interface AdminHeaderProps {
  onMobileMenuToggle: () => void
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ onMobileMenuToggle }) => {
  return (
    <header className="h-16 bg-background border-b border-border px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button
          onClick={onMobileMenuToggle}
          className="lg:hidden p-2 text-muted hover:text-foreground transition-colors"
          aria-label="Toggle admin sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Admin Search Bar */}
        <div className="relative hidden sm:block w-72">
          <input
            type="text"
            placeholder="Search orders, SKU, customers..."
            className="w-full h-9 bg-surface pl-8 pr-3 text-xs border border-border focus:border-foreground focus:outline-none placeholder:text-muted"
          />
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-3 text-muted" />
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Minimal clean header */}
      </div>
    </header>
  )
}
