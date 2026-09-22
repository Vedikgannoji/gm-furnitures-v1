import React, { useState, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { ProductCard } from '@/components/commerce/ProductCard'
import { EmptyState } from '@/components/commerce/EmptyState'
import { mockCollections, mockProducts } from '@/data/mockData'
import { RotateCcw, Search } from 'lucide-react'

export const CollectionDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>()
  const [sortBy, setSortBy] = useState<string>('featured')
  const [inStockOnly, setInStockOnly] = useState<boolean>(false)

  const collection = mockCollections.find((c) => c.slug === slug)

  const products = useMemo(() => {
    let list = mockProducts.filter((p) => p.collection === slug)
    if (inStockOnly) {
      list = list.filter((p) => p.stockStatus !== 'out_of_stock')
    }
    if (sortBy === 'price-low') {
      list.sort((a, b) => a.price - b.price)
    } else if (sortBy === 'price-high') {
      list.sort((a, b) => b.price - a.price)
    } else if (sortBy === 'rating') {
      list.sort((a, b) => b.rating - a.rating)
    }
    return list
  }, [slug, inStockOnly, sortBy])

  if (!collection) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <EmptyState
          icon={RotateCcw}
          title="Collection Not Found"
          description="The furniture collection you requested could not be located."
          actionLabel="View All Collections"
          actionHref="/collections"
        />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Collections', href: '/collections' },
          { label: collection.name },
        ]}
        className="mb-6"
      />

      {/* Hero Banner */}
      <div className="relative mb-12 bg-surface border border-border p-6 sm:p-12 overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="max-w-xl z-10">
          <span className="editorial-badge text-muted">Curated Collection Capsule</span>
          <h1 className="text-3xl sm:text-5xl font-light text-foreground mt-2 tracking-tight">
            {collection.name}
          </h1>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted mt-2">
            "{collection.tagline}"
          </p>
          <p className="mt-4 text-xs sm:text-sm text-muted leading-relaxed">
            {collection.description}
          </p>
        </div>

        <div className="w-full md:w-80 h-48 sm:h-56 bg-surface shrink-0 overflow-hidden border border-border">
          <img
            src={collection.image}
            alt={collection.name}
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-border mb-8">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-foreground">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => setInStockOnly(e.target.checked)}
              className="accent-foreground w-4 h-4"
            />
            <span>In-Stock Pieces Only</span>
          </label>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label htmlFor="col-sort" className="text-xs text-muted uppercase tracking-wider whitespace-nowrap">
            Sort by:
          </label>
          <select
            id="col-sort"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="h-9 px-3 bg-surface border border-border text-xs font-medium focus:border-foreground focus:outline-none cursor-pointer w-full sm:w-48"
          >
            <option value="featured">Curated Order</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="rating">Highest Appraisals</option>
          </select>
        </div>
      </div>

      {/* Products Grid */}
      {products.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No pieces currently available in this collection"
          description="Please check our other architectural collections."
          actionLabel="Explore All Collections"
          actionHref="/collections"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {/* Other collections links */}
      <div className="mt-20 pt-10 border-t border-border">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-foreground">
            Other Design Capsules
          </h3>
          <Link to="/collections" className="text-xs text-muted hover:text-foreground underline">
            All Collections &rarr;
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {mockCollections
            .filter((c) => c.slug !== slug)
            .map((c) => (
              <Link
                key={c.id}
                to={`/collections/${c.slug}`}
                className="group p-4 bg-surface border border-border hover:border-foreground transition-all flex items-center gap-4"
              >
                <div className="w-16 h-16 bg-background shrink-0 overflow-hidden">
                  <img src={c.image} alt={c.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h4 className="text-xs font-medium text-foreground group-hover:underline">
                    {c.name}
                  </h4>
                  <span className="text-[11px] text-muted block mt-0.5">
                    {c.productCount} Pieces
                  </span>
                </div>
              </Link>
            ))}
        </div>
      </div>
    </div>
  )
}
