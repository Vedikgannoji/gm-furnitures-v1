import React from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, ShoppingBag, Check } from 'lucide-react'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Button } from '@/components/ui/Button'
import { ProductCard } from '@/components/commerce/ProductCard'
import { EmptyState } from '@/components/commerce/EmptyState'
import { mockRooms, mockProducts } from '@/data/mockData'
import { formatCurrency } from '@/lib/utils'
import { useCart } from '@/context/CartContext'
import { useToast } from '@/context/ToastContext'

export const RoomDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>()
  const { addToCart, setIsCartDrawerOpen } = useCart()
  const { showToast } = useToast()

  const room = mockRooms.find((r) => r.slug === slug)

  if (!room) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <EmptyState
          icon={ArrowLeft}
          title="Room Suite Not Found"
          description="The room curation you requested is no longer available."
          actionLabel="View All Rooms"
          actionHref="/rooms"
        />
      </div>
    )
  }

  // Find products associated with this room
  const roomProducts = mockProducts.filter((p) =>
    room.featuredProductIds.includes(p.id)
  )

  const suiteSubtotal = roomProducts.reduce((sum, p) => sum + p.price, 0)

  const handleAddAllToCart = () => {
    roomProducts.forEach((p) => {
      addToCart(p, 1)
    })
    showToast(
      'Suite Added to Bag',
      `All ${roomProducts.length} pieces from the ${room.name} suite added to your bag.`,
      'success'
    )
    setIsCartDrawerOpen(true)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Rooms', href: '/rooms' },
          { label: room.name },
        ]}
        className="mb-6"
      />

      {/* Large Room Visual Banner */}
      <div className="relative aspect-[21/9] min-h-[360px] w-full overflow-hidden bg-surface border border-border mb-12">
        <img
          src={room.image}
          alt={room.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex items-end p-6 sm:p-12 text-white">
          <div className="max-w-xl">
            <span className="editorial-badge text-zinc-300 block mb-1">
              Curated Spatial Suite
            </span>
            <h1 className="text-3xl sm:text-5xl font-light tracking-tight text-white">
              {room.name}
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-zinc-300 leading-relaxed">
              "{room.tagline}"
            </p>
          </div>
        </div>
      </div>

      {/* Room Narrative & Add All Suite Bar */}
      <div className="bg-surface border border-border p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-16">
        <div className="max-w-2xl">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">
            About This Spatial Environment
          </h2>
          <p className="text-xs sm:text-sm text-muted mt-2 leading-relaxed">
            {room.description} Every element in this composition is scaled with deliberate architectural restraint, encouraging fluid circulation and calm ambiance.
          </p>
        </div>

        <div className="p-4 bg-background border border-border flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full md:w-auto shrink-0">
          <div>
            <span className="text-[10px] text-muted uppercase tracking-wider block">
              Complete {roomProducts.length}-Piece Suite
            </span>
            <span className="text-base font-semibold text-foreground">
              {formatCurrency(suiteSubtotal)}
            </span>
          </div>
          <Button
            variant="primary"
            size="md"
            onClick={handleAddAllToCart}
            className="w-full sm:w-auto flex items-center gap-2"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Add Entire Suite to Bag</span>
          </Button>
        </div>
      </div>

      {/* Products Used in this Room */}
      <div>
        <div className="flex items-end justify-between mb-8 pb-3 border-b border-border">
          <div>
            <span className="editorial-badge">Itemized Ensemble</span>
            <h2 className="text-2xl font-light text-foreground mt-1">
              Pieces Comprising This Room
            </h2>
          </div>
          <span className="text-xs text-muted">
            {roomProducts.length} Individually Purchasable Items
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {roomProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>

      {/* Bottom other rooms links */}
      <div className="mt-20 pt-10 border-t border-border">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-foreground">
            Explore Other Room Suites
          </h3>
          <Link to="/rooms" className="text-xs text-muted hover:text-foreground underline">
            All Rooms &rarr;
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {mockRooms
            .filter((r) => r.slug !== slug)
            .map((r) => (
              <Link
                key={r.id}
                to={`/rooms/${r.slug}`}
                className="group p-4 bg-surface border border-border hover:border-foreground transition-all flex items-center gap-4"
              >
                <div className="w-16 h-16 bg-background shrink-0 overflow-hidden">
                  <img src={r.image} alt={r.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h4 className="text-xs font-medium text-foreground group-hover:underline">
                    {r.name}
                  </h4>
                  <span className="text-[11px] text-muted block mt-0.5">
                    {r.featuredProductIds.length} Pieces
                  </span>
                </div>
              </Link>
            ))}
        </div>
      </div>
    </div>
  )
}
