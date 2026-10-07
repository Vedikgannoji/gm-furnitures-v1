import React, { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Drawer } from '@/components/ui/Drawer'
import { Button } from '@/components/ui/Button'
import { useCart } from '@/context/CartContext'
import { formatCurrency } from '@/lib/utils'
import { Trash2, ShoppingBag, ArrowRight } from 'lucide-react'
import { EmptyState } from './EmptyState'

export const QuickCartDrawer: React.FC = () => {
  const location = useLocation()
  const {
    items,
    isCartDrawerOpen,
    setIsCartDrawerOpen,
    removeFromCart,
    updateQuantity,
    subtotal,
    cartCount,
  } = useCart()

  // Automatically close cart drawer on any route/location change
  useEffect(() => {
    setIsCartDrawerOpen(false)
  }, [location.pathname, location.search, location.hash, setIsCartDrawerOpen])

  return (
    <Drawer
      isOpen={isCartDrawerOpen}
      onClose={() => setIsCartDrawerOpen(false)}
      position="right"
      title={`Shopping Bag (${cartCount})`}
      width="max-w-md"
    >
      {items.length === 0 ? (
        <div className="flex flex-col h-full justify-between">
          <EmptyState
            icon={ShoppingBag}
            title="Your shopping bag is empty"
            description="Explore our furniture collection to begin outfitting your space."
            actionLabel="EXPLORE CATALOG →"
            actionHref="/shop"
            onAction={() => setIsCartDrawerOpen(false)}
          />

          <div className="px-4 pb-8 w-full max-w-sm mx-auto -mt-6">
            <div className="pt-4 border-t border-border flex flex-col items-center">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-muted mb-2.5">
                Explore Categories
              </span>
              <div className="flex flex-wrap justify-center gap-1.5">
                {[
                  { name: 'Living Room', path: '/shop?category=living' },
                  { name: 'Dining', path: '/shop?category=dining' },
                  { name: 'Bedroom', path: '/shop?category=bedroom' },
                  { name: 'Office', path: '/shop?category=office' },
                ].map((cat) => (
                  <Link
                    key={cat.name}
                    to={cat.path}
                    onClick={() => setIsCartDrawerOpen(false)}
                    className="px-2.5 py-1 text-[11px] font-medium border border-border bg-surface hover:bg-foreground hover:text-background transition-colors uppercase tracking-wider"
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col h-full justify-between">
          {/* Items List */}
          <div className="divide-y divide-border flex-1 overflow-y-auto pr-1">
            {items.map((item) => (
              <div
                key={`${item.product.id}-${item.selectedColor}`}
                className="py-4 flex gap-4 items-start"
              >
                <Link
                  to={`/products/${item.product.slug}`}
                  onClick={() => setIsCartDrawerOpen(false)}
                  className="w-20 h-24 bg-surface shrink-0 border border-border overflow-hidden block hover:opacity-85 transition-opacity"
                  title={item.product.name}
                >
                  <img
                    src={item.product.images[0]}
                    alt={item.product.name}
                    className="w-full h-full object-cover"
                  />
                </Link>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <Link
                        to={`/products/${item.product.slug}`}
                        onClick={() => setIsCartDrawerOpen(false)}
                        className="text-xs font-medium text-foreground hover:text-muted transition-colors line-clamp-1"
                      >
                        {item.product.name}
                      </Link>
                      <p className="text-[11px] text-muted mt-0.5">
                        Finish: {item.selectedColor}
                      </p>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.product.id, item.selectedColor)}
                      className="text-muted/70 hover:text-foreground transition-colors p-1"
                      aria-label="Remove item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    {/* Stepper */}
                    <div className="flex items-center border border-border">
                      <button
                        onClick={() =>
                          updateQuantity(
                            item.product.id,
                            item.quantity - 1,
                            item.selectedColor
                          )
                        }
                        className="w-7 h-7 flex items-center justify-center text-xs hover:bg-surface transition-colors"
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-xs font-medium">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(
                            item.product.id,
                            item.quantity + 1,
                            item.selectedColor
                          )
                        }
                        className="w-7 h-7 flex items-center justify-center text-xs hover:bg-surface transition-colors"
                      >
                        +
                      </button>
                    </div>

                    <span className="text-xs font-semibold text-foreground">
                      {formatCurrency(item.product.price * item.quantity)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Drawer Footer */}
          <div className="pt-4 mt-auto border-t border-border">
            <div className="flex justify-between items-center text-xs mb-1">
              <span className="text-muted">Products Subtotal</span>
              <span className="font-semibold text-foreground text-sm">
                {formatCurrency(subtotal)}
              </span>
            </div>
            <p className="text-[11px] text-muted mb-4">
              Assembly charge, convenience fee & GST calculated at checkout.
            </p>

            <div className="flex flex-col gap-2">
              <Link
                to="/checkout"
                onClick={() => setIsCartDrawerOpen(false)}
                className="w-full"
              >
                <Button variant="primary" size="lg" className="w-full justify-between">
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link
                to="/cart"
                onClick={() => setIsCartDrawerOpen(false)}
                className="w-full"
              >
                <Button variant="secondary" size="md" className="w-full">
                  View Full Bag
                </Button>
              </Link>
              <button
                type="button"
                onClick={() => setIsCartDrawerOpen(false)}
                className="w-full py-1 text-[11px] font-semibold text-muted hover:text-foreground uppercase tracking-widest transition-colors text-center"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      )}
    </Drawer>
  )
}
