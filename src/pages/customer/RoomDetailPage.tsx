import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { ProductCard } from '@/components/commerce/ProductCard'
import { EmptyState } from '@/components/commerce/EmptyState'
import { ComingSoonBadge } from '@/components/ui/ComingSoon'
import { Room, Product } from '@/types'
import { Search, Loader2 } from 'lucide-react'

export const RoomDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>()
  const [room, setRoom] = useState<Room | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    async function loadRoomAndProducts() {
      if (!slug) return
      setIsLoading(true)
      try {
        const [roomRes, prodRes] = await Promise.all([
          fetch(`/api/rooms/${encodeURIComponent(slug)}`),
          fetch(`/api/products?room=${encodeURIComponent(slug)}`),
        ])

        if (isMounted) {
          if (roomRes.ok) {
            const roomData = await roomRes.json()
            setRoom(roomData)
          } else {
            // Fallback representation
            setRoom({
              id: slug,
              name: slug.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
              slug,
              tagline: 'Curated Living Space',
              description: 'Explore furniture designed for this room.',
              image: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1600&q=80',
              featuredProductIds: [],
            })
          }

          if (prodRes.ok) {
            const prodData = await prodRes.json()
            setProducts(prodData)
          }
        }
      } catch (err) {
        console.error('Failed to load room details:', err)
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    loadRoomAndProducts()
    return () => {
      isMounted = false
    }
  }, [slug])

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted mb-3" />
        <span className="text-xs text-muted">Loading room collection...</span>
      </div>
    )
  }

  if (!room) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <EmptyState
          icon={Search}
          title="Room Not Found"
          description="The room environment you requested could not be located."
          actionLabel="Return to Rooms"
          actionHref="/rooms"
        />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-12 sm:pb-16">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Rooms', href: '/rooms' },
          { label: room.name },
        ]}
        className="mb-3 sm:mb-4"
      />

      <div className="bg-white border border-border overflow-hidden mb-12">
        {room.image && (
          <div className="aspect-[21/9] w-full overflow-hidden relative bg-surface">
            <img
              src={room.image}
              alt={room.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="p-8 sm:p-12 max-w-3xl">
          {room.tagline && (
            <div className="mb-2">
              <span className="editorial-badge text-muted">{room.tagline}</span>
            </div>
          )}

          <div className="flex items-center gap-3">
            <h1 className="text-3xl sm:text-5xl font-light tracking-tight text-foreground">
              {room.name}
            </h1>
            {products.length === 0 && <ComingSoonBadge label="COMING SOON" />}
          </div>

          <p className="mt-4 text-sm sm:text-base text-muted leading-relaxed">
            {room.description}
          </p>

          <div className="mt-6 flex items-center gap-3 text-xs text-muted">
            <span className="font-semibold text-foreground">
              {products.length} {products.length === 1 ? 'Product' : 'Products'}
            </span>
            <span>•</span>
            <span>Handcrafted Solid Wood</span>
            <span>•</span>
            <span>Direct Delivery & Assembly</span>
          </div>
        </div>
      </div>

      {/* Linked Products Grid */}
      <div>
        <div className="pb-4 border-b border-border mb-8">
          <h2 className="text-xl font-semibold text-foreground tracking-tight">
            Furniture for {room.name}
          </h2>
          <p className="text-xs text-muted mt-1">
            Browse pieces curated for this living space.
          </p>
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="border border-border bg-surface p-12 sm:p-16 text-center max-w-2xl mx-auto my-6">
            <div className="mb-4">
              <ComingSoonBadge label="COMING SOON" />
            </div>
            <h2 className="text-xl sm:text-2xl font-light text-foreground uppercase tracking-tight">
              {room.name} Environment in Development
            </h2>
            <p className="mt-3 text-xs sm:text-sm text-muted leading-relaxed max-w-lg mx-auto">
              Our atelier is designing furniture pieces curated for {room.name.toLowerCase()}. Real products will appear here once published to our catalog.
            </p>
            <div className="mt-8">
              <Link
                to="/shop"
                className="inline-flex items-center gap-2 px-7 py-3 bg-foreground text-background text-xs uppercase tracking-widest font-semibold hover:bg-black/85 transition-colors shadow-sm"
              >
                EXPLORE AVAILABLE CATALOG →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
