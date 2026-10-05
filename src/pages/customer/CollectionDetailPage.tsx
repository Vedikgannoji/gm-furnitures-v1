import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { ProductCard } from '@/components/commerce/ProductCard'
import { EmptyState } from '@/components/commerce/EmptyState'
import { Collection, Product } from '@/types'
import { Search, Loader2 } from 'lucide-react'

export const CollectionDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>()
  const [collection, setCollection] = useState<Collection | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    async function loadCollectionAndProducts() {
      if (!slug) return
      setIsLoading(true)
      try {
        const [colRes, prodRes] = await Promise.all([
          fetch(`/api/collections/${encodeURIComponent(slug)}`),
          fetch(`/api/products?collection=${encodeURIComponent(slug)}`),
        ])

        if (isMounted) {
          if (colRes.ok) {
            const colData = await colRes.json()
            setCollection(colData)
          } else {
            setCollection({
              id: slug,
              name: slug.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
              slug,
              tagline: 'Design Collection',
              description: 'Explore pieces in this collection.',
              image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1400&q=80',
              productCount: 0,
            })
          }

          if (prodRes.ok) {
            const prodData = await prodRes.json()
            setProducts(prodData)
          }
        }
      } catch (err) {
        console.error('Failed to load collection details:', err)
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    loadCollectionAndProducts()
    return () => {
      isMounted = false
    }
  }, [slug])

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted mb-3" />
        <span className="text-xs text-muted">Loading collection...</span>
      </div>
    )
  }

  if (!collection) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <EmptyState
          icon={Search}
          title="Collection Not Found"
          description="The furniture collection you requested could not be located."
          actionLabel="Return to Collections"
          actionHref="/collections"
        />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-12 sm:pb-16">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Collections', href: '/collections' },
          { label: collection.name },
        ]}
        className="mb-3 sm:mb-4"
      />

      <div className="bg-white border border-border overflow-hidden mb-12">
        {collection.image && (
          <div className="aspect-[21/9] w-full overflow-hidden relative bg-surface">
            <img
              src={collection.image}
              alt={collection.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="p-8 sm:p-12 max-w-3xl">
          {collection.tagline && (
            <div className="mb-2">
              <span className="editorial-badge text-muted">{collection.tagline}</span>
            </div>
          )}

          <h1 className="text-3xl sm:text-5xl font-light tracking-tight text-foreground">
            {collection.name}
          </h1>

          <p className="mt-4 text-sm sm:text-base text-muted leading-relaxed">
            {collection.description}
          </p>

          <div className="mt-6 flex items-center gap-3 text-xs text-muted">
            <span className="font-semibold text-foreground">{products.length} Products</span>
            <span>•</span>
            <span>Handcrafted Solid Wood</span>
            <span>•</span>
            <span>Direct Delivery & Assembly</span>
          </div>
        </div>
      </div>

      {/* Linked Products Grid */}
      <div>
        <div className="pb-4 border-b border-border mb-8">
          <h2 className="text-xl font-semibold text-foreground tracking-tight">
            Pieces in {collection.name}
          </h2>
          <p className="text-xs text-muted mt-1">
            Explore designs crafted for this collection line.
          </p>
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="border border-border bg-surface p-12 text-center max-w-xl mx-auto my-6">
            <p className="text-sm font-medium text-foreground">No pieces assigned to this collection yet.</p>
            <p className="text-xs text-muted mt-1">
              Check back soon or explore our complete catalog.
            </p>
            <div className="mt-6">
              <Link
                to="/shop"
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-foreground text-background text-xs uppercase tracking-widest font-semibold hover:bg-black/85 transition-colors"
              >
                EXPLORE CATALOG →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
