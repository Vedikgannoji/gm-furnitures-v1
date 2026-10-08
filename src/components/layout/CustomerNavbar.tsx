import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
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
import { Category } from '@/types'

export const CustomerNavbar: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, isAuthenticated } = useAuth()
  const { cartCount, setIsCartDrawerOpen } = useCart()
  const { wishlistCount } = useWishlist()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isShopHovered, setIsShopHovered] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])

  // Close menus on route change
  useEffect(() => {
    setIsMobileMenuOpen(false)
    setIsSearchOpen(false)
  }, [location.pathname, location.search, location.hash])

  const searchContainerRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false)
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsSearchOpen(false)
      }
    }
    if (isSearchOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
      setTimeout(() => searchInputRef.current?.focus(), 50)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isSearchOpen])

  useEffect(() => {
    let isMounted = true
    async function loadCategories() {
      try {
        const res = await fetch('/api/categories')
        if (res.ok) {
          const data = await res.json()
          if (isMounted) setCategories(data)
        }
      } catch (err) {
        console.error('Failed to load categories in navbar:', err)
      }
    }
    loadCategories()
    return () => {
      isMounted = false
    }
  }, [])

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
        <div className="bg-white text-center py-1.5 sm:py-2 px-3 text-[9px] sm:text-[11px] font-medium tracking-[0.12em] sm:tracking-[0.2em] uppercase text-zinc-600 border-b border-border leading-normal">
          <span>FROM THE HOUSE OF GM BROTHERS (INTERIORS AND CONSTRUCTIONS)</span>
        </div>

        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2">
          {/* Mobile Menu Button & Search */}
          <div className="flex items-center gap-1 lg:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="w-10 h-10 flex items-center justify-center text-foreground hover:text-muted transition-colors -ml-1 rounded active:bg-zinc-100"
              aria-label="Open mobile menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="w-10 h-10 flex items-center justify-center text-foreground hover:text-muted transition-colors rounded active:bg-zinc-100"
              aria-label="Search catalog"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>

          {/* Brand Logo */}
          <div className="flex items-center shrink-0">
            <Link to="/" className="flex items-center gap-2 sm:gap-3 group">
              <img
                src="/logo.png"
                alt="GM Logo"
                className="h-6 sm:h-8 w-auto object-contain shrink-0"
              />
              <div className="flex flex-col items-start text-left">
                <span className="text-xs sm:text-base font-semibold tracking-[0.18em] sm:tracking-[0.2em] uppercase text-foreground leading-tight truncate">
                  GM FURNITURE
                </span>
                <span className="text-[8px] sm:text-[9px] tracking-[0.2em] sm:tracking-[0.25em] uppercase text-muted font-light leading-tight">
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
                    {categories.map((cat) => {
                      const isDining = cat.slug?.toLowerCase() === 'dining' || cat.name?.toLowerCase() === 'dining'
                      return isDining ? (
                        <Link
                          key={cat.id}
                          to="/shop?category=Dining"
                          className="py-1.5 px-2 hover:bg-zinc-50 text-foreground text-xs flex justify-between items-center transition-colors font-medium"
                          onClick={() => setIsShopHovered(false)}
                        >
                          <span>{cat.name}</span>
                          <span className="text-[10px] text-emerald-700 font-semibold uppercase tracking-wider">Available</span>
                        </Link>
                      ) : (
                        <div
                          key={cat.id}
                          className="py-1.5 px-2 text-zinc-400 text-xs flex justify-between items-center cursor-default select-none"
                        >
                          <span>{cat.name}</span>
                          <span className="bg-black text-white text-[7.5px] font-bold tracking-wider uppercase px-1.5 py-0.5 leading-none">
                            COMING SOON
                          </span>
                        </div>
                      )
                    })}
                    <div className="pt-2 mt-1 border-t border-border">
                      <Link
                        to="/shop?category=Dining"
                        className="text-xs font-semibold text-foreground underline-offset-4 hover:underline block text-center py-1"
                        onClick={() => setIsShopHovered(false)}
                      >
                        Explore Dining Pieces &rarr;
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Rooms - Non-clickable with compact black box Coming Soon positioned directly below */}
            <div className="flex flex-col items-center justify-center cursor-default select-none py-1 group leading-none">
              <span className="text-foreground leading-tight">Rooms</span>
              <span className="mt-1 bg-black text-white text-[7px] font-bold tracking-widest uppercase px-1.5 py-0.5 leading-none text-center whitespace-nowrap">
                COMING SOON
              </span>
            </div>

            {/* Collections - Non-clickable with compact black box Coming Soon positioned directly below */}
            <div className="flex flex-col items-center justify-center cursor-default select-none py-1 group leading-none">
              <span className="text-foreground leading-tight">Collections</span>
              <span className="mt-1 bg-black text-white text-[7px] font-bold tracking-widest uppercase px-1.5 py-0.5 leading-none text-center whitespace-nowrap">
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
            {/* Desktop Search trigger (Never shifts navbar layout) */}
            <div className="hidden lg:block relative" ref={searchContainerRef}>
              <button
                type="button"
                onClick={() => setIsSearchOpen((prev) => !prev)}
                className={`p-1.5 transition-colors flex items-center gap-1.5 text-xs uppercase tracking-wider ${
                  isSearchOpen ? 'text-foreground font-semibold' : 'text-foreground hover:opacity-70'
                }`}
                aria-label="Search catalog"
                aria-expanded={isSearchOpen}
              >
                <Search className="w-4 h-4 text-foreground" />
                <span className="hidden xl:inline text-[11px] text-foreground">Search</span>
              </button>

              {/* Controlled Search Dropdown Overlay */}
              {isSearchOpen && (
                <div className="absolute top-full right-0 mt-3 w-80 sm:w-96 bg-white border border-border shadow-2xl p-3 z-50 animate-slide-down">
                  <form onSubmit={handleSearchSubmit} className="relative flex items-center">
                    <Search className="w-4 h-4 absolute left-3 text-muted pointer-events-none" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder="Search furniture, oak, dining table..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-9 w-full bg-surface pl-9 pr-14 text-xs border border-border focus:border-foreground focus:outline-none placeholder:text-muted"
                    />
                    <div className="absolute right-1.5 flex items-center gap-1">
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => setSearchQuery('')}
                          className="p-1 text-muted hover:text-foreground transition-colors"
                          aria-label="Clear search text"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setIsSearchOpen(false)
                          setSearchQuery('')
                        }}
                        className="p-1 text-muted hover:text-foreground transition-colors"
                        aria-label="Close search dropdown"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>

            {/* Auth State & Action Icons */}
            {isAuthenticated && (
              <>
                {user?.role === 'admin' && (
                  <Link
                    to="/admin"
                    className="hidden lg:flex items-center gap-1.5 px-3 py-1 bg-foreground text-background text-[10px] font-semibold uppercase tracking-widest hover:bg-black/85 transition-colors shadow-sm"
                    title="Open Management Console"
                  >
                    <span>Admin</span>
                  </Link>
                )}
                <Link
                  to="/account"
                  className="hidden lg:flex w-10 h-10 items-center justify-center text-foreground hover:opacity-70 transition-opacity rounded"
                  aria-label="Customer account"
                  title={`Account: ${user?.name || ''}`}
                >
                  <User className="w-4 h-4 text-foreground" />
                </Link>

                <Link
                  to="/account/wishlist"
                  className="w-10 h-10 flex items-center justify-center text-foreground hover:opacity-70 transition-opacity relative rounded active:bg-zinc-100"
                  aria-label="Wishlist"
                  title="Wishlist"
                >
                  <Heart className="w-4 h-4 text-foreground" />
                  {wishlistCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 bg-foreground text-background text-[9px] font-semibold flex items-center justify-center rounded-full">
                      {wishlistCount}
                    </span>
                  )}
                </Link>
              </>
            )}

            {/* Shopping Bag Button — Always visible for guests & authenticated users */}
            <button
              onClick={() => setIsCartDrawerOpen(true)}
              className="w-10 h-10 flex items-center justify-center text-foreground hover:opacity-70 transition-opacity relative rounded active:bg-zinc-100"
              aria-label="Open cart"
              title="Shopping Bag"
            >
              <ShoppingBag className="w-4 h-4 text-foreground" />
              {cartCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-foreground text-background text-[10px] font-semibold flex items-center justify-center rounded-full">
                  {cartCount}
                </span>
              )}
            </button>

            {!isAuthenticated && (
              <Link
                to="/auth"
                className="hidden lg:flex h-8 px-3.5 bg-foreground text-background hover:bg-black/85 text-[11px] font-semibold uppercase tracking-wider items-center transition-colors shadow-sm ml-1"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Search dropdown if opened */}
        {isSearchOpen && (
          <div className="lg:hidden p-3 bg-white border-t border-border animate-slide-down shadow-sm">
            <form onSubmit={handleSearchSubmit} className="relative flex items-center">
              <input
                type="text"
                placeholder="Search sofas, chairs, tables, beds..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="h-10 w-full bg-surface pl-9 pr-14 text-xs border border-border focus:border-foreground focus:outline-none"
              />
              <Search className="w-4 h-4 absolute left-3 top-3 text-muted pointer-events-none" />
              <div className="absolute right-2 top-2 flex items-center gap-1">
                <button
                  type="submit"
                  className="h-6 px-2 text-[10px] font-semibold uppercase tracking-wider bg-foreground text-background"
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
