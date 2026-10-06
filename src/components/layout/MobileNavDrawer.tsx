import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Drawer } from '@/components/ui/Drawer'
import { Category, Room, Collection } from '@/types'
import { ArrowRight, User, Heart, LogOut } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

export interface MobileNavDrawerProps {
  isOpen: boolean
  onClose: () => void
}

export const MobileNavDrawer: React.FC<MobileNavDrawerProps> = ({ isOpen, onClose }) => {
  const { user, isAuthenticated, logout } = useAuth()
  const [categories, setCategories] = useState<Category[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [collections, setCollections] = useState<Collection[]>([])

  useEffect(() => {
    let isMounted = true
    async function loadData() {
      try {
        const [cRes, rRes, colRes] = await Promise.all([
          fetch('/api/categories'),
          fetch('/api/rooms'),
          fetch('/api/collections'),
        ])
        if (isMounted) {
          if (cRes.ok) setCategories(await cRes.json())
          if (rRes.ok) setRooms(await rRes.json())
          if (colRes.ok) setCollections(await colRes.json())
        }
      } catch (err) {
        console.error('Failed to load mobile drawer taxonomy:', err)
      }
    }
    if (isOpen) {
      loadData()
    }
    return () => {
      isMounted = false
    }
  }, [isOpen])

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
          <div className="text-sm uppercase tracking-widest font-medium text-foreground flex items-center justify-between py-1 opacity-80 cursor-default select-none">
            <span>Rooms</span>
            <span className="bg-black text-white text-[8px] font-bold tracking-wider uppercase px-2 py-0.5 leading-none">
              COMING SOON
            </span>
          </div>
          <div className="text-sm uppercase tracking-widest font-medium text-foreground flex items-center justify-between py-1 opacity-80 cursor-default select-none">
            <span>Collections</span>
            <span className="bg-black text-white text-[8px] font-bold tracking-wider uppercase px-2 py-0.5 leading-none">
              COMING SOON
            </span>
          </div>
        </div>

        {/* Categories Section */}
        {categories.length > 0 && (
          <div className="border-t border-border pt-4">
            <p className="text-[10px] uppercase tracking-widest font-semibold text-muted mb-3">
              Shop by Category
            </p>
            <div className="grid grid-cols-1 gap-2">
              {categories.map((cat) => {
                const isDining = cat.slug?.toLowerCase() === 'dining' || cat.name?.toLowerCase() === 'dining'
                return isDining ? (
                  <Link
                    key={cat.id}
                    to="/shop?category=Dining"
                    onClick={onClose}
                    className="text-xs text-foreground font-medium py-1 flex items-center justify-between"
                  >
                    <span>{cat.name}</span>
                    <span className="text-[9px] text-emerald-700 font-semibold uppercase tracking-wider">Available</span>
                  </Link>
                ) : (
                  <div
                    key={cat.id}
                    className="text-xs text-zinc-400 py-1 flex items-center justify-between cursor-default select-none"
                  >
                    <span>{cat.name}</span>
                    <span className="bg-black text-white text-[7.5px] font-bold tracking-wider uppercase px-1.5 py-0.5 leading-none">
                      COMING SOON
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Rooms Section */}
        {rooms.length > 0 && (
          <div className="border-t border-border pt-4">
            <p className="text-[10px] uppercase tracking-widest font-semibold text-muted mb-3">
              Shop by Room
            </p>
            <div className="grid grid-cols-1 gap-2">
              {rooms.map((room) => {
                const isDining = room.slug?.toLowerCase().includes('dining') || room.name?.toLowerCase().includes('dining')
                return isDining ? (
                  <Link
                    key={room.id}
                    to="/shop?category=Dining"
                    onClick={onClose}
                    className="text-xs text-foreground font-medium py-1 flex items-center justify-between"
                  >
                    <span>{room.name}</span>
                    <span className="text-[9px] text-emerald-700 font-semibold uppercase tracking-wider">Available</span>
                  </Link>
                ) : (
                  <div
                    key={room.id}
                    className="text-xs text-zinc-400 py-1 flex items-center justify-between cursor-default select-none"
                  >
                    <span>{room.name}</span>
                    <span className="bg-black text-white text-[7.5px] font-bold tracking-wider uppercase px-1.5 py-0.5 leading-none">
                      COMING SOON
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Collections Section */}
        {collections.length > 0 && (
          <div className="border-t border-border pt-4">
            <p className="text-[10px] uppercase tracking-widest font-semibold text-muted mb-3">
              Collections
            </p>
            <div className="grid grid-cols-1 gap-2">
              {collections.map((col) => (
                <div
                  key={col.id}
                  className="text-xs text-zinc-400 py-1 flex items-center justify-between cursor-default select-none"
                >
                  <span>{col.name}</span>
                  <span className="bg-black text-white text-[7.5px] font-bold tracking-wider uppercase px-1.5 py-0.5 leading-none">
                    COMING SOON
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

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
