import React, { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  Heart,
  Truck,
  ShieldCheck,
  RotateCcw,
  Check,
  Star,
  Plus,
  Minus,
  ArrowRight,
  Share2,
} from 'lucide-react'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Button } from '@/components/ui/Button'
import { Accordion } from '@/components/ui/Accordion'
import { ProductCard } from '@/components/commerce/ProductCard'
import { EmptyState } from '@/components/commerce/EmptyState'
import { mockProducts } from '@/data/mockData'
import { formatCurrency, cn } from '@/lib/utils'
import { useCart } from '@/context/CartContext'
import { useWishlist } from '@/context/WishlistContext'
import { useToast } from '@/context/ToastContext'

export const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { addToCart, setIsCartDrawerOpen } = useCart()
  const { isInWishlist, toggleWishlist } = useWishlist()
  const { showToast } = useToast()

  const product = mockProducts.find((p) => p.slug === slug)

  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0)
  const [selectedColor, setSelectedColor] = useState<string>(
    product?.colors[0]?.name || 'Standard'
  )
  const [quantity, setQuantity] = useState<number>(1)

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <EmptyState
          icon={RotateCcw}
          title="Product Not Found"
          description="The furniture piece you requested is no longer available in our active catalog."
          actionLabel="Return to Catalog"
          actionHref="/shop"
        />
      </div>
    )
  }

  const isSaved = isInWishlist(product.id)
  const activeImage = product.images[selectedImageIndex] || product.images[0]

  const handleAddToCart = () => {
    addToCart(product, quantity, selectedColor)
    setIsCartDrawerOpen(true)
  }

  const handleBuyNow = () => {
    addToCart(product, quantity, selectedColor)
    navigate('/checkout')
  }

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href)
    showToast('Link Copied', 'Product URL copied to your clipboard.', 'info')
  }

  const relatedProducts = mockProducts
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 4)

  const accordionItems = [
    {
      id: 'specifications',
      title: 'Architectural Specifications',
      content: (
        <div className="divide-y divide-border/60 text-xs">
          {product.specifications.map((spec, i) => (
            <div key={i} className="py-2 flex justify-between">
              <span className="text-muted font-medium">{spec.label}</span>
              <span className="text-foreground font-normal text-right">{spec.value}</span>
            </div>
          ))}
          <div className="py-2 flex justify-between">
            <span className="text-muted font-medium">SKU</span>
            <span className="text-foreground font-mono">{product.sku}</span>
          </div>
          <div className="py-2 flex justify-between">
            <span className="text-muted font-medium">Finish</span>
            <span className="text-foreground">{product.finish || 'Natural Matte Hardwax'}</span>
          </div>
        </div>
      ),
    },
    {
      id: 'dimensions',
      title: 'Dimensions & Spatial Footprint',
      content: (
        <div className="space-y-2 text-xs">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-surface p-3 border border-border">
            <div>
              <span className="text-[10px] text-muted uppercase tracking-wider block">Width</span>
              <span className="font-semibold text-foreground text-sm">{product.dimensions.width}</span>
            </div>
            <div>
              <span className="text-[10px] text-muted uppercase tracking-wider block">Depth</span>
              <span className="font-semibold text-foreground text-sm">{product.dimensions.depth}</span>
            </div>
            <div>
              <span className="text-[10px] text-muted uppercase tracking-wider block">Height</span>
              <span className="font-semibold text-foreground text-sm">{product.dimensions.height}</span>
            </div>
            <div>
              <span className="text-[10px] text-muted uppercase tracking-wider block">Weight</span>
              <span className="font-semibold text-foreground text-sm">{product.dimensions.weight || '32 kg'}</span>
            </div>
          </div>
          {product.dimensions.seatHeight && (
            <p className="text-xs text-muted pt-1">
              Seat Height from floor: <span className="font-medium text-foreground">{product.dimensions.seatHeight}</span>
            </p>
          )}
        </div>
      ),
    },
    {
      id: 'materials-care',
      title: 'Materiality & Preservation Care',
      content: (
        <div className="space-y-3 text-xs leading-relaxed">
          <p className="text-foreground font-medium">{product.material}</p>
          <ul className="list-disc pl-4 space-y-1.5 text-muted">
            {product.careInstructions.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      ),
    },
    {
      id: 'delivery-warranty',
      title: 'White-Glove Delivery & Warranty',
      content: (
        <div className="space-y-3 text-xs leading-relaxed text-muted">
          <div className="flex items-start gap-2.5">
            <Truck className="w-4 h-4 text-foreground shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-foreground">Complimentary White-Glove Installation</p>
              <p className="mt-0.5">{product.leadTime}. Delivered by a specialized two-person freight team who unpack, position, assemble, and remove all packaging materials.</p>
            </div>
          </div>
          <div className="flex items-start gap-2.5 pt-2 border-t border-border">
            <ShieldCheck className="w-4 h-4 text-foreground shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-foreground">10-Year Framework Warranty</p>
              <p className="mt-0.5">{product.warranty}. Covers joinery defects, structural timber failure, and frame integrity.</p>
            </div>
          </div>
        </div>
      ),
    },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Shop', href: '/shop' },
          { label: product.category, href: `/shop/${product.category}` },
          { label: product.name },
        ]}
        className="mb-8"
      />

      {/* Main PDP Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
        {/* LEFT COLUMN: Gallery */}
        <div className="lg:col-span-7 flex flex-col-reverse sm:flex-row gap-4">
          {/* Thumbnails list */}
          {product.images.length > 1 && (
            <div className="flex sm:flex-col gap-3 overflow-x-auto sm:overflow-y-auto shrink-0 sm:w-20">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={cn(
                    'w-16 h-20 sm:w-20 sm:h-24 bg-surface border shrink-0 overflow-hidden transition-all duration-200',
                    selectedImageIndex === idx
                      ? 'border-foreground ring-1 ring-foreground opacity-100'
                      : 'border-border opacity-70 hover:opacity-100'
                  )}
                >
                  <img
                    src={img}
                    alt={`${product.name} thumbnail ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Large Main Showcase Image */}
          <div className="relative flex-1 aspect-[4/5] sm:aspect-square lg:aspect-[4/5] bg-surface border border-border overflow-hidden">
            <img
              src={activeImage}
              alt={product.name}
              className="w-full h-full object-cover object-center transition-all duration-300"
            />
            {/* Top badges */}
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              {product.stockStatus === 'low_stock' && (
                <span className="bg-amber-100 text-amber-900 border border-amber-200 text-[10px] font-semibold tracking-widest uppercase px-2.5 py-1">
                  Low Stock
                </span>
              )}
              {product.newArrival && (
                <span className="bg-background text-foreground border border-border text-[10px] font-semibold tracking-widest uppercase px-2.5 py-1">
                  New Arrival
                </span>
              )}
            </div>

            {/* Share action */}
            <button
              onClick={handleShare}
              className="absolute top-4 right-4 h-9 w-9 bg-background/90 hover:bg-background border border-border rounded-full flex items-center justify-center text-foreground transition-colors shadow-sm"
              title="Share piece"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: Product Information & Purchasing */}
        <div className="lg:col-span-5 flex flex-col space-y-6">
          {/* Header & Meta */}
          <div>
            <div className="flex items-center justify-between text-xs text-muted uppercase tracking-widest mb-1.5">
              <span>{product.collection.replace('-', ' ')}</span>
              <span className="font-mono text-[11px]">{product.sku}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-light tracking-tight text-foreground leading-tight">
              {product.name}
            </h1>

            {/* Rating & reviews */}
            <div className="mt-2.5 flex items-center gap-2 text-xs">
              <div className="flex items-center text-foreground">
                <Star className="w-3.5 h-3.5 fill-foreground stroke-foreground mr-1" />
                <span className="font-semibold">{product.rating}</span>
              </div>
              <span className="text-muted">•</span>
              <span className="text-muted underline cursor-pointer hover:text-foreground">
                {product.reviewCount} client appraisals
              </span>
            </div>

            {/* Pricing */}
            <div className="mt-4 flex items-baseline gap-3 pb-5 border-b border-border">
              <span className="text-2xl font-semibold text-foreground">
                {formatCurrency(product.price)}
              </span>
              {product.mrp > product.price && (
                <span className="text-sm text-muted line-through">
                  {formatCurrency(product.mrp)}
                </span>
              )}
              {product.discount && (
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 border border-emerald-200">
                  Save {product.discount}%
                </span>
              )}
            </div>
          </div>

          {/* Description */}
          <p className="text-xs sm:text-sm text-muted leading-relaxed">
            {product.description}
          </p>

          {/* Finish / Color Swatches */}
          {product.colors && product.colors.length > 0 && (
            <div className="pt-2">
              <div className="flex items-center justify-between text-xs mb-2.5">
                <span className="font-medium uppercase tracking-wider text-muted text-[11px]">
                  Finish / Upholstery:
                </span>
                <span className="font-semibold text-foreground">{selectedColor}</span>
              </div>
              <div className="flex items-center gap-2.5">
                {product.colors.map((c) => {
                  const isSelected = selectedColor === c.name
                  return (
                    <button
                      key={c.name}
                      onClick={() => setSelectedColor(c.name)}
                      className={cn(
                        'group flex items-center gap-2 px-3 py-1.5 text-xs border transition-all',
                        isSelected
                          ? 'border-foreground bg-surface font-medium'
                          : 'border-border hover:border-foreground/60 text-muted'
                      )}
                    >
                      <span
                        className="w-3 h-3 rounded-full border border-black/20 shrink-0"
                        style={{ backgroundColor: c.hex }}
                      />
                      <span>{c.name}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Quantity & Actions */}
          <div className="pt-4 border-t border-border space-y-4">
            <div className="flex items-center gap-4">
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted">
                Quantity:
              </span>
              <div className="flex items-center border border-border">
                <button
                  onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                  className="w-9 h-9 flex items-center justify-center hover:bg-surface transition-colors"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-10 text-center text-xs font-semibold">
                  {quantity}
                </span>
                <button
                  onClick={() =>
                    setQuantity((prev) => Math.min(product.stock || 10, prev + 1))
                  }
                  className="w-9 h-9 flex items-center justify-center hover:bg-surface transition-colors"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Stock status indicator */}
              <div className="text-xs">
                {product.stockStatus === 'in_stock' && (
                  <span className="text-emerald-700 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> In Stock & Ready to Dispatch
                  </span>
                )}
                {product.stockStatus === 'low_stock' && (
                  <span className="text-amber-700 font-medium">
                    Only {product.stock} units remaining in Atelier
                  </span>
                )}
                {product.stockStatus === 'out_of_stock' && (
                  <span className="text-rose-600 font-medium">
                    Made to Order (Inquire for lead time)
                  </span>
                )}
              </div>
            </div>

            {/* Main Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <Button
                variant="primary"
                size="lg"
                onClick={handleAddToCart}
                disabled={product.stockStatus === 'out_of_stock'}
                className="w-full"
              >
                Add to Bag
              </Button>
              <Button
                variant="dark"
                size="lg"
                onClick={handleBuyNow}
                disabled={product.stockStatus === 'out_of_stock'}
                className="w-full"
              >
                Buy Now
              </Button>
            </div>

            {/* Wishlist toggle bar */}
            <button
              onClick={() => toggleWishlist(product.id, product.name)}
              className={cn(
                'w-full py-2.5 border border-border text-xs uppercase tracking-wider font-medium flex items-center justify-center gap-2 transition-colors',
                isSaved ? 'bg-surface text-foreground font-semibold' : 'hover:bg-surface text-muted hover:text-foreground'
              )}
            >
              <Heart className={cn('w-4 h-4', isSaved ? 'fill-current text-foreground' : '')} />
              <span>{isSaved ? 'Saved in Your Wishlist' : 'Add to Curated Wishlist'}</span>
            </button>
          </div>

          {/* Value highlights */}
          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border text-xs text-muted">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-foreground shrink-0" />
              <span>Free White Glove Assembly</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-foreground shrink-0" />
              <span>10-Year Timber Warranty</span>
            </div>
          </div>

          {/* Accordion Specs */}
          <div className="pt-4">
            <Accordion items={accordionItems} allowMultiple defaultOpenIds={['specifications']} />
          </div>
        </div>
      </div>

      {/* RELATED PRODUCTS SECTION */}
      {relatedProducts.length > 0 && (
        <section className="mt-24 pt-14 border-t border-border">
          <div className="flex items-end justify-between mb-8 pb-3 border-b border-border">
            <div>
              <span className="editorial-badge">Considered Companions</span>
              <h2 className="text-2xl font-light text-foreground mt-1">
                Related Architectural Pieces
              </h2>
            </div>
            <Link
              to={`/shop/${product.category}`}
              className="text-xs uppercase tracking-widest font-medium text-foreground hover:text-muted transition-colors flex items-center gap-1"
            >
              <span>View Category</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
