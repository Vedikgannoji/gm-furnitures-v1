import React, { useState, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { ProductCard } from '@/components/commerce/ProductCard'
import { EmptyState } from '@/components/commerce/EmptyState'
import { ComingSoonBadge } from '@/components/ui/ComingSoon'
import { mockCategories, mockProducts } from '@/data/mockData'
import { isProductAvailableForPurchase, isCategoryAvailable } from '@/utils/availability'
import { Search } from 'lucide-react'

export const CategoryPage: React.FC = () => {
  const { category: categorySlug } = useParams<{ category: string }>()
  const [sortBy, setSortBy] = useState<string>('featured')

  const category = mockCategories.find((c) => c.slug === categorySlug)
  const isAvailable = categorySlug ? isCategoryAvailable(categorySlug) : false

  const products = useMemo(() => {
    if (!isAvailable) return []
    let list = mockProducts.filter(isProductAvailableForPurchase)
    if (sortBy === 'price-low') {
      list.sort((a, b) => a.price - b.price)
    } else if (sortBy === 'price-high') {
      list.sort((a, b) => b.price - a.price)
    } else if (sortBy === 'rating') {
      list.sort((a, b) => b.rating - a.rating)
    }
    return list
  }, [isAvailable, sortBy])

  if (!category) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <EmptyState
          icon={Search}
          title="Category Not Found"
          description="The furniture category you requested could not be located."
          actionLabel="Return to Catalog"
          actionHref="/shop"
        />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Shop', href: '/shop' },
          { label: category.name },
        ]}
        className="mb-6"
      />

      {/* Category Editorial Header */}
      <div className="relative mb-12 bg-surface border border-border p-6 sm:p-12 overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="max-w-xl z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="editorial-badge text-muted">Architectural Category</span>
            {!isAvailable && <ComingSoonBadge label="COMING SOON" />}
          </div>
          <h1 className="text-3xl sm:text-5xl font-light text-foreground mt-2 tracking-tight">
            {category.name}
          </h1>
          <p className="mt-4 text-xs sm:text-sm text-muted leading-relaxed">
            {category.description}
          </p>
          <div className="mt-6 flex items-center gap-3 text-xs text-muted">
            {isAvailable ? (
              <>
                <span className="font-semibold text-foreground">{products.length} Designs</span>
                <span>•</span>
                <span>Solid Wood & Sustainable Joinery</span>
                <span>•</span>
                <span>Complimentary Delivery</span>
              </>
            ) : (
              <span className="font-medium text-foreground tracking-wider uppercase text-[11px]">
                Capsule in development · Available in subsequent release
              </span>
            )}
          </div>
        </div>

        <div className="w-full md:w-80 h-48 sm:h-56 bg-surface shrink-0 overflow-hidden border border-border relative">
          <img
            src={category.image}
            alt={category.name}
            className={`w-full h-full object-cover ${!isAvailable ? 'grayscale contrast-90 opacity-90' : ''}`}
          />
          {!isAvailable && (
            <div className="absolute inset-0 flex items-center justify-center p-2">
              <ComingSoonBadge label="COMING SOON" />
            </div>
          )}
        </div>
      </div>

      {isAvailable ? (
        <>
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-border mb-8">
            <span className="text-xs text-muted">
              Showing <span className="font-semibold text-foreground">{products.length}</span> Dining Tables
            </span>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <label htmlFor="cat-sort" className="text-xs text-muted uppercase tracking-wider whitespace-nowrap">
                Sort by:
              </label>
              <select
                id="cat-sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="h-9 px-3 bg-surface border border-border text-xs font-medium focus:border-foreground focus:outline-none cursor-pointer w-full sm:w-48"
              >
                <option value="featured">Curated & Featured</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </>
      ) : (
        /* Coming Soon State for Unavailable Categories */
        <div className="border border-border bg-surface p-12 sm:p-16 text-center max-w-2xl mx-auto my-6">
          <ComingSoonBadge label="COMING SOON" className="mx-auto mb-4" />
          <h2 className="text-xl sm:text-2xl font-light text-foreground uppercase tracking-tight">
            {category.name}
          </h2>
          <p className="mt-3 text-xs sm:text-sm text-muted leading-relaxed">
            This collection is currently in development. Our artisans are meticulously shaping each piece for an upcoming release.
          </p>
          <div className="mt-8">
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 px-7 py-3 bg-foreground text-background text-xs uppercase tracking-widest font-semibold hover:bg-black/85 transition-colors shadow-sm"
            >
              Explore Active Dining Tables
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
