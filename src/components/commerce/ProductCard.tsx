import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, Plus } from 'lucide-react'
import { Product } from '@/types'
import { formatCurrency, cn } from '@/lib/utils'
import { useWishlist } from '@/context/WishlistContext'
import { useCart } from '@/context/CartContext'

export interface ProductCardProps {
  product: Product
  className?: string
  priority?: boolean
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, className }) => {
  const { isInWishlist, toggleWishlist } = useWishlist()
  const { addToCart } = useCart()
  const [isHovered, setIsHovered] = useState(false)
  const isSaved = isInWishlist(product.id)

  const primaryImage = product.images[0]
  const secondaryImage = product.images[1] || product.images[0]

  return (
    <div
      className={cn(
        'group relative flex flex-col bg-background transition-all duration-300',
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Media Container */}
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-surface border border-border/80">
        <Link to={`/products/${product.slug}`} className="block h-full w-full">
          <img
            src={isHovered && secondaryImage ? secondaryImage : primaryImage}
            alt={product.name}
            className="h-full w-full object-cover object-center transition-all duration-500 ease-out group-hover:scale-105"
            loading="lazy"
          />
        </Link>

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 pointer-events-none">
          {product.stockStatus === 'out_of_stock' && (
            <span className="bg-foreground text-background text-[9px] font-medium tracking-widest uppercase px-2 py-0.5">
              Sold Out
            </span>
          )}
          {product.stockStatus === 'low_stock' && (
            <span className="bg-amber-100 text-amber-900 border border-amber-200 text-[9px] font-medium tracking-widest uppercase px-2 py-0.5">
              Few Units Left
            </span>
          )}
          {product.newArrival && product.stockStatus !== 'out_of_stock' && (
            <span className="bg-background text-foreground border border-border text-[9px] font-medium tracking-widest uppercase px-2 py-0.5">
              New
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            toggleWishlist(product.id, product.name)
          }}
          className={cn(
            'absolute top-3 right-3 h-8 w-8 rounded-full flex items-center justify-center transition-all duration-200 shadow-sm',
            isSaved
              ? 'bg-foreground text-background'
              : 'bg-background/90 hover:bg-background text-foreground opacity-90 sm:opacity-0 sm:group-hover:opacity-100'
          )}
          aria-label={isSaved ? 'Remove from wishlist' : 'Save to wishlist'}
        >
          <Heart
            className={cn('w-4 h-4', isSaved ? 'fill-current' : 'stroke-[1.75]')}
          />
        </button>

        {/* Quick Add overlay button */}
        {product.stockStatus !== 'out_of_stock' && (
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              addToCart(product, 1)
            }}
            className="absolute bottom-3 right-3 sm:left-3 sm:right-3 h-9 bg-background/95 hover:bg-foreground hover:text-background border border-border text-foreground text-xs uppercase tracking-wider font-medium flex items-center justify-center gap-1.5 transition-all duration-200 shadow-sm opacity-90 sm:opacity-0 sm:group-hover:opacity-100 px-3"
            title="Quick add to bag"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Add to Bag</span>
          </button>
        )}
      </div>

      {/* Details */}
      <div className="pt-3.5 flex flex-col flex-1">
        <div className="flex items-center justify-between text-[11px] text-muted tracking-wider uppercase mb-1">
          <span>{product.category}</span>
          {product.colors && product.colors.length > 1 && (
            <span className="text-[10px] text-muted/80">
              {product.colors.length} Finishes
            </span>
          )}
        </div>

        <Link
          to={`/products/${product.slug}`}
          className="text-sm font-medium text-foreground tracking-tight hover:text-muted transition-colors line-clamp-1"
        >
          {product.name}
        </Link>

        <p className="text-xs text-muted/90 mt-0.5 line-clamp-1">
          {product.material}
        </p>

        {/* Pricing */}
        <div className="mt-2.5 flex items-baseline gap-2">
          <span className="text-sm font-semibold text-foreground">
            {formatCurrency(product.price)}
          </span>
          {product.mrp > product.price && (
            <span className="text-xs text-muted line-through">
              {formatCurrency(product.mrp)}
            </span>
          )}
          {product.discount && (
            <span className="text-[10px] font-medium text-emerald-700 tracking-wide">
              {product.discount}% OFF
            </span>
          )}
        </div>

        {/* Color swatches preview */}
        {product.colors && product.colors.length > 0 && (
          <div className="mt-2 flex items-center gap-1.5 pt-1">
            {product.colors.slice(0, 4).map((c, i) => (
              <span
                key={i}
                className="w-2.5 h-2.5 rounded-full border border-black/15"
                style={{ backgroundColor: c.hex }}
                title={c.name}
              />
            ))}
            {product.colors.length > 4 && (
              <span className="text-[10px] text-muted">+{product.colors.length - 4}</span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
