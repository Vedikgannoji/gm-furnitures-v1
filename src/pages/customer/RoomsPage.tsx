import React from 'react'
import { mockRooms } from '@/data/mockData'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { ComingSoon } from '@/components/ui/ComingSoon'

export const RoomsPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      <Breadcrumbs items={[{ label: 'Inspiration Rooms' }]} className="mb-6" />

      {/* Header */}
      <div className="mb-12 pb-6 border-b border-border">
        <div className="flex items-center justify-between">
          <span className="editorial-badge">Spatial Architecture</span>
          <span className="text-[10px] uppercase tracking-widest font-semibold bg-zinc-100 text-zinc-700 px-2.5 py-1">
            Coming Soon
          </span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-light tracking-tight text-foreground mt-2">
          Shop by Room Inspiration
        </h1>
        <p className="mt-3 text-xs sm:text-sm text-muted max-w-2xl leading-relaxed">
          Explore complete architectural environments curated by our design directors. Room suite purchasing and immersive room views will launch in the upcoming release.
        </p>
      </div>

      {/* Global Coming Soon Banner */}
      <div className="mb-12">
        <ComingSoon
          variant="section"
          eyebrow="Architectural Living"
          title="COMING SOON"
          subtitle="Shop by Room is currently being prepared. Room-based purchasing is disabled for this preview."
        />
      </div>

      {/* Rooms Showcase Cards (Non-navigable preview) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {mockRooms.map((room) => (
          <div
            key={room.id}
            className="flex flex-col bg-background border border-border overflow-hidden select-none"
          >
            <div className="aspect-[16/10] w-full overflow-hidden relative bg-surface">
              <img
                src={room.image}
                alt={room.name}
                className="w-full h-full object-cover grayscale contrast-125"
              />
              <div className="absolute inset-0 bg-black/30" />
              <div className="absolute top-4 left-4">
                <span className="text-[10px] tracking-widest uppercase bg-black text-white px-2.5 py-1 font-medium">
                  Coming Soon
                </span>
              </div>
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
                  Spatial Environment Preview
                </span>
                <span className="h-10 px-5 bg-zinc-100 text-zinc-500 text-xs uppercase tracking-wider font-medium flex items-center gap-2 cursor-not-allowed">
                  Coming Soon
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
