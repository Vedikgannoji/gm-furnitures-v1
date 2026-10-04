import React from 'react'
import { mockRooms } from '@/data/mockData'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { ComingSoonBadge } from '@/components/ui/ComingSoon'

export const RoomsPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-12 sm:pb-16">
      <Breadcrumbs items={[{ label: 'Rooms' }]} className="mb-3 sm:mb-4" />

      {/* Header */}
      <div className="mb-8 sm:mb-10 pb-5 border-b border-border">
        <span className="editorial-badge">Room Inspiration</span>
        <h1 className="text-3xl sm:text-5xl font-light tracking-tight text-foreground mt-2">
          Shop by Room
        </h1>
        <p className="mt-3 text-xs sm:text-sm text-muted max-w-2xl leading-relaxed">
          Explore complete room environments for your home. Browse available dining spaces and preview upcoming rooms.
        </p>
      </div>

      {/* Rooms Showcase Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {mockRooms.map((room) => {
          const isDining = room.slug === 'dining-room'
          return (
            <div
              key={room.id}
              className="flex flex-col bg-background border border-border overflow-hidden select-none group"
            >
              <div className="aspect-[16/10] w-full overflow-hidden relative bg-surface">
                {/* Image */}
                <img
                  src={room.image}
                  alt={room.name}
                  className={`w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-102 ${
                    !isDining ? 'opacity-85 brightness-105' : ''
                  }`}
                />

                {/* Coming Soon treatment for other rooms */}
                {!isDining && (
                  <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 bg-zinc-900/85 backdrop-blur-xs py-2 text-center shadow-sm">
                    <span className="text-[11px] font-medium tracking-[0.25em] uppercase text-white">
                      Coming Soon
                    </span>
                  </div>
                )}
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
          )
        })}
      </div>
    </div>
  )
}
