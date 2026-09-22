import React from 'react'
import { NavLink, Link } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  FolderTree,
  Boxes,
  Home,
  Layers,
  ShoppingBag,
  Users,
  FileText,
  BarChart3,
  Settings,
  ExternalLink,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface AdminSidebarProps {
  onItemClick?: () => void
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ onItemClick }) => {
  const navItems = [
    { label: 'Overview', href: '/admin', icon: LayoutDashboard, exact: true },
    { label: 'Products', href: '/admin/products', icon: Package },
    { label: 'Categories', href: '/admin/categories', icon: FolderTree },
    { label: 'Collections', href: '/admin/collections', icon: Layers },
    { label: 'Rooms Curations', href: '/admin/rooms', icon: Home },
    { label: 'Inventory Stock', href: '/admin/inventory', icon: Boxes },
    { label: 'Customer Orders', href: '/admin/orders', icon: ShoppingBag },
    { label: 'Customer CRM', href: '/admin/customers', icon: Users },
    { label: 'GST Invoices', href: '/admin/invoices', icon: FileText },
    { label: 'Analytics & KPIs', href: '/admin/analytics', icon: BarChart3 },
    { label: 'Store Settings', href: '/admin/settings', icon: Settings },
  ]

  return (
    <aside className="w-64 h-full bg-background border-r border-border flex flex-col justify-between">
      {/* Brand Header */}
      <div>
        <div className="h-16 px-6 flex items-center justify-between border-b border-border">
          <Link to="/admin" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-foreground text-background font-semibold flex items-center justify-center text-xs tracking-wider">
              GM
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-foreground block">
                Atelier Admin
              </span>
              <span className="text-[10px] text-muted tracking-wider block">
                v1.0 (Phase 1)
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation list */}
        <div className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-8rem)]">
          <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted">
            Management
          </div>
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.href}
                to={item.href}
                end={item.exact}
                onClick={onItemClick}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2 text-xs font-medium transition-colors',
                    isActive
                      ? 'bg-surface text-foreground font-semibold border-l-2 border-foreground'
                      : 'text-muted hover:text-foreground hover:bg-surface/50'
                  )
                }
              >
                <Icon className="w-4 h-4 shrink-0 stroke-[1.75]" />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </div>
      </div>

      {/* Footer Switcher */}
      <div className="p-4 border-t border-border bg-surface/50">
        <Link
          to="/"
          target="_blank"
          className="flex items-center justify-between text-xs text-muted hover:text-foreground transition-colors p-2 bg-background border border-border"
        >
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-medium text-[11px] uppercase tracking-wider">Live Storefront</span>
          </span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>
    </aside>
  )
}
