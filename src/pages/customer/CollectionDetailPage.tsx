import React from 'react'
import { useParams } from 'react-router-dom'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { ComingSoon } from '@/components/ui/ComingSoon'
import { mockCollections } from '@/data/mockData'

export const CollectionDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>()
  const collection = mockCollections.find((c) => c.slug === slug)

  const collectionName = collection ? collection.name : 'Design Collection'

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Collections', href: '/collections' },
          { label: collectionName },
        ]}
        className="mb-8"
      />

      <ComingSoon
        variant="page"
        eyebrow="Curated Collection Capsule"
        title="COMING SOON"
        subtitle={`The ${collectionName} is currently being prepared. Collection-level purchasing will be active in the upcoming release.`}
        actionLabel="Explore Available Furniture"
        actionHref="/shop"
      />
    </div>
  )
}
