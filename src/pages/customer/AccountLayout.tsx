import React from 'react'
import { Outlet, NavLink, Link } from 'react-router-dom'
import { User, ShoppingBag, Heart, MapPin, LogOut } from 'lucide-react'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { cn } from '@/lib/utils'

export const AccountLayout: React.FC = () => {
  const navItems = [
    { label: 'Account Overview', href: '/account', icon: User, exact: true },
    { label: 'Order History', href: '/account/orders', icon: ShoppingBag },
    { label: 'Saved Wishlist', href: '/account/wishlist', icon: Heart },
    { label: 'Delivery Addresses', href: '/account/addresses', icon: MapPin },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-12 sm:pb-16">
      <Breadcrumbs items={[{ label: 'Client Account' }]} className="mb-3 sm:mb-4" />

      {/* Account Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-border mb-6 sm:mb-8 gap-4">
        <div>
          <span className="editorial-badge text-muted">Client Residence Portfolio</span>
          <h1 className="text-2xl sm:text-3xl font-light text-foreground mt-1">
            Aditya Mehta
          </h1>
          <p className="text-xs text-muted mt-0.5 font-mono">
            aditya.mehta@studioarch.in • Client ID: CL-8941
          </p>
        </div>
        <Link
          to="/login"
          className="text-xs text-muted hover:text-foreground flex items-center gap-1.5 self-start sm:self-auto underline"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </Link>
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
        </aside>

        {/* Content Outlet */}
        <div className="lg:col-span-9 min-w-0">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
