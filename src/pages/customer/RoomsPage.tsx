import React from 'react'
import { mockRooms } from '@/data/mockData'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { ComingSoonBadge } from '@/components/ui/ComingSoon'

export const RoomsPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-12 sm:pb-16">
      <Breadcrumbs items={[{ label: 'Inspiration Rooms' }]} className="mb-3 sm:mb-4" />

      {/* Header */}
      <div className="mb-8 sm:mb-10 pb-5 border-b border-border">
        <div className="flex items-center justify-between">
          <span className="editorial-badge">Spatial Architecture</span>
          <ComingSoonBadge label="COMING SOON" />
        </div>
        <h1 className="text-3xl sm:text-5xl font-light tracking-tight text-foreground mt-2">
          Shop by Room Inspiration
        </h1>
        <p className="mt-3 text-xs sm:text-sm text-muted max-w-2xl leading-relaxed">
          Explore complete architectural environments curated by our design directors. Preview our upcoming spatial suites below. Room-level purchasing will be active in an upcoming release.
        </p>
      </div>

      {/* Rooms Showcase Cards (Vibrant, non-navigable preview) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {mockRooms.map((room) => (
          <div
            key={room.id}
            className="flex flex-col bg-background border border-border overflow-hidden select-none group"
          >
            <div className="aspect-[16/10] w-full overflow-hidden relative bg-surface">
              {/* Full color image preserved */}
              <img
                src={room.image}
                alt={room.name}
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-102"
              />
              <ComingSoonBadge label="COMING SOON" className="absolute top-4 left-4 z-10" />
            </div>

            <div className="p-6 sm:p-8 flex flex-col flex-1">
              <span className="editorial-badge text-muted">{room.tagline}</span>
              <h2 className="text-2xl font-light text-foreground mt-1 tracking-tight">
                {room.name}
              </h2>
              <p className="text-xs sm:text-sm text-muted mt-3 leading-relaxed">
                {room.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
