import React from 'react'
import { Link } from 'react-router-dom'
import { Drawer } from '@/components/ui/Drawer'
import { mockCategories, mockRooms, mockCollections } from '@/data/mockData'
import { ArrowRight, User, Heart, LogOut } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { ComingSoonBadge } from '@/components/ui/ComingSoon'

export interface MobileNavDrawerProps {
  isOpen: boolean
  onClose: () => void
}

export const MobileNavDrawer: React.FC<MobileNavDrawerProps> = ({ isOpen, onClose }) => {
  const { user, isAuthenticated, logout } = useAuth()
  return (
    <Drawer isOpen={isOpen} onClose={onClose} position="left" title="Navigation" width="max-w-xs">
      <div className="flex flex-col space-y-6 pt-2 pb-8">
        {/* Main Nav Links */}
        <div className="flex flex-col space-y-3">
          <Link
            to="/shop"
            onClick={onClose}
            className="text-sm uppercase tracking-widest font-medium text-foreground hover:text-muted flex items-center justify-between py-1"
          >
            <span>All Furniture</span>
            <ArrowRight className="w-4 h-4 text-muted" />
          </Link>
          <div className="py-2 flex items-center justify-between border-b border-border/40 select-none">
            <div className="flex flex-col items-start">
              <span className="text-sm uppercase tracking-widest font-medium text-foreground">
                Rooms
              </span>
              <ComingSoonBadge className="mt-1 !text-[8px] !px-1.5 !py-0.5" />
            </div>
          </div>
          <div className="py-2 flex items-center justify-between border-b border-border/40 select-none">
            <div className="flex flex-col items-start">
              <span className="text-sm uppercase tracking-widest font-medium text-foreground">
                Collections
              </span>
              <ComingSoonBadge className="mt-1 !text-[8px] !px-1.5 !py-0.5" />
            </div>
          </div>
        </div>

        {/* Categories Section */}
        <div className="border-t border-border pt-4">
          <p className="text-[10px] uppercase tracking-widest font-semibold text-muted mb-3">
            Shop by Category
          </p>
          <div className="grid grid-cols-1 gap-2">
            {mockCategories.map((cat) => (
              <Link
                key={cat.id}
                to={`/shop/${cat.slug}`}
                onClick={onClose}
                className="text-xs text-foreground/80 hover:text-foreground py-1 flex items-center justify-between"
              >
                <span>{cat.name}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Rooms Section */}
        <div className="border-t border-border pt-4">
          <p className="text-[10px] uppercase tracking-widest font-semibold text-muted mb-3 flex items-center justify-between">
            <span>Inspiration by Room</span>
            <ComingSoonBadge />
          </p>
          <div className="grid grid-cols-1 gap-2">
            {mockRooms.map((room) => (
              <div
                key={room.id}
                className="text-xs text-muted/70 py-1 flex items-center justify-between select-none"
              >
                <span>{room.name}</span>
                <span className="text-[9px] text-zinc-400 uppercase tracking-wider">Soon</span>
              </div>
            ))}
          </div>
          <div className="mt-2 pt-2 border-t border-border/50">
            <Link
              to="/rooms"
              onClick={onClose}
              className="text-[11px] text-muted hover:text-foreground flex items-center justify-between"
            >
              <span>Explore Room Preview</span>
              <span className="text-[9px] uppercase tracking-wider">Coming Soon &rarr;</span>
            </Link>
          </div>
        </div>

        {/* Collections Section */}
        <div className="border-t border-border pt-4">
          <p className="text-[10px] uppercase tracking-widest font-semibold text-muted mb-3 flex items-center justify-between">
            <span>Featured Collections</span>
            <ComingSoonBadge />
          </p>
          <div className="grid grid-cols-1 gap-2">
            {mockCollections.map((col) => (
              <div
                key={col.id}
                className="text-xs text-muted/70 py-1 flex items-center justify-between select-none"
              >
                <span>{col.name}</span>
                <span className="text-[9px] text-zinc-400 uppercase tracking-wider">Soon</span>
              </div>
            ))}
          </div>
          <div className="mt-2 pt-2 border-t border-border/50">
            <Link
              to="/collections"
              onClick={onClose}
              className="text-[11px] text-muted hover:text-foreground flex items-center justify-between"
            >
              <span>Explore Collections Preview</span>
              <span className="text-[9px] uppercase tracking-wider">Coming Soon &rarr;</span>
            </Link>
          </div>
        </div>

        {/* Account & Wishlist */}
        <div className="border-t border-border pt-4 flex flex-col space-y-3">
          {isAuthenticated ? (
            <>
              <Link
                to="/account"
                onClick={onClose}
                className="flex items-center gap-2.5 text-xs text-foreground hover:text-muted py-1"
              >
                <User className="w-4 h-4 text-muted" />
                <span>My Account ({user?.name})</span>
              </Link>
              <Link
                to="/account/wishlist"
                onClick={onClose}
                className="flex items-center gap-2.5 text-xs text-foreground hover:text-muted py-1"
              >
                <Heart className="w-4 h-4 text-muted" />
                <span>Wishlist</span>
              </Link>
              <button
                onClick={() => {
                  logout()
                  onClose()
                }}
                className="flex items-center gap-2.5 text-xs text-muted hover:text-foreground py-1 text-left"
              >
                <LogOut className="w-4 h-4 text-muted" />
                <span>Sign Out</span>
              </button>
            </>
          ) : (
            <Link
              to="/auth"
              onClick={onClose}
              className="flex items-center justify-between p-2.5 bg-foreground text-background text-xs uppercase tracking-wider font-semibold hover:bg-black/85 transition-colors"
            >
              <span>Sign In to Account</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>

        {/* Secondary Info */}
        <div className="border-t border-border pt-4 text-[11px] text-muted space-y-1.5">
          <Link to="/about" onClick={onClose} className="block hover:text-foreground">
            About Us
          </Link>
          <Link to="/contact" onClick={onClose} className="block hover:text-foreground">
            Contact Us
          </Link>
          <Link to="/faq" onClick={onClose} className="block hover:text-foreground">
            Frequently Asked Questions
          </Link>
        </div>
      </div>
    </Drawer>
  )
}
