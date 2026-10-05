import React from 'react'
import { Link } from 'react-router-dom'
import { Trash2, ShoppingBag, ArrowRight, ShieldCheck, Truck, Plus, Minus } from 'lucide-react'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/commerce/EmptyState'
import { useCart } from '@/context/CartContext'
import { formatCurrency } from '@/lib/utils'

export const CartPage: React.FC = () => {
  const {
    items,
    updateQuantity,
    removeFromCart,
    clearCart,
    subtotal,
    assemblyCharge,
    convenienceFee,
    convenienceFeePercent,
    gst,
    gstPercent,
    total,
    cartCount,
  } = useCart()

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-12 sm:pb-16">
        <Breadcrumbs items={[{ label: 'Shopping Bag' }]} className="mb-3 sm:mb-4" />
        <EmptyState
          icon={ShoppingBag}
          title="Your shopping bag is empty"
          description="You have not added any furniture to your shopping bag yet. Explore our catalog to find pieces you love."
          actionLabel="EXPLORE CATALOG →"
          actionHref="/shop"
        />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-12 sm:pb-16">
      <Breadcrumbs items={[{ label: 'Shopping Bag' }]} className="mb-3 sm:mb-4" />

      {/* Title */}
      <div className="flex items-end justify-between mb-6 sm:mb-8 pb-4 border-b border-border">
        <div>
          <span className="editorial-badge">Review Selection</span>
          <h1 className="text-2xl sm:text-4xl font-light text-foreground mt-1 tracking-tight">
            Your Shopping Bag ({cartCount} {cartCount === 1 ? 'item' : 'items'})
          </h1>
        </div>
        <button
          onClick={clearCart}
          className="text-xs text-muted hover:text-rose-600 transition-colors underline"
        >
          Clear Bag
        </button>
      </div>

      {/* Cart Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Items List (Left) */}
        <div className="lg:col-span-8 divide-y divide-border border-y border-border">
          {items.map((item) => (
            <div
              key={`${item.product.id}-${item.selectedColor}`}
              className="py-6 flex flex-col sm:flex-row gap-6 items-start justify-between"
            >
              {/* Product Media */}
              <div className="flex gap-4 items-start w-full sm:w-auto">
                <div className="w-24 h-28 bg-surface shrink-0 border border-border overflow-hidden">
                  <img
                    src={item.product.images[0]}
                    alt={item.product.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div>
                  <span className="text-[10px] text-muted uppercase tracking-widest block">
                    {item.product.category}
                  </span>
                  <Link
                    to={`/products/${item.product.slug}`}
                    className="text-sm sm:text-base font-medium text-foreground hover:text-muted transition-colors line-clamp-1 mt-0.5"
                  >
                    {item.product.name}
                  </Link>
                  <p className="text-xs text-muted mt-1">
                    Finish: <span className="text-foreground font-medium">{item.selectedColor}</span>
                  </p>
                  <p className="text-[11px] text-muted font-mono mt-0.5">
                    SKU: {item.product.sku}
                  </p>
                  <p className="text-xs font-semibold text-foreground mt-2 sm:hidden">
                    {formatCurrency(item.product.price * item.quantity)}
                  </p>
                </div>
              </div>

              {/* Stepper and Price (Right) */}
              <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-4 pt-2 sm:pt-0">
                <div className="flex items-center border border-border">
                  <button
                    onClick={() =>
                      updateQuantity(
                        item.product.id,
                        item.quantity - 1,
                        item.selectedColor
                      )
                    }
                    className="w-8 h-8 flex items-center justify-center text-xs hover:bg-surface transition-colors"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-9 text-center text-xs font-semibold">
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
                    className="w-8 h-8 flex items-center justify-center text-xs hover:bg-surface transition-colors"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                <div className="hidden sm:block text-right">
                  <span className="text-sm font-semibold text-foreground block">
                    {formatCurrency(item.product.price * item.quantity)}
                  </span>
                  {item.quantity > 1 && (
                    <span className="text-[11px] text-muted">
                      ({formatCurrency(item.product.price)} each)
                    </span>
                  )}
                </div>

                <button
                  onClick={() => removeFromCart(item.product.id, item.selectedColor)}
                  className="text-muted hover:text-rose-600 transition-colors p-1 flex items-center gap-1 text-xs"
                  aria-label="Remove item"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Remove</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary Card (Right) */}
        <div className="lg:col-span-4 bg-surface border border-border p-6 sm:p-8 sticky top-24">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-foreground pb-4 border-b border-border">
            Order Summary
          </h2>

          <div className="space-y-3 pt-5 text-xs">
            <div className="flex justify-between">
              <span className="text-muted">Product Price</span>
              <span className="font-semibold text-foreground">{formatCurrency(subtotal)}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-muted">Assembly Charge</span>
              <span className="font-semibold text-foreground">{formatCurrency(assemblyCharge)}</span>
            </div>

            {convenienceFeePercent > 0 && (
              <div className="flex justify-between">
                <span className="text-muted">Convenience Fee ({convenienceFeePercent}%)</span>
                <span className="font-semibold text-foreground">{formatCurrency(convenienceFee)}</span>
              </div>
            )}

            <div className="flex justify-between">
              <span className="text-muted">GST on Convenience Fee ({gstPercent}%)</span>
              <span className="font-semibold text-foreground">{formatCurrency(gst)}</span>
            </div>

            <div className="pt-4 border-t border-border flex justify-between items-baseline">
              <span className="text-sm font-semibold uppercase tracking-wider text-foreground">
                Grand Total
              </span>
              <span className="text-xl font-bold text-foreground">
                {formatCurrency(total)}
              </span>
            </div>
          </div>

          {/* Checkout CTA */}
          <div className="mt-8 space-y-3">
            <Link to="/checkout" className="w-full block">
              <Button variant="primary" size="lg" className="w-full justify-between">
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>

            <Link to="/shop" className="w-full block">
              <Button variant="outline" size="md" className="w-full">
                Continue Shopping
              </Button>
            </Link>
          </div>

          {/* Assurance guarantees */}
          <div className="mt-6 pt-5 border-t border-border space-y-2 text-[11px] text-muted">
            <p className="flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-foreground shrink-0" />
              <span>10-Year Framework Structure Warranty</span>
            </p>
            <p className="flex items-center gap-2">
              <Truck className="w-3.5 h-3.5 text-foreground shrink-0" />
              <span>Doorstep delivery & expert assembly service</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
