import React, { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SlidersHorizontal, X, RotateCcw, Search } from 'lucide-react'
import { ProductCard } from '@/components/commerce/ProductCard'
import { EmptyState } from '@/components/commerce/EmptyState'
import { ComingSoonBadge } from '@/components/ui/ComingSoon'
import { Drawer } from '@/components/ui/Drawer'
import { Button } from '@/components/ui/Button'
import { useProducts } from '@/hooks/useProducts'
import { Category } from '@/types'

export const ShopPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const { products } = useProducts()
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [maxPrice, setMaxPrice] = useState<number>(300000)
  const [sortBy, setSortBy] = useState<string>('featured')
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState<boolean>(false)

  const categoryQuery = searchParams.get('category')

  useEffect(() => {
    let isMounted = true
    async function loadCategories() {
      try {
        const res = await fetch('/api/categories', { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          if (isMounted) setCategories(data)
        }
      } catch (err) {
        console.error('Failed to load categories in shop page:', err)
      }
    }
    loadCategories()
    return () => {
      isMounted = false
    }
  }, [])

  // Sync selectedCategory with URL query parameter
  useEffect(() => {
    if (categoryQuery && categories.length > 0) {
      const match = categories.find(
        (c) =>
          c.slug.toLowerCase() === categoryQuery.toLowerCase() ||
          c.name.toLowerCase() === categoryQuery.toLowerCase()
      )
      if (match) {
        setSelectedCategory(match.slug)
      }
    }
  }, [categoryQuery, categories])

  // Filter products based on selected category and price
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      if (selectedCategory !== 'all') {
        const pCat = (product.category || '').toLowerCase().trim()
        const sCat = selectedCategory.toLowerCase().trim()
        const isMatch =
          pCat === sCat ||
          pCat === sCat.replace(/-/g, ' ') ||
          sCat === pCat.replace(/-/g, ' ')
        if (!isMatch) return false
      }
      if (product.price > maxPrice) {
        return false
      }
      return true
    })
  }, [products, selectedCategory, maxPrice])

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
    setMaxPrice(300000)
    setSortBy('featured')
  }

  const activeFilterCount = (selectedCategory !== 'all' ? 1 : 0) + (maxPrice < 300000 ? 1 : 0)

  // Filter Sidebar Content
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

      {/* Category Filter */}
      <div>
        <h4 className="text-[11px] font-semibold uppercase tracking-widest text-muted mb-2.5">
          Category
        </h4>
        <div className="space-y-1.5">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`w-full text-left py-1 px-2 text-xs flex items-center justify-between rounded transition-colors ${
              selectedCategory === 'all'
                ? 'bg-foreground text-background font-medium'
                : 'text-foreground hover:bg-surface'
            }`}
          >
            <span>All Categories</span>
            <span className="text-[10px] opacity-75">{products.length}</span>
          </button>

          {categories.map((cat) => {
            const count = products.filter((p) => {
              const pCat = (p.category || '').toLowerCase().trim()
              const cSlug = cat.slug.toLowerCase().trim()
              const cName = cat.name.toLowerCase().trim()
              return pCat === cSlug || pCat === cName || pCat === cSlug.replace(/-/g, ' ')
            }).length
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.slug)}
                className={`w-full text-left py-1 px-2 text-xs flex items-center justify-between rounded transition-colors ${
                  selectedCategory === cat.slug
                    ? 'bg-foreground text-background font-medium'
                    : 'text-foreground hover:bg-surface'
                }`}
              >
                <span>{cat.name}</span>
                <span className="text-[10px] opacity-75">{count}</span>
              </button>
            )
          })}
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
          min={10000}
          max={300000}
          step={5000}
          value={maxPrice}
          onChange={(e) => setMaxPrice(Number(e.target.value))}
          className="w-full accent-foreground cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-muted mt-1">
          <span>₹10,000</span>
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
          Explore handcrafted solid wood furniture engineered with traditional joinery, organic matte finishes, and timeless aesthetics.
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
            Showing <span className="font-semibold text-foreground">{sortedProducts.length}</span> Products
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
            <option value="featured">Featured</option>
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
              Category: {categories.find((c) => c.slug === selectedCategory)?.name || selectedCategory}
              <X className="w-3 h-3 cursor-pointer hover:text-foreground" onClick={() => setSelectedCategory('all')} />
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
            selectedCategory !== 'all' ? (
              <div className="border border-border bg-surface p-12 sm:p-16 text-center max-w-xl mx-auto my-6">
                <div className="mb-4">
                  <ComingSoonBadge label="COMING SOON" />
                </div>
                <h3 className="text-xl font-light uppercase tracking-tight text-foreground">
                  {categories.find((c) => c.slug === selectedCategory)?.name || selectedCategory} Collection
                </h3>
                <p className="mt-3 text-xs sm:text-sm text-muted max-w-md mx-auto leading-relaxed">
                  There are currently no published pieces in this category. Our atelier is preparing new solid wood designs for an upcoming release.
                </p>
                <div className="mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedCategory('all')}
                  >
                    View All Available Furniture
                  </Button>
                </div>
              </div>
            ) : (
              <EmptyState
                icon={Search}
                title="No products matched your criteria"
                description="Try adjusting your price range filter to view available furniture."
                actionLabel="Reset Filters"
                onAction={resetFilters}
              />
            )
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8">
              {sortedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
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
