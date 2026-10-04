import React from 'react'
import { mockCollections } from '@/data/mockData'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { ComingSoon } from '@/components/ui/ComingSoon'

export const CollectionsPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      <Breadcrumbs items={[{ label: 'Design Collections' }]} className="mb-6" />

      {/* Header */}
      <div className="mb-12 pb-6 border-b border-border">
        <div className="flex items-center justify-between">
          <span className="editorial-badge">Atelier Series</span>
          <span className="text-[10px] uppercase tracking-widest font-semibold bg-zinc-100 text-zinc-700 px-2.5 py-1">
            Coming Soon
          </span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-light tracking-tight text-foreground mt-2">
          Curated Design Collections
        </h1>
        <p className="mt-3 text-xs sm:text-sm text-muted max-w-2xl leading-relaxed">
          Thematic furniture capsules exploring distinct aesthetic movements. These limited architectural capsules are currently being handcrafted for public launch.
        </p>
      </div>

      {/* Global Coming Soon Banner */}
      <div className="mb-12">
        <ComingSoon
          variant="section"
          eyebrow="Capsule Collection"
          title="COMING SOON"
          subtitle="All design collections are currently being prepared. Collection-level purchasing will be active in the next release."
        />
      </div>

      {/* Collections Grid (Non-navigable preview) */}
      <div className="space-y-12">
        {mockCollections.map((col, idx) => {
          const isEven = idx % 2 === 0
          return (
            <div
              key={col.id}
              className="grid grid-cols-1 lg:grid-cols-12 bg-background border border-border overflow-hidden select-none"
            >
              {/* Image side */}
              <div
                className={`lg:col-span-7 aspect-[16/10] lg:aspect-auto h-full w-full overflow-hidden bg-surface ${
                  isEven ? 'lg:order-1' : 'lg:order-2'
                }`}
              >
                <img
                  src={col.image}
                  alt={col.name}
                  className="w-full h-full object-cover grayscale contrast-125"
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
                    <span className="text-[9px] uppercase tracking-widest bg-zinc-100 text-zinc-700 px-2 py-0.5 font-medium">
                      Coming Soon
                    </span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-light text-foreground mt-2 tracking-tight">
                    {col.name}
                  </h2>
                  <p className="text-xs font-semibold text-foreground/80 mt-2 uppercase tracking-wider">
                    "{col.tagline}"
                  </p>
                  <p className="text-xs sm:text-sm text-muted mt-4 leading-relaxed">
                    {col.description}
                  </p>
                </div>

                <div className="mt-8 pt-6 border-t border-border flex items-center justify-between">
                  <span className="text-xs text-muted">
                    Atelier Preview
                  </span>
                  <span className="h-10 px-5 bg-zinc-100 text-zinc-500 text-xs uppercase tracking-wider font-medium flex items-center gap-2 cursor-not-allowed">
                    Coming Soon
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
