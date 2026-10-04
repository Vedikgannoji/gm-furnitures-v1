import React, { useState, useMemo } from 'react'
import { SlidersHorizontal, X, RotateCcw, Search } from 'lucide-react'
import { ProductCard } from '@/components/commerce/ProductCard'
import { EmptyState } from '@/components/commerce/EmptyState'
import { Drawer } from '@/components/ui/Drawer'
import { Button } from '@/components/ui/Button'
import { ComingSoonBadge } from '@/components/ui/ComingSoon'
import { mockProducts } from '@/data/mockData'
import { isProductAvailableForPurchase } from '@/utils/availability'

export const ShopPage: React.FC = () => {
  const [maxPrice, setMaxPrice] = useState<number>(300000)
  const [sortBy, setSortBy] = useState<string>('featured')
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState<boolean>(false)

  // Launch Availability Rule: Dining Tables Only
  const availableDiningTables = useMemo(() => {
    return mockProducts.filter(isProductAvailableForPurchase)
  }, [])

  // Filter products strictly based on active dining tables
  const filteredProducts = useMemo(() => {
    return availableDiningTables.filter((product) => {
      if (product.price > maxPrice) return false
      return true
    })
  }, [availableDiningTables, maxPrice])

  const sortedProducts = useMemo(() => {
    const list = [...filteredProducts]
    if (sortBy === 'price-low') {
      list.sort((a, b) => a.price - b.price)
    } else if (sortBy === 'price-high') {
      list.sort((a, b) => b.price - a.price)
    } else if (sortBy === 'newest') {
      list.sort((a, b) => (b.newArrival ? 1 : 0) - (a.newArrival ? 1 : 0))
    } else if (sortBy === 'rating') {
      list.sort((a, b) => b.rating - a.rating)
    }
    return list
  }, [filteredProducts, sortBy])

  const resetFilters = () => {
    setMaxPrice(300000)
    setSortBy('featured')
  }

  const activeFilterCount = maxPrice < 300000 ? 1 : 0

  // Filter Sidebar Content (Material & Stock filters completely removed)
  const filterControls = (
    <div className="space-y-6 text-xs">
      {/* Active filters header */}
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <span className="font-semibold uppercase tracking-wider text-foreground">
          Refine Pieces {activeFilterCount > 0 && `(${activeFilterCount})`}
        </span>
        {activeFilterCount > 0 && (
          <button
            onClick={resetFilters}
            className="text-muted hover:text-foreground flex items-center gap-1 text-[11px] underline"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Category — Dining Tables active */}
      <div>
        <h4 className="text-[11px] font-semibold uppercase tracking-widest text-muted mb-2.5">
          Category
        </h4>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 py-1 text-foreground">
            <span className="w-1.5 h-1.5 rounded-full bg-foreground" />
            <span className="font-semibold tracking-wider uppercase text-xs">
              Dining Tables ({availableDiningTables.length})
            </span>
          </div>
        </div>
      </div>

      {/* Price Range */}
      <div className="pt-4 border-t border-border">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-[11px] font-semibold uppercase tracking-widest text-muted">
            Max Price
          </h4>
          <span className="font-semibold text-foreground">
            ₹{(maxPrice / 1000).toFixed(0)}k
          </span>
        </div>
        <input
          type="range"
          min={100000}
          max={300000}
          step={5000}
          value={maxPrice}
          onChange={(e) => setMaxPrice(Number(e.target.value))}
          className="w-full accent-foreground cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-muted mt-1">
          <span>₹1,00,000</span>
          <span>₹3,00,000</span>
        </div>
      </div>
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-12 sm:pb-16">
      {/* Page Header */}
      <div className="mb-6 sm:mb-8 pb-5 border-b border-border">
        <span className="editorial-badge">Available Pieces</span>
        <h1 className="text-3xl sm:text-4xl font-light tracking-tight text-foreground mt-1">
          The Complete Collection
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-muted max-w-2xl leading-relaxed">
          Explore our handcrafted dining tables engineered with traditional Mortise-and-Tenon joinery, solid European oak, honed Carrara marble, and organic matte finishes.
        </p>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-border mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsMobileFilterOpen(true)}
            className="lg:hidden h-10 px-4 bg-surface border border-border text-xs uppercase tracking-wider font-medium flex items-center gap-2 hover:bg-surface-subtle transition-colors"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filters {activeFilterCount > 0 && `(${activeFilterCount})`}</span>
          </button>
          <span className="text-xs text-muted">
            Showing <span className="font-semibold text-foreground">{sortedProducts.length}</span> Dining Tables
          </span>
        </div>

        {/* Sorting Dropdown */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <label htmlFor="sort-select" className="text-xs text-muted uppercase tracking-wider whitespace-nowrap">
            Sort by:
          </label>
          <select
            id="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="h-9 px-3 bg-surface border border-border text-xs font-medium focus:border-foreground focus:outline-none cursor-pointer w-full sm:w-48"
          >
            <option value="featured">Curated & Featured</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="newest">New Arrivals</option>
            <option value="rating">Highest Rated</option>
          </select>
        </div>
      </div>

      {/* Active Filter Badges */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-8">
          <span className="text-[11px] uppercase tracking-wider text-muted mr-1">Active:</span>
          {maxPrice < 300000 && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-surface border border-border text-xs">
              Under ₹{(maxPrice / 1000).toFixed(0)}k
              <X className="w-3 h-3 cursor-pointer hover:text-foreground" onClick={() => setMaxPrice(300000)} />
            </span>
          )}
          <button
            onClick={resetFilters}
            className="text-xs text-muted hover:text-foreground underline ml-2"
          >
            Clear All
          </button>
        </div>
      )}

      {/* Main Catalog Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10 items-start">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block lg:col-span-1 sticky top-24">
          <div className="bg-background border border-border p-5">
            {filterControls}
          </div>
        </aside>

        {/* Product Grid Area */}
        <div className="lg:col-span-3">
          {sortedProducts.length === 0 ? (
            <EmptyState
              icon={Search}
              title="No dining tables matched your criteria"
              description="Try adjusting your price range filter to view available dining tables."
              actionLabel="Reset Filters"
              onAction={resetFilters}
            />
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8">
                {sortedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Editorial Coming Soon Callout for remaining collections */}
              <div className="mt-14 p-8 sm:p-12 border border-border bg-surface text-center flex flex-col items-center justify-center">
                <ComingSoonBadge label="COMING SOON" className="mb-3" />
                <h3 className="text-sm sm:text-base font-light tracking-tight text-foreground uppercase max-w-md">
                  More collections are in development.
                </h3>
                <p className="mt-2 text-xs text-muted max-w-md leading-relaxed">
                  Sofas, lounge chairs, platform beds, and architectural storage capsules will be released in subsequent curated drops.
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Mobile Filters Drawer */}
      <Drawer
        isOpen={isMobileFilterOpen}
        onClose={() => setIsMobileFilterOpen(false)}
        position="right"
        title="Filter Collection"
        width="max-w-xs"
      >
        <div className="pb-8">
          {filterControls}
          <div className="mt-8 pt-4 border-t border-border">
            <Button
              variant="primary"
              size="md"
              className="w-full"
              onClick={() => setIsMobileFilterOpen(false)}
            >
              Apply Filters ({sortedProducts.length} Results)
            </Button>
          </div>
        </div>
      </Drawer>
    </div>
  )
}
