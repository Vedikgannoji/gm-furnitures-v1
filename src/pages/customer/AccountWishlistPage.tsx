import React from 'react'
import { Link } from 'react-router-dom'
import { Heart, Trash2, ShoppingBag } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/commerce/EmptyState'
import { Product } from '@/types'
import { useWishlist } from '@/context/WishlistContext'
import { useCart } from '@/context/CartContext'
import { formatCurrency } from '@/lib/utils'

export const AccountWishlistPage: React.FC = () => {
  const { wishlistProducts, toggleWishlist } = useWishlist()
  const { addToCart, setIsCartDrawerOpen } = useCart()

  // Use only real products loaded from database / API
  const savedProducts = wishlistProducts

  const handleMoveToCart = (product: Product) => {
    addToCart(product, 1)
    toggleWishlist(product.id)
    setIsCartDrawerOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div>
          <h2 className="text-xl font-light text-foreground">Wishlist</h2>
        </div>
        <span className="text-xs text-muted font-medium">
          {savedProducts.length} {savedProducts.length === 1 ? 'Item' : 'Items'}
        </span>
      </div>

      {savedProducts.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="Your wishlist is empty."
          description="Save items you like to view them here anytime."
          actionLabel="EXPLORE CATALOG →"
          actionHref="/shop"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {savedProducts.map((product) => (
            <div
              key={product.id}
              className="bg-background border border-border flex flex-col justify-between"
            >
              <div>
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface">
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => toggleWishlist(product.id, product.name)}
                    className="absolute top-2 right-2 p-1.5 bg-background/80 hover:bg-background text-muted hover:text-rose-500 rounded-full transition-colors"
                    title="Remove from saved"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="p-4">
                  <span className="text-[10px] text-muted uppercase tracking-widest block">
                    {product.category}
                  </span>
                  <Link
                    to={`/products/${product.slug}`}
                    className="text-xs font-medium text-foreground hover:underline block truncate mt-0.5"
                  >
                    {product.name}
                  </Link>
                  <p className="text-xs font-semibold text-foreground mt-2">
                    {formatCurrency(product.price)}
                  </p>
                </div>
              </div>

              <div className="p-4 pt-0">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleMoveToCart(product)}
                  className="w-full flex items-center gap-1.5"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Move to Bag</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
