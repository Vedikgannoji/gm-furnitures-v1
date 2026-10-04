import React from 'react'
import { useParams } from 'react-router-dom'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { ComingSoon } from '@/components/ui/ComingSoon'
import { mockRooms } from '@/data/mockData'

export const RoomDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>()
  const room = mockRooms.find((r) => r.slug === slug)

  const roomName = room ? room.name : 'Room Suite'

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

      <ComingSoon
        variant="page"
        eyebrow="Shop by Room Suite"
        title="COMING SOON"
        subtitle={`The ${roomName} spatial curation is currently being prepared. Room-based purchasing will be available in the upcoming release.`}
        actionLabel="Explore Available Furniture"
        actionHref="/shop"
      />
    </div>
  )
}
