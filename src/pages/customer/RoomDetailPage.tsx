import React from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { ComingSoonBadge } from '@/components/ui/ComingSoon'
import { mockRooms } from '@/data/mockData'

export const RoomDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>()
  const room = mockRooms.find((r) => r.slug === slug)

  const roomName = room ? room.name : 'Spatial Room Suite'

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Rooms', href: '/rooms' },
          { label: roomName },
        ]}
        className="mb-8"
      />

      <div className="bg-white border border-border overflow-hidden">
        {room && (
          <div className="aspect-[21/9] w-full overflow-hidden relative bg-surface">
            <img
              src={room.image}
              alt={room.name}
              className="w-full h-full object-cover"
            />
            <ComingSoonBadge label="COMING SOON" className="absolute top-6 left-6 z-10" />
          </div>
        )}

        <div className="p-8 sm:p-14 max-w-3xl">
          <div className="flex items-center gap-3 mb-2">
            <span className="editorial-badge text-muted">
              {room?.tagline || 'Curated Space'}
            </span>
            <ComingSoonBadge label="COMING SOON" />
          </div>

          <h1 className="text-3xl sm:text-5xl font-light tracking-tight text-foreground">
            {roomName}
          </h1>

          <p className="mt-4 text-sm sm:text-base text-muted leading-relaxed">
            {room?.description || 'This architectural spatial environment is currently being prepared by our design atelier.'}
          </p>

          <div className="mt-8 p-6 bg-surface border border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Unreleased Spatial Suite
              </p>
              <p className="text-xs text-muted mt-0.5">
                Room suite purchasing and curated bundles will launch in the upcoming release.
              </p>
            </div>
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 h-10 px-6 bg-foreground text-background hover:bg-black/85 text-xs font-semibold uppercase tracking-widest transition-colors shrink-0"
            >
              <span>Explore Active Pieces</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
