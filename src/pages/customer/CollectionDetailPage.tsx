import React from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { ComingSoonBadge } from '@/components/ui/ComingSoon'
import { mockCollections } from '@/data/mockData'

export const CollectionDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>()
  const collection = mockCollections.find((c) => c.slug === slug)

  const collectionName = collection ? collection.name : 'Design Collection'

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-12 sm:pb-16">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Collections', href: '/collections' },
          { label: collectionName },
        ]}
        className="mb-3 sm:mb-4"
      />

      <div className="bg-white border border-border overflow-hidden">
        {collection && (
          <div className="aspect-[21/9] w-full overflow-hidden relative bg-surface">
            <img
              src={collection.image}
              alt={collection.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="p-8 sm:p-14 max-w-3xl">
          <div className="flex items-center gap-3 mb-2">
            <span className="editorial-badge text-muted">
              {collection?.tagline || 'Design Collection'}
            </span>
            <ComingSoonBadge label="COMING SOON" />
          </div>

          <h1 className="text-3xl sm:text-5xl font-light tracking-tight text-foreground">
            {collectionName}
          </h1>

          <p className="mt-4 text-sm sm:text-base text-muted leading-relaxed">
            {collection?.description || 'This furniture collection is currently being prepared by our design team.'}
          </p>

          <div className="mt-8 pt-6 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <span className="text-xs text-muted">
              Collection purchasing will launch with our upcoming release.
            </span>
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 h-10 px-6 bg-foreground text-background hover:bg-black/85 text-xs font-semibold uppercase tracking-widest transition-colors shrink-0"
            >
              <span>EXPLORE CATALOG →</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
