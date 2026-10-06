import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Collection } from '@/types'
import { ComingSoonBadge, ComingSoonOverlay } from '@/components/ui/ComingSoon'
import { Loader2, ArrowRight } from 'lucide-react'

export const CollectionsPage: React.FC = () => {
  const [collections, setCollections] = useState<Collection[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    async function loadCollections() {
      try {
        const res = await fetch('/api/collections')
        if (res.ok) {
          const data = await res.json()
          if (isMounted) setCollections(data)
        }
      } catch (err) {
        console.error('Failed to load collections:', err)
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }
    loadCollections()
    return () => {
      isMounted = false
    }
  }, [])

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted mb-3" />
        <span className="text-xs text-muted">Loading collections...</span>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-12 sm:pb-16">
      <Breadcrumbs items={[{ label: 'Collections' }]} className="mb-3 sm:mb-4" />

      {/* Header */}
      <div className="mb-8 sm:mb-10 pb-5 border-b border-border">
        <span className="editorial-badge">Furniture Series</span>
        <h1 className="text-3xl sm:text-5xl font-light tracking-tight text-foreground mt-2">
          Collections
        </h1>
        <p className="mt-3 text-xs sm:text-sm text-muted max-w-2xl leading-relaxed">
          Thematic furniture lines exploring distinct design concepts, fine woodcraft, and harmonious proportions.
        </p>
      </div>

      {/* Collections Grid */}
      <div className="space-y-12">
        {collections.map((col, idx) => {
          const isEven = idx % 2 === 0
          const isAvailable = (col.productCount ?? 0) > 0

          if (isAvailable) {
            return (
              <Link
                key={col.id}
                to={`/collections/${col.slug}`}
                className="grid grid-cols-1 lg:grid-cols-12 bg-background border border-border overflow-hidden group hover:border-foreground transition-colors"
              >
                {/* Image side */}
                <div
                  className={`lg:col-span-7 aspect-[16/10] lg:aspect-auto h-full w-full overflow-hidden bg-surface relative ${
                    isEven ? 'lg:order-1' : 'lg:order-2'
                  }`}
                >
                  <img
                    src={col.image}
                    alt={col.name}
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                </div>

                {/* Text side */}
                <div
                  className={`lg:col-span-5 p-8 sm:p-12 flex flex-col justify-between ${
                    isEven ? 'lg:order-2' : 'lg:order-1'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="editorial-badge text-muted">Collection {idx + 1}</span>
                      <span className="text-[10px] uppercase tracking-wider text-muted font-mono">
                        {col.productCount} {col.productCount === 1 ? 'Product' : 'Products'}
                      </span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-light text-foreground mt-2 tracking-tight flex items-center justify-between">
                      <span>{col.name}</span>
                      <ArrowRight className="w-5 h-5 text-muted group-hover:text-foreground group-hover:translate-x-1 transition-all" />
                    </h2>
                    {col.tagline && (
                      <p className="text-xs font-semibold text-foreground/80 mt-1 uppercase tracking-wider">
                        "{col.tagline}"
                      </p>
                    )}
                    <p className="text-xs sm:text-sm text-muted mt-3 leading-relaxed">
                      {col.description}
                    </p>
                  </div>
                </div>
              </Link>
            )
          }

          return (
            <div
              key={col.id}
              className="grid grid-cols-1 lg:grid-cols-12 bg-background border border-border overflow-hidden cursor-default select-none pointer-events-none"
            >
              {/* Image side */}
              <div
                className={`lg:col-span-7 aspect-[16/10] lg:aspect-auto h-full w-full overflow-hidden bg-surface relative ${
                  isEven ? 'lg:order-1' : 'lg:order-2'
                }`}
              >
                <img
                  src={col.image}
                  alt={col.name}
                  className="w-full h-full object-cover opacity-40 brightness-110"
                />
                <ComingSoonOverlay />
              </div>

              {/* Text side */}
              <div
                className={`lg:col-span-5 p-8 sm:p-12 flex flex-col justify-between ${
                  isEven ? 'lg:order-2' : 'lg:order-1'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="editorial-badge text-muted">Collection {idx + 1}</span>
                    <ComingSoonBadge label="COMING SOON" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-light text-muted mt-2 tracking-tight">
                    {col.name}
                  </h2>
                  {col.tagline && (
                    <p className="text-xs font-semibold text-muted/80 mt-1 uppercase tracking-wider">
                      "{col.tagline}"
                    </p>
                  )}
                  <p className="text-xs sm:text-sm text-muted/70 mt-3 leading-relaxed">
                    {col.description}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
