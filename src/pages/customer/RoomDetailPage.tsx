import React from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { ComingSoonBadge } from '@/components/ui/ComingSoon'
import { mockRooms } from '@/data/mockData'

export const RoomDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>()
  const room = mockRooms.find((r) => r.slug === slug)

  const roomName = room ? room.name : 'Room Suite'

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-12 sm:pb-16">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Rooms', href: '/rooms' },
          { label: roomName },
        ]}
        className="mb-3 sm:mb-4"
      />

      <div className="bg-white border border-border overflow-hidden">
        {room && (
          <div className="aspect-[21/9] w-full overflow-hidden relative bg-surface">
            <img
              src={room.image}
              alt={room.name}
              className={`w-full h-full object-cover ${room.slug !== 'dining-room' ? 'opacity-85 brightness-105' : ''}`}
            />
            {room.slug !== 'dining-room' && (
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 bg-zinc-900/85 backdrop-blur-xs py-2.5 text-center shadow-sm">
                <span className="text-[11px] font-medium tracking-[0.25em] uppercase text-white">
                  Coming Soon
                </span>
              </div>
            )}
          </div>
        )}

        <div className="p-8 sm:p-14 max-w-3xl">
          <div className="flex items-center gap-3 mb-2">
            <span className="editorial-badge text-muted">
              {room?.tagline || 'Room Collection'}
            </span>
            {room?.slug !== 'dining-room' && <ComingSoonBadge label="COMING SOON" />}
          </div>

          <h1 className="text-3xl sm:text-5xl font-light tracking-tight text-foreground">
            {roomName}
          </h1>

          <p className="mt-4 text-sm sm:text-base text-muted leading-relaxed">
            {room?.description || 'This room collection is currently being prepared by our design team.'}
          </p>

          <div className="mt-8 pt-6 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <span className="text-xs text-muted">
              {room?.slug === 'dining-room'
                ? 'Explore our available dining furniture pieces.'
                : 'Room collection purchasing will launch with our upcoming release.'}
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
