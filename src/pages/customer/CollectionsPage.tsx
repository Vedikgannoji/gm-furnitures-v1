import React from 'react'
import { mockCollections } from '@/data/mockData'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { ComingSoonBadge } from '@/components/ui/ComingSoon'

export const CollectionsPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-12 sm:pb-16">
      <Breadcrumbs items={[{ label: 'Design Collections' }]} className="mb-3 sm:mb-4" />

      {/* Header */}
      <div className="mb-8 sm:mb-10 pb-5 border-b border-border">
        <div className="flex items-center justify-between">
          <span className="editorial-badge">Atelier Series</span>
          <ComingSoonBadge label="COMING SOON" />
        </div>
        <h1 className="text-3xl sm:text-5xl font-light tracking-tight text-foreground mt-2">
          Design Collections
        </h1>
        <p className="mt-3 text-xs sm:text-sm text-muted max-w-2xl leading-relaxed">
          Thematic furniture collections exploring distinct design styles. Preview these upcoming collections below. Ordering will be enabled with collection release.
        </p>
      </div>

      {/* Collections Grid (Vibrant, non-navigable preview) */}
      <div className="space-y-12">
        {mockCollections.map((col, idx) => {
          const isEven = idx % 2 === 0
          return (
            <div
              key={col.id}
              className="grid grid-cols-1 lg:grid-cols-12 bg-background border border-border overflow-hidden select-none"
            >
              {/* Image side - vibrant full color */}
              <div
                className={`lg:col-span-7 aspect-[16/10] lg:aspect-auto h-full w-full overflow-hidden bg-surface relative ${
                  isEven ? 'lg:order-1' : 'lg:order-2'
                }`}
              >
                <img
                  src={col.image}
                  alt={col.name}
                  className="w-full h-full object-cover"
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
                    <span className="editorial-badge text-muted">Capsule {idx + 1}</span>
                    <span className="text-[10px] uppercase tracking-wider text-muted font-mono">
                      {col.productCount} Designs
                    </span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-light text-foreground mt-2 tracking-tight">
                    {col.name}
                  </h2>
                  <p className="text-xs font-semibold text-foreground/80 mt-1 uppercase tracking-wider">
                    "{col.tagline}"
                  </p>
                  <p className="text-xs sm:text-sm text-muted mt-3 leading-relaxed">
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
