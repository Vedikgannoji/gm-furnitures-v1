import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Search,
  ShoppingBag,
  Heart,
  User,
  Menu,
  ChevronDown,
  Shield,
} from 'lucide-react'
import { useCart } from '@/context/CartContext'
import { useWishlist } from '@/context/WishlistContext'
import { MobileNavDrawer } from './MobileNavDrawer'
import { mockCategories } from '@/data/mockData'

export const CustomerNavbar: React.FC = () => {
  const navigate = useNavigate()
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
      <header className="sticky top-0 z-40 w-full bg-background/95 backdrop-blur-md border-b border-border transition-all">
        {/* Top minimal announcement banner */}
        <div className="bg-surface text-center py-1.5 px-4 text-[11px] font-medium tracking-widest uppercase text-muted border-b border-border/60">
          <span>Complimentary White-Glove Assembly & Delivery across India on orders over ₹50,000</span>
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
            <Link to="/" className="flex flex-col items-start text-left group">
              <span className="text-sm sm:text-base font-semibold tracking-[0.2em] uppercase text-foreground">
                GM FURNITURE
              </span>
              <span className="text-[9px] tracking-[0.25em] uppercase text-muted -mt-0.5 font-light">
                ATELIER & LIVING
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8 text-xs uppercase tracking-widest font-medium text-muted">
            {/* Shop with dropdown */}
            <div
              className="relative py-4"
              onMouseEnter={() => setIsShopHovered(true)}
              onMouseLeave={() => setIsShopHovered(false)}
            >
              <Link
                to="/shop"
                className="flex items-center gap-1 hover:text-foreground transition-colors"
              >
                <span>Shop</span>
                <ChevronDown className="w-3 h-3 transition-transform duration-200" />
              </Link>

              {/* Mega Dropdown */}
              {isShopHovered && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 w-80 bg-background border border-border shadow-xl p-4 animate-slide-down">
                  <div className="text-[10px] font-semibold text-muted uppercase tracking-widest mb-2 pb-1 border-b border-border">
                    Furniture Categories
                  </div>
                  <div className="grid grid-cols-1 gap-1">
                    {mockCategories.map((cat) => (
                      <Link
                        key={cat.id}
                        to={`/shop/${cat.slug}`}
                        className="py-1.5 px-2 hover:bg-surface text-foreground hover:text-foreground text-xs flex justify-between items-center transition-colors"
                        onClick={() => setIsShopHovered(false)}
                      >
                        <span>{cat.name}</span>
                        <span className="text-[10px] text-muted">{cat.itemCount} items</span>
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

            <Link to="/rooms" className="hover:text-foreground transition-colors">
              Rooms
            </Link>
            <Link to="/collections" className="hover:text-foreground transition-colors">
              Collections
            </Link>
            <Link to="/about" className="hover:text-foreground transition-colors">
              Atelier
            </Link>
            <Link to="/contact" className="hover:text-foreground transition-colors">
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
                    className="h-8 w-60 bg-surface pl-8 pr-3 text-xs border border-border focus:border-foreground focus:outline-none placeholder:text-muted"
                  />
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted" />
                  <button
                    type="button"
                    onClick={() => setIsSearchOpen(false)}
                    className="absolute right-2 top-2 text-[10px] text-muted hover:text-foreground"
                  >
                    ESC
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => setIsSearchOpen(true)}
                  className="p-1.5 text-muted hover:text-foreground transition-colors flex items-center gap-1.5 text-xs uppercase tracking-wider"
                  aria-label="Search catalog"
                >
                  <Search className="w-4 h-4" />
                  <span className="hidden xl:inline text-[11px]">Search</span>
                </button>
              )}
            </div>

            {/* Account Icon */}
            <Link
              to="/account"
              className="p-1.5 text-muted hover:text-foreground transition-colors"
              aria-label="Customer account"
              title="My Account"
            >
              <User className="w-4 h-4" />
            </Link>

            {/* Wishlist */}
            <Link
              to="/account/wishlist"
              className="p-1.5 text-muted hover:text-foreground transition-colors relative"
              aria-label="Saved items wishlist"
              title="Saved items"
            >
              <Heart className="w-4 h-4" />
              {wishlistCount > 0 && (
                <span className="absolute 0 top-0.5 right-0.5 w-3.5 h-3.5 bg-foreground text-background text-[9px] font-semibold flex items-center justify-center rounded-full">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart Trigger */}
            <button
              onClick={() => setIsCartDrawerOpen(true)}
              className="p-1.5 text-foreground hover:text-muted transition-colors relative flex items-center gap-1.5"
              aria-label="Open cart"
              title="Shopping Bag"
            >
              <ShoppingBag className="w-4 h-4" />
              {cartCount > 0 && (
                <span className="w-4 h-4 bg-foreground text-background text-[10px] font-semibold flex items-center justify-center rounded-full">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Admin Switch Link Badge */}
            <Link
              to="/admin"
              className="hidden md:inline-flex items-center gap-1 px-2.5 py-1 bg-surface hover:bg-surface-subtle border border-border text-[10px] uppercase tracking-wider text-muted hover:text-foreground transition-colors"
              title="Switch to Admin Management SaaS"
            >
              <Shield className="w-3 h-3" />
              <span>Admin</span>
            </Link>
          </div>
        </div>

        {/* Mobile Search dropdown if opened */}
        {isSearchOpen && (
          <div className="lg:hidden p-3 bg-background border-t border-border animate-slide-down">
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
              <button
                type="submit"
                className="absolute right-2 top-2 h-6 px-2 text-[10px] uppercase tracking-wider bg-foreground text-background"
              >
                Go
              </button>
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
