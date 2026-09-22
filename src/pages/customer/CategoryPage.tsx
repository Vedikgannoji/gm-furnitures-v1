import React, { useState, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { ProductCard } from '@/components/commerce/ProductCard'
import { EmptyState } from '@/components/commerce/EmptyState'
import { mockCategories, mockProducts } from '@/data/mockData'
import { SlidersHorizontal, ArrowLeft, Search } from 'lucide-react'

export const CategoryPage: React.FC = () => {
  const { category: categorySlug } = useParams<{ category: string }>()
  const [sortBy, setSortBy] = useState<string>('featured')
  const [inStockOnly, setInStockOnly] = useState<boolean>(false)

  const category = mockCategories.find((c) => c.slug === categorySlug)

  const products = useMemo(() => {
    let list = mockProducts.filter((p) => p.category === categorySlug)
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
  }, [categorySlug, inStockOnly, sortBy])

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
          <span className="editorial-badge text-muted">Curated Category</span>
          <h1 className="text-3xl sm:text-5xl font-light text-foreground mt-2 tracking-tight">
            {category.name}
          </h1>
          <p className="mt-4 text-xs sm:text-sm text-muted leading-relaxed">
            {category.description}
          </p>
          <div className="mt-6 flex items-center gap-3 text-xs text-muted">
            <span className="font-semibold text-foreground">{products.length} Designs</span>
            <span>•</span>
            <span>Solid Wood & Sustainable Joinery</span>
            <span>•</span>
            <span>Free Assembly</span>
          </div>
        </div>

        <div className="w-full md:w-80 h-48 sm:h-56 bg-surface shrink-0 overflow-hidden border border-border">
          <img
            src={category.image}
            alt={category.name}
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Filters / Sort Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-border mb-8">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-foreground">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => setInStockOnly(e.target.checked)}
              className="accent-foreground w-4 h-4"
            />
            <span>In-Stock Only</span>
          </label>
        </div>

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
      {products.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No pieces available in this category currently"
          description="Check back soon or explore our other design categories."
          actionLabel="Explore All Furniture"
          actionHref="/shop"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {/* Bottom Cross-Category Navigation */}
      <div className="mt-20 pt-10 border-t border-border">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-foreground">
            Other Furniture Categories
          </h3>
          <Link
            to="/shop"
            className="text-xs text-muted hover:text-foreground underline"
          >
            All Categories &rarr;
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {mockCategories
            .filter((c) => c.slug !== categorySlug)
            .map((c) => (
              <Link
                key={c.id}
                to={`/shop/${c.slug}`}
                className="p-3 bg-surface border border-border hover:border-foreground text-xs font-medium text-foreground transition-all flex flex-col"
              >
                <span>{c.name}</span>
                <span className="text-[10px] text-muted mt-1">{c.itemCount} items</span>
              </Link>
            ))}
        </div>
      </div>
    </div>
  )
}
