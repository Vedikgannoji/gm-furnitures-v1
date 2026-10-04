import React, { useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SlidersHorizontal, X, RotateCcw } from 'lucide-react'
import { ProductCard } from '@/components/commerce/ProductCard'
import { EmptyState } from '@/components/commerce/EmptyState'
import { Drawer } from '@/components/ui/Drawer'
import { Button } from '@/components/ui/Button'
import { mockProducts, mockCategories } from '@/data/mockData'
import { Search } from 'lucide-react'

export const ShopPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()

  // Extract query filters
  const initialCategory = searchParams.get('category') || 'all'
  const initialSort = searchParams.get('sort') || 'featured'

  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory)
  const [selectedMaterial, setSelectedMaterial] = useState<string>(initialCategory === 'all' ? 'all' : 'all')
  const [inStockOnly, setInStockOnly] = useState<boolean>(false)
  const [maxPrice, setMaxPrice] = useState<number>(300000)
  const [sortBy, setSortBy] = useState<string>(initialSort)
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState<boolean>(false)
  const [displayCount, setDisplayCount] = useState<number>(12)

  // Extract unique materials
  const allMaterials = useMemo(() => {
    const list = new Set<string>()
    mockProducts.forEach((p) => {
      if (p.material.includes('Oak')) list.add('Oak Wood')
      if (p.material.includes('Walnut')) list.add('Walnut Wood')
      if (p.material.includes('Teak')) list.add('Teak Wood')
      if (p.material.includes('Stone') || p.material.includes('Travertine') || p.material.includes('Marble')) list.add('Natural Stone')
      if (p.material.includes('Linen') || p.material.includes('Bouclé') || p.material.includes('Wool')) list.add('Textile & Bouclé')
      if (p.material.includes('Leather')) list.add('Leather')
      if (p.material.includes('Steel') || p.material.includes('Aluminum')) list.add('Metal & Steel')
    })
    return Array.from(list)
  }, [])

  // Filter & Sort logic
  const filteredProducts = useMemo(() => {
    return mockProducts.filter((product) => {
      if (selectedCategory !== 'all' && product.category !== selectedCategory) {
        return false
      }
      if (inStockOnly && product.stockStatus === 'out_of_stock') {
        return false
      }
      if (product.price > maxPrice) {
        return false
      }
      if (selectedMaterial !== 'all') {
        if (selectedMaterial === 'Oak Wood' && !product.material.includes('Oak')) return false
        if (selectedMaterial === 'Walnut Wood' && !product.material.includes('Walnut')) return false
        if (selectedMaterial === 'Teak Wood' && !product.material.includes('Teak')) return false
        if (selectedMaterial === 'Natural Stone' && !product.material.includes('Stone') && !product.material.includes('Travertine') && !product.material.includes('Marble')) return false
        if (selectedMaterial === 'Textile & Bouclé' && !product.material.includes('Linen') && !product.material.includes('Bouclé') && !product.material.includes('Wool')) return false
        if (selectedMaterial === 'Leather' && !product.material.includes('Leather')) return false
        if (selectedMaterial === 'Metal & Steel' && !product.material.includes('Steel') && !product.material.includes('Aluminum')) return false
      }
      return true
    })
  }, [selectedCategory, selectedMaterial, inStockOnly, maxPrice])

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
    setSelectedCategory('all')
    setSelectedMaterial('all')
    setInStockOnly(false)
    setMaxPrice(300000)
    setSortBy('featured')
    setSearchParams({})
  }

  const activeFilterCount =
    (selectedCategory !== 'all' ? 1 : 0) +
    (selectedMaterial !== 'all' ? 1 : 0) +
    (inStockOnly ? 1 : 0) +
    (maxPrice < 300000 ? 1 : 0)

  // Reusable Filter Sidebar Content
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

      {/* Categories */}
      <div>
        <h4 className="text-[11px] font-semibold uppercase tracking-widest text-muted mb-2.5">
          Category
        </h4>
        <div className="space-y-1.5">
          <label className="flex items-center gap-2 cursor-pointer py-0.5">
            <input
              type="radio"
              name="category"
              checked={selectedCategory === 'all'}
              onChange={() => setSelectedCategory('all')}
              className="accent-foreground"
            />
            <span className={selectedCategory === 'all' ? 'font-medium text-foreground' : 'text-muted'}>
              All Categories ({mockProducts.length})
            </span>
          </label>
          {mockCategories.map((cat) => (
            <label key={cat.id} className="flex items-center gap-2 cursor-pointer py-0.5">
              <input
                type="radio"
                name="category"
                checked={selectedCategory === cat.slug}
                onChange={() => setSelectedCategory(cat.slug)}
                className="accent-foreground"
              />
              <span className={selectedCategory === cat.slug ? 'font-medium text-foreground' : 'text-muted'}>
                {cat.name} ({cat.itemCount})
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Material */}
      <div className="pt-4 border-t border-border">
        <h4 className="text-[11px] font-semibold uppercase tracking-widest text-muted mb-2.5">
          Material & Craft
        </h4>
        <div className="space-y-1.5">
          <label className="flex items-center gap-2 cursor-pointer py-0.5">
            <input
              type="radio"
              name="material"
              checked={selectedMaterial === 'all'}
              onChange={() => setSelectedMaterial('all')}
              className="accent-foreground"
            />
            <span className={selectedMaterial === 'all' ? 'font-medium text-foreground' : 'text-muted'}>
              All Materials
            </span>
          </label>
          {allMaterials.map((mat) => (
            <label key={mat} className="flex items-center gap-2 cursor-pointer py-0.5">
              <input
                type="radio"
                name="material"
                checked={selectedMaterial === mat}
                onChange={() => setSelectedMaterial(mat)}
                className="accent-foreground"
              />
              <span className={selectedMaterial === mat ? 'font-medium text-foreground' : 'text-muted'}>
                {mat}
              </span>
            </label>
          ))}
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
          min={25000}
          max={300000}
          step={5000}
          value={maxPrice}
          onChange={(e) => setMaxPrice(Number(e.target.value))}
          className="w-full accent-foreground cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-muted mt-1">
          <span>₹25,000</span>
          <span>₹3,00,000</span>
        </div>
      </div>

      {/* Stock Availability */}
      <div className="pt-4 border-t border-border">
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => setInStockOnly(e.target.checked)}
            className="w-4 h-4 rounded-none accent-foreground"
          />
          <span className="text-xs font-medium text-foreground">
            In-Stock Pieces Only
          </span>
        </label>
      </div>
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      {/* Page Header */}
      <div className="mb-10 pb-6 border-b border-border">
        <span className="editorial-badge">Architectural Catalog</span>
        <h1 className="text-3xl sm:text-4xl font-light tracking-tight text-foreground mt-1">
          The Complete Collection
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-muted max-w-2xl leading-relaxed">
          Explore our complete catalog of precision-crafted furniture. Sculptural proportions engineered from solid oak, walnut, honed Roman travertine, and pure Belgian flax.
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
            Showing <span className="font-semibold text-foreground">{sortedProducts.length}</span> of {mockProducts.length} pieces
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
          {selectedCategory !== 'all' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-surface border border-border text-xs">
              Category: {selectedCategory}
              <X className="w-3 h-3 cursor-pointer hover:text-foreground" onClick={() => setSelectedCategory('all')} />
            </span>
          )}
          {selectedMaterial !== 'all' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-surface border border-border text-xs">
              Material: {selectedMaterial}
              <X className="w-3 h-3 cursor-pointer hover:text-foreground" onClick={() => setSelectedMaterial('all')} />
            </span>
          )}
          {inStockOnly && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-surface border border-border text-xs">
              In Stock Only
              <X className="w-3 h-3 cursor-pointer hover:text-foreground" onClick={() => setInStockOnly(false)} />
            </span>
          )}
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
              title="No furniture pieces matched your criteria"
              description="Try adjusting your filters, clearing the price range, or browsing our curated room showcases."
              actionLabel="Reset All Filters"
              onAction={resetFilters}
            />
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8">
                {sortedProducts.slice(0, displayCount).map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Load more button */}
              {displayCount < sortedProducts.length && (
                <div className="mt-14 text-center">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => setDisplayCount((prev) => prev + 6)}
                  >
                    Load More Pieces ({sortedProducts.length - displayCount} remaining)
                  </Button>
                </div>
              )}
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
