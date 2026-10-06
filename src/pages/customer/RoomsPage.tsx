import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Room } from '@/types'
import { ComingSoonBadge } from '@/components/ui/ComingSoon'
import { Loader2, ArrowRight } from 'lucide-react'

export const RoomsPage: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    async function loadRooms() {
      try {
        const res = await fetch('/api/rooms')
        if (res.ok) {
          const data = await res.json()
          if (isMounted) setRooms(data)
        }
      } catch (err) {
        console.error('Failed to load rooms:', err)
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }
    loadRooms()
    return () => {
      isMounted = false
    }
  }, [])

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted mb-3" />
        <span className="text-xs text-muted">Loading rooms...</span>
      </div>
    )
  }

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
          Explore complete room environments for your home. Browse handcrafted solid wood furniture curated for each space.
        </p>
      </div>

      {/* Rooms Showcase Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {rooms.map((room) => (
          <Link
            key={room.id}
            to={`/rooms/${room.slug}`}
            className="flex flex-col bg-background border border-border overflow-hidden group hover:border-foreground transition-colors"
          >
            <div className="aspect-[16/10] w-full overflow-hidden relative bg-surface">
              <img
                src={room.image}
                alt={room.name}
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />
            </div>

            <div className="p-6 sm:p-8 flex flex-col flex-1">
              <div className="flex items-center justify-between">
                {room.tagline ? (
                  <span className="editorial-badge text-muted">{room.tagline}</span>
                ) : <span />}
                {room.productCount === 0 ? (
                  <ComingSoonBadge label="COMING SOON" />
                ) : (
                  <span className="text-[10px] uppercase tracking-wider text-muted font-mono">
                    {room.productCount} {room.productCount === 1 ? 'Piece' : 'Pieces'}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between mt-1">
                <h2 className="text-2xl font-light text-foreground tracking-tight">
                  {room.name}
                </h2>
                <ArrowRight className="w-4 h-4 text-muted group-hover:text-foreground group-hover:translate-x-1 transition-all" />
              </div>
              <p className="text-xs sm:text-sm text-muted mt-3 leading-relaxed">
                {room.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
