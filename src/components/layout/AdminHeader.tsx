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
        {/* Admin Badge & Avatar - Clean, no notification bell */}
        <div className="flex items-center gap-2.5 pl-3 border-l border-border">
          <div className="w-7 h-7 rounded-full bg-surface border border-border flex items-center justify-center text-xs font-semibold text-foreground">
            AD
          </div>
          <div className="hidden md:block text-left">
            <p className="text-xs font-medium text-foreground leading-none">
              Administrator
            </p>
            <p className="text-[10px] text-muted tracking-wider uppercase mt-1 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              <span>Full Access</span>
            </p>
          </div>
        </div>
      </div>
    </header>
  )
}
