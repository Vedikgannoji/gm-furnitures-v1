import React from 'react'
import { Link } from 'react-router-dom'
import { Drawer } from '@/components/ui/Drawer'
import { mockCategories, mockRooms, mockCollections } from '@/data/mockData'
import { ArrowRight, User, Heart, ShieldCheck } from 'lucide-react'

export interface MobileNavDrawerProps {
  isOpen: boolean
  onClose: () => void
}

export const MobileNavDrawer: React.FC<MobileNavDrawerProps> = ({ isOpen, onClose }) => {
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
          <Link
            to="/rooms"
            onClick={onClose}
            className="text-sm uppercase tracking-widest font-medium text-foreground hover:text-muted flex items-center justify-between py-1"
          >
            <div className="flex items-center gap-2">
              <span>Rooms</span>
              <span className="text-[9px] uppercase px-1.5 py-0.5 bg-zinc-100 text-zinc-500 font-medium tracking-wider">
                Soon
              </span>
            </div>
            <ArrowRight className="w-4 h-4 text-muted" />
          </Link>
          <Link
            to="/collections"
            onClick={onClose}
            className="text-sm uppercase tracking-widest font-medium text-foreground hover:text-muted flex items-center justify-between py-1"
          >
            <div className="flex items-center gap-2">
              <span>Collections</span>
              <span className="text-[9px] uppercase px-1.5 py-0.5 bg-zinc-100 text-zinc-500 font-medium tracking-wider">
                Soon
              </span>
            </div>
            <ArrowRight className="w-4 h-4 text-muted" />
          </Link>
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
                <span className="text-[10px] text-muted">({cat.itemCount})</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Rooms Section */}
        <div className="border-t border-border pt-4">
          <p className="text-[10px] uppercase tracking-widest font-semibold text-muted mb-3 flex items-center justify-between">
            <span>Inspiration by Room</span>
            <span className="text-[9px] px-1.5 py-0.5 bg-zinc-100 text-zinc-500 font-normal">Coming Soon</span>
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
            <span className="text-[9px] px-1.5 py-0.5 bg-zinc-100 text-zinc-500 font-normal">Coming Soon</span>
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
          <Link
            to="/account"
            onClick={onClose}
            className="flex items-center gap-2.5 text-xs text-foreground hover:text-muted py-1"
          >
            <User className="w-4 h-4 text-muted" />
            <span>My Account & Orders</span>
          </Link>
          <Link
            to="/account/wishlist"
            onClick={onClose}
            className="flex items-center gap-2.5 text-xs text-foreground hover:text-muted py-1"
          >
            <Heart className="w-4 h-4 text-muted" />
            <span>Curated Wishlist</span>
          </Link>
          <Link
            to="/admin"
            onClick={onClose}
            className="flex items-center gap-2.5 text-xs font-medium text-foreground bg-surface p-2 border border-border mt-2"
          >
            <ShieldCheck className="w-4 h-4 text-muted" />
            <span>Admin SaaS Portal</span>
          </Link>
        </div>

        {/* Secondary Info */}
        <div className="border-t border-border pt-4 text-[11px] text-muted space-y-1.5">
          <Link to="/about" onClick={onClose} className="block hover:text-foreground">
            About Atelier
          </Link>
          <Link to="/contact" onClick={onClose} className="block hover:text-foreground">
            Concierge & Contact
          </Link>
          <Link to="/faq" onClick={onClose} className="block hover:text-foreground">
            Frequently Asked Questions
          </Link>
        </div>
      </div>
    </Drawer>
  )
}
