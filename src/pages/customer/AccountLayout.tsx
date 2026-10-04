import React from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { User, ShoppingBag, Heart, MapPin, LogOut } from 'lucide-react'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'

export const AccountLayout: React.FC = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const navItems = [
    { label: 'Account Overview', href: '/account', icon: User, exact: true },
    { label: 'Order History', href: '/account/orders', icon: ShoppingBag },
    { label: 'Wishlist', href: '/account/wishlist', icon: Heart },
    { label: 'Delivery Addresses', href: '/account/addresses', icon: MapPin },
  ]

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-12 sm:pb-16">
      <Breadcrumbs items={[{ label: 'Account' }]} className="mb-3 sm:mb-4" />

      {/* Account Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-border mb-6 sm:mb-8 gap-4">
        <div>
          <span className="editorial-badge text-muted">Account</span>
          <h1 className="text-2xl sm:text-3xl font-light text-foreground mt-1">
            {user?.name || 'Account'}
          </h1>
          <p className="text-xs text-muted mt-0.5">
            {user?.email}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Navigation Sidebar */}
        <aside className="lg:col-span-3 bg-surface border border-border p-4">
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.href}
                  to={item.href}
                  end={item.exact}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2.5 text-xs font-medium transition-colors',
                      isActive
                        ? 'bg-background text-foreground font-semibold border-l-2 border-foreground shadow-sm'
                        : 'text-muted hover:text-foreground hover:bg-background/50'
                    )
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </NavLink>
              )
            })}
          </nav>

          {/* Sign Out at bottom of sidebar separated by divider */}
          <div className="mt-4 pt-3 border-t border-border">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-muted hover:text-foreground hover:bg-background/50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>

          {/* Simple Contact Us block */}
          <div className="mt-6 pt-4 border-t border-border/60">
            <span className="text-[10px] uppercase tracking-widest text-muted block mb-1">
              Need Assistance?
            </span>
            <NavLink
              to="/contact"
              className="text-xs font-medium text-foreground hover:underline inline-flex items-center gap-1 mt-1"
            >
              <span>CONTACT US &rarr;</span>
            </NavLink>
          </div>
        </aside>

        {/* Content Area */}
        <main className="lg:col-span-9">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
