import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { mockRooms } from '@/data/mockData'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'

export const RoomsPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      <Breadcrumbs items={[{ label: 'Inspiration Rooms' }]} className="mb-6" />

      {/* Header */}
      <div className="mb-12 pb-6 border-b border-border">
        <span className="editorial-badge">Spatial Architecture</span>
        <h1 className="text-3xl sm:text-5xl font-light tracking-tight text-foreground mt-2">
          Shop by Room Inspiration
        </h1>
        <p className="mt-3 text-xs sm:text-sm text-muted max-w-2xl leading-relaxed">
          Explore complete architectural environments curated by our design directors. Each space reflects an intentional dialogue between material balance, natural daylight, and ergonomic comfort.
        </p>
      </div>

      {/* Rooms Showcase Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {mockRooms.map((room) => (
          <div
            key={room.id}
            className="group flex flex-col bg-background border border-border overflow-hidden"
          >
            <div className="aspect-[16/10] w-full overflow-hidden relative bg-surface">
              <img
                src={room.image}
                alt={room.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
            </div>

            <div className="p-6 sm:p-8 flex flex-col justify-between flex-1">
              <div>
                <span className="editorial-badge text-muted">{room.tagline}</span>
                <h2 className="text-2xl font-light text-foreground mt-1 tracking-tight">
                  {room.name}
                </h2>
                <p className="text-xs sm:text-sm text-muted mt-3 leading-relaxed">
                  {room.description}
                </p>
              </div>

              <div className="mt-8 pt-5 border-t border-border flex items-center justify-between">
                <span className="text-xs text-muted">
                  {room.featuredProductIds.length} Curated Architectural Pieces
                </span>
                <Link
                  to={`/rooms/${room.slug}`}
                  className="h-10 px-5 bg-foreground text-background hover:bg-black/85 text-xs uppercase tracking-wider font-medium flex items-center gap-2 transition-colors"
                >
                  <span>Explore Suite</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
