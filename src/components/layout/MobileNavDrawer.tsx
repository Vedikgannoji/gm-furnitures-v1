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
            <span>Rooms</span>
            <ArrowRight className="w-4 h-4 text-muted" />
          </Link>
          <Link
            to="/collections"
            onClick={onClose}
            className="text-sm uppercase tracking-widest font-medium text-foreground hover:text-muted flex items-center justify-between py-1"
          >
            <span>Collections</span>
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
          <p className="text-[10px] uppercase tracking-widest font-semibold text-muted mb-3">
            Inspiration by Room
          </p>
          <div className="grid grid-cols-1 gap-2">
            {mockRooms.map((room) => (
              <Link
                key={room.id}
                to={`/rooms/${room.slug}`}
                onClick={onClose}
                className="text-xs text-foreground/80 hover:text-foreground py-1"
              >
                {room.name}
              </Link>
            ))}
          </div>
        </div>

        {/* Collections Section */}
        <div className="border-t border-border pt-4">
          <p className="text-[10px] uppercase tracking-widest font-semibold text-muted mb-3">
            Featured Collections
          </p>
          <div className="grid grid-cols-1 gap-2">
            {mockCollections.map((col) => (
              <Link
                key={col.id}
                to={`/collections/${col.slug}`}
                onClick={onClose}
                className="text-xs text-foreground/80 hover:text-foreground py-1"
              >
                {col.name}
              </Link>
            ))}
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
