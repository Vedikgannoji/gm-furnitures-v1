import React, { useState, useEffect, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { ProductCard } from '@/components/commerce/ProductCard'
import { EmptyState } from '@/components/commerce/EmptyState'
import { ComingSoonBadge } from '@/components/ui/ComingSoon'
import { Category, Product } from '@/types'
import { Search, Loader2 } from 'lucide-react'

export const CategoryPage: React.FC = () => {
  const { category: categorySlug } = useParams<{ category: string }>()
  const [category, setCategory] = useState<Category | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [sortBy, setSortBy] = useState<string>('featured')

  useEffect(() => {
    let isMounted = true
    async function loadCategoryAndProducts() {
      if (!categorySlug) return
      setIsLoading(true)
      try {
        const [catRes, prodRes] = await Promise.all([
          fetch('/api/categories'),
          fetch(`/api/products?category=${encodeURIComponent(categorySlug)}`),
        ])

        if (isMounted) {
          if (catRes.ok) {
            const allCats: Category[] = await catRes.json()
            const found = allCats.find((c) => c.slug === categorySlug)
            if (found) {
              setCategory(found)
            } else {
              // Fallback category representation
              setCategory({
                id: categorySlug,
                name: categorySlug.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
                slug: categorySlug,
                description: 'Explore furniture pieces crafted for modern living.',
                image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=80',
                itemCount: 0,
              })
            }
          }

          if (prodRes.ok) {
            const prods: Product[] = await prodRes.json()
            setProducts(prods)
          }
        }
      } catch (err) {
        console.error('Failed to load category products:', err)
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadCategoryAndProducts()
    return () => {
      isMounted = false
    }
  }, [categorySlug])

  const sortedProducts = useMemo(() => {
    const list = [...products]
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
  }, [products, sortBy])

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted mb-3" />
        <span className="text-xs text-muted">Loading category collection...</span>
      </div>
    )
  }

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-12 sm:pb-16">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Shop', href: '/shop' },
          { label: category.name },
        ]}
        className="mb-3 sm:mb-4"
      />

      {/* Category Header */}
      <div className="relative mb-8 sm:mb-10 bg-surface border border-border p-6 sm:p-12 overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="max-w-xl z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="editorial-badge text-muted">Furniture Category</span>
            {products.length === 0 && <ComingSoonBadge label="COMING SOON" />}
          </div>
          <h1 className="text-3xl sm:text-5xl font-light text-foreground mt-2 tracking-tight">
            {category.name}
          </h1>
          <p className="mt-4 text-xs sm:text-sm text-muted leading-relaxed">
            {category.description}
          </p>
          <div className="mt-6 flex items-center gap-3 text-xs text-muted">
            <span className="font-semibold text-foreground">
              {products.length} {products.length === 1 ? 'Product' : 'Products'}
            </span>
            <span>•</span>
            <span>Solid Wood Construction</span>
            <span>•</span>
            <span>Direct Delivery & Assembly</span>
          </div>
        </div>

        {category.image && (
          <div className="w-full md:w-80 h-48 sm:h-56 bg-surface shrink-0 overflow-hidden border border-border relative">
            <img
              src={category.image}
              alt={category.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </div>

      {/* Controls Bar */}
      {sortedProducts.length > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-border mb-8">
          <span className="text-xs text-muted">
            Showing <span className="font-semibold text-foreground">{sortedProducts.length}</span> Products
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
              <option value="featured">Featured</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="newest">New Arrivals</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>
        </div>
      )}

      {/* Products Grid or Coming Soon State */}
      {sortedProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
          {sortedProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="border border-border bg-surface p-12 sm:p-16 text-center max-w-2xl mx-auto my-6">
          <div className="mb-4">
            <ComingSoonBadge label="COMING SOON" />
          </div>
          <h2 className="text-xl sm:text-2xl font-light text-foreground uppercase tracking-tight">
            {category.name} Collection in Development
          </h2>
          <p className="mt-3 text-xs sm:text-sm text-muted leading-relaxed max-w-lg mx-auto">
            Our master craftsmen are designing solid wood pieces for {category.name.toLowerCase()}. Real products will appear here once published to our catalog.
          </p>
          <div className="mt-8">
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 px-7 py-3 bg-foreground text-background text-xs uppercase tracking-widest font-semibold hover:bg-black/85 transition-colors shadow-sm"
            >
              EXPLORE AVAILABLE CATALOG →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
