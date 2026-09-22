import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { mockCollections } from '@/data/mockData'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'

export const CollectionsPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      <Breadcrumbs items={[{ label: 'Design Collections' }]} className="mb-6" />

      {/* Header */}
      <div className="mb-12 pb-6 border-b border-border">
        <span className="editorial-badge">Atelier Series</span>
        <h1 className="text-3xl sm:text-5xl font-light tracking-tight text-foreground mt-2">
          Curated Design Collections
        </h1>
        <p className="mt-3 text-xs sm:text-sm text-muted max-w-2xl leading-relaxed">
          Thematic furniture capsules exploring distinct aesthetic movements. From radical Scandinavian reductionism to raw monumental stone monoliths.
        </p>
      </div>

      {/* Collections Grid */}
      <div className="space-y-12">
        {mockCollections.map((col, idx) => {
          const isEven = idx % 2 === 0
          return (
            <div
              key={col.id}
              className="grid grid-cols-1 lg:grid-cols-12 bg-background border border-border overflow-hidden"
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
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-700 ease-out"
                />
              </div>

              {/* Text side */}
              <div
                className={`lg:col-span-5 p-8 sm:p-12 flex flex-col justify-between ${
                  isEven ? 'lg:order-2' : 'lg:order-1'
                }`}
              >
                <div>
                  <span className="editorial-badge text-muted">Capsule {idx + 1}</span>
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
                    {col.productCount} Handcrafted Pieces
                  </span>
                  <Link
                    to={`/collections/${col.slug}`}
                    className="h-10 px-5 bg-foreground text-background hover:bg-black/85 text-xs uppercase tracking-wider font-medium flex items-center gap-2 transition-colors"
                  >
                    <span>View Collection</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
