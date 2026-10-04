import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Search,
  ShoppingBag,
  Heart,
  User,
  Menu,
  ChevronDown,
  X,
} from 'lucide-react'
import { useCart } from '@/context/CartContext'
import { useWishlist } from '@/context/WishlistContext'
import { useAuth } from '@/context/AuthContext'
import { MobileNavDrawer } from './MobileNavDrawer'
import { mockCategories } from '@/data/mockData'

export const CustomerNavbar: React.FC = () => {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const { cartCount, setIsCartDrawerOpen } = useCart()
  const { wishlistCount } = useWishlist()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isShopHovered, setIsShopHovered] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setIsSearchOpen(false)
    }
  }

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-white border-b border-border shadow-[0_1px_0_0_#E5E5E5]">
        {/* Top minimal announcement banner */}
        <div className="bg-white text-center py-2 px-4 text-[10px] sm:text-[11px] font-medium tracking-[0.2em] uppercase text-zinc-600 border-b border-border">
          <span>FROM THE HOUSE OF GM GROUP · INTERIORS & CONSTRUCTIONS</span>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 -ml-2 text-foreground hover:text-muted transition-colors"
              aria-label="Open mobile menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="p-2 text-foreground hover:text-muted transition-colors"
              aria-label="Search catalog"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>

          {/* Brand Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2.5 sm:gap-3 group">
              <img
                src="/logo.png"
                alt="GM Logo"
                className="h-7 sm:h-8 w-auto object-contain shrink-0"
              />
              <div className="flex flex-col items-start text-left">
                <span className="text-sm sm:text-base font-semibold tracking-[0.2em] uppercase text-foreground leading-tight">
                  GM FURNITURE
                </span>
                <span className="text-[9px] tracking-[0.25em] uppercase text-muted font-light leading-tight">
                  ATELIER & LIVING
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8 text-xs uppercase tracking-widest font-medium text-foreground">
            {/* Shop with dropdown */}
            <div
              className="relative py-4"
              onMouseEnter={() => setIsShopHovered(true)}
              onMouseLeave={() => setIsShopHovered(false)}
            >
              <Link
                to="/shop"
                className="flex items-center gap-1 text-foreground hover:opacity-70 transition-opacity"
              >
                <span>Shop</span>
                <ChevronDown className="w-3 h-3 transition-transform duration-200" />
              </Link>

              {/* Mega Dropdown */}
              {isShopHovered && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 w-80 bg-white border border-border shadow-xl p-4 animate-slide-down">
                  <div className="text-[10px] font-semibold text-muted uppercase tracking-widest mb-2 pb-1 border-b border-border">
                    Furniture Categories
                  </div>
                  <div className="grid grid-cols-1 gap-1">
                    {mockCategories.map((cat) => (
                      <Link
                        key={cat.id}
                        to={`/shop/${cat.slug}`}
                        className="py-1.5 px-2 hover:bg-zinc-50 text-foreground text-xs flex justify-between items-center transition-colors"
                        onClick={() => setIsShopHovered(false)}
                      >
                        <span>{cat.name}</span>
                      </Link>
                    ))}
                    <div className="pt-2 mt-1 border-t border-border">
                      <Link
                        to="/shop"
                        className="text-xs font-semibold text-foreground underline-offset-4 hover:underline block text-center py-1"
                        onClick={() => setIsShopHovered(false)}
                      >
                        View Complete Catalog &rarr;
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col items-center justify-center cursor-not-allowed select-none py-1">
              <span className="text-xs uppercase tracking-widest font-medium text-foreground">
                Rooms
              </span>
              <span className="mt-0.5 text-[8px] font-semibold tracking-wider uppercase bg-zinc-100 text-zinc-500 border border-zinc-200/70 px-1.5 py-px leading-none">
                COMING SOON
              </span>
            </div>

            <div className="flex flex-col items-center justify-center cursor-not-allowed select-none py-1">
              <span className="text-xs uppercase tracking-widest font-medium text-foreground">
                Collections
              </span>
              <span className="mt-0.5 text-[8px] font-semibold tracking-wider uppercase bg-zinc-100 text-zinc-500 border border-zinc-200/70 px-1.5 py-px leading-none">
                COMING SOON
              </span>
            </div>
            <Link to="/about" className="text-foreground hover:opacity-70 transition-opacity">
              About Us
            </Link>
            <Link to="/contact" className="text-foreground hover:opacity-70 transition-opacity">
              Contact
            </Link>
          </nav>

          {/* Actions & Utilities */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Desktop Search trigger */}
            <div className="hidden lg:block relative">
              {isSearchOpen ? (
                <form onSubmit={handleSearchSubmit} className="relative">
                  <input
                    type="text"
                    placeholder="Search furniture, oak, linen..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                    className="h-8 w-60 bg-surface pl-8 pr-7 text-xs border border-border focus:border-foreground focus:outline-none placeholder:text-muted"
                  />
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-foreground" />
                  <button
                    type="button"
                    onClick={() => {
                      setIsSearchOpen(false)
                      setSearchQuery('')
                    }}
                    className="absolute right-2 top-2 p-0.5 text-muted hover:text-foreground transition-colors"
                    aria-label="Close search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => setIsSearchOpen(true)}
                  className="p-1.5 text-foreground hover:opacity-70 transition-opacity flex items-center gap-1.5 text-xs uppercase tracking-wider"
                  aria-label="Search catalog"
                >
                  <Search className="w-4 h-4 text-foreground" />
                  <span className="hidden xl:inline text-[11px] text-foreground">Search</span>
                </button>
              )}
            </div>

            {/* Auth State: Sign In button when logged out, Profile icon when logged in */}
            {isAuthenticated ? (
              <>
                <Link
                  to="/account"
                  className="p-1.5 text-foreground hover:opacity-70 transition-opacity"
                  aria-label="Customer account"
                  title={`Account: ${user?.name || ''}`}
                >
                  <User className="w-4 h-4 text-foreground" />
                </Link>

                {/* Wishlist (Authenticated only) */}
                <Link
                  to="/account/wishlist"
                  className="p-1.5 text-foreground hover:opacity-70 transition-opacity relative"
                  aria-label="Wishlist"
                  title="Wishlist"
                >
                  <Heart className="w-4 h-4 text-foreground" />
                  {wishlistCount > 0 && (
                    <span className="absolute 0 top-0.5 right-0.5 w-3.5 h-3.5 bg-foreground text-background text-[9px] font-semibold flex items-center justify-center rounded-full">
                      {wishlistCount}
                    </span>
                  )}
                </Link>

                {/* Cart Trigger (Authenticated only) */}
                <button
                  onClick={() => setIsCartDrawerOpen(true)}
                  className="p-1.5 text-foreground hover:opacity-70 transition-opacity relative flex items-center gap-1.5"
                  aria-label="Open cart"
                  title="Shopping Bag"
                >
                  <ShoppingBag className="w-4 h-4 text-foreground" />
                  {cartCount > 0 && (
                    <span className="w-4 h-4 bg-foreground text-background text-[10px] font-semibold flex items-center justify-center rounded-full">
                      {cartCount}
                    </span>
                  )}
                </button>
              </>
            ) : (
              <Link
                to="/auth"
                className="h-8 px-3.5 bg-foreground text-background hover:bg-black/85 text-[11px] font-semibold uppercase tracking-wider flex items-center transition-colors shadow-sm"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Search dropdown if opened */}
        {isSearchOpen && (
          <div className="lg:hidden p-3 bg-white border-t border-border animate-slide-down">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                placeholder="Search sofas, chairs, tables, beds..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="h-10 w-full bg-surface pl-9 pr-12 text-xs border border-border focus:border-foreground focus:outline-none"
              />
              <Search className="w-4 h-4 absolute left-3 top-3 text-muted" />
              <div className="absolute right-2 top-2 flex items-center gap-1.5">
                <button
                  type="submit"
                  className="h-6 px-2 text-[10px] uppercase tracking-wider bg-foreground text-background"
                >
                  Go
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsSearchOpen(false)
                    setSearchQuery('')
                  }}
                  className="h-6 w-6 flex items-center justify-center text-muted hover:text-foreground"
                  aria-label="Close search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>
        )}
      </header>

      {/* Mobile Drawer */}
      <MobileNavDrawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />
    </>
  )
}
