import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ArrowUpRight, Award, Shield, Truck, Globe } from 'lucide-react'
import { ProductCard } from '@/components/commerce/ProductCard'
import { ComingSoonBadge } from '@/components/ui/ComingSoon'
import { mockProducts, mockCategories, mockRooms, mockCollections } from '@/data/mockData'
import heroImage from '@/assets/hero.png'

const InstagramIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    width="24"
    height="24"
    stroke="currentColor"
    strokeWidth="2"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
)

// Hook for smooth metric count-up from zero
function useMetricCountUp(target: number, suffix: string, duration: number = 1800) {
  const [displayValue, setDisplayValue] = useState(`0${suffix}`)
  const [hasAnimated, setHasAnimated] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    // Respect user's reduced motion preferences
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplayValue(`${target}${suffix}`)
      return
    }

    const node = containerRef.current
    if (!node) return

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true)
          observer.disconnect()

          let startTime: number | null = null
          const animate = (currentTime: number) => {
            if (!startTime) startTime = currentTime
            const elapsed = currentTime - startTime
            const progress = Math.min(elapsed / duration, 1)

            // Quartic ease-out curve for natural deceleration
            const easeOutQuart = 1 - Math.pow(1 - progress, 4)
            const current = Math.floor(easeOutQuart * target)

            if (progress < 1) {
              setDisplayValue(`${current}${suffix}`)
              window.requestAnimationFrame(animate)
            } else {
              setDisplayValue(`${target}${suffix}`)
            }
          }

          window.requestAnimationFrame(animate)
        }
      },
      { threshold: 0.25 }
    )

    observer.observe(node)

    return () => {
      observer.disconnect()
    }
  }, [target, suffix, duration, hasAnimated])

  return { displayValue, containerRef }
}

export const HomePage: React.FC = () => {
  const featuredProducts = mockProducts.filter((p) => p.featured).slice(0, 4)
  const newArrivals = mockProducts.filter((p) => p.newArrival).slice(0, 4)

  const signatureCollection = mockCollections.find((c) => c.slug === 'nordic-atelier') || mockCollections[1]
  const minimalistCollection = mockCollections.find((c) => c.slug === 'minimalist-line') || mockCollections[0]

  // Metric animations for GM Group credibility section
  const { displayValue: projectsCount, containerRef: metricsRef } = useMetricCountUp(700, '+', 1800)
  const { displayValue: followersCount } = useMetricCountUp(276, 'K', 1800)

  return (
    <div className="flex flex-col space-y-24 sm:space-y-32 pb-24">
      {/* 1. HERO SECTION */}
      <section className="relative min-h-[600px] lg:h-[82vh] w-full bg-[#111111] text-white flex items-center overflow-hidden border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 max-w-2xl z-10">
            <span className="editorial-badge text-zinc-400 mb-3 block tracking-[0.2em]">
              Architectural Living / Edition 2026
            </span>
            <h1 className="text-4xl sm:text-6xl font-light tracking-tight text-white leading-[1.1]">
              Furniture for considered spaces.
            </h1>
            <p className="mt-5 text-sm sm:text-base text-zinc-300 font-normal leading-relaxed max-w-lg">
              Benchcrafted from sustainable solid hardwoods, natural stone, and Belgian textiles. Form stripped to pure necessity.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                to="/shop"
                className="h-12 px-7 bg-white text-black hover:bg-zinc-100 text-xs font-semibold uppercase tracking-widest flex items-center gap-2 transition-all shadow-md"
              >
                <span>Shop Furniture</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <a
                href="#new-arrivals"
                className="h-12 px-7 bg-transparent hover:bg-white/10 text-white border border-zinc-700 text-xs font-semibold uppercase tracking-widest flex items-center gap-2 transition-all"
              >
                <span>Explore New Arrivals</span>
              </a>
            </div>
          </div>

          <div className="lg:col-span-5 flex items-center justify-center relative">
            <div className="relative w-full max-w-[360px] aspect-square flex items-center justify-center p-8 bg-zinc-900/40 border border-zinc-800/80 shadow-2xl">
              <img
                src={heroImage}
                alt="GM Furniture Atelier"
                className="w-auto h-auto max-w-full max-h-[300px] object-contain transition-transform duration-700 hover:scale-105"
                loading="eager"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 2. RESTORED TRUST / SERVICE ASSURANCE STRIP */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full -mt-6 sm:-mt-10 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border bg-white border border-border shadow-sm">
          <div className="p-6 sm:p-8 flex items-start gap-4">
            <Award className="w-5 h-5 text-foreground shrink-0 mt-0.5 stroke-[1.5]" />
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                Architectural Integrity
              </h4>
              <p className="text-xs text-muted mt-1.5 leading-relaxed">
                Traditional mortise-and-tenon joinery and zero-VOC organic hardwax finishes.
              </p>
            </div>
          </div>

          <div className="p-6 sm:p-8 flex items-start gap-4">
            <Truck className="w-5 h-5 text-foreground shrink-0 mt-0.5 stroke-[1.5]" />
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                White-Glove Assembly
              </h4>
              <p className="text-xs text-muted mt-1.5 leading-relaxed">
                Complimentary room placement, full assembly, and packaging recycling across India.
              </p>
            </div>
          </div>

          <div className="p-6 sm:p-8 flex items-start gap-4">
            <Shield className="w-5 h-5 text-foreground shrink-0 mt-0.5 stroke-[1.5]" />
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                10-Year Framework Warranty
              </h4>
              <p className="text-xs text-muted mt-1.5 leading-relaxed">
                Engineered to endure generations of daily living and age with timeless grace.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. FROM THE HOUSE OF GM GROUP BRAND CREDIBILITY SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="bg-white border border-border p-8 sm:p-14 lg:p-16 flex flex-col items-center text-center">
          {/* Logo Placeholder */}
          <div className="w-16 h-16 border-2 border-foreground flex items-center justify-center mb-6 bg-white shadow-sm">
            <span className="text-sm font-bold tracking-[0.25em] text-foreground">
              GM
            </span>
          </div>

          <span className="editorial-badge text-muted mb-2 tracking-[0.2em]">
            Brand Heritage & Pedigree
          </span>

          <h2 className="text-xl sm:text-3xl font-light tracking-tight text-foreground max-w-2xl uppercase leading-snug">
            FROM THE HOUSE OF GM GROUP OF INTERIORS AND CONSTRUCTIONS
          </h2>

          {/* Animated Metrics with Viewport Detection */}
          <div
            ref={metricsRef}
            className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-12 w-full max-w-2xl py-8 border-y border-border"
          >
            <div className="flex flex-col items-center">
              <span className="text-4xl sm:text-5xl font-light text-foreground tracking-tight tabular-nums">
                {projectsCount}
              </span>
              <span className="text-xs uppercase tracking-widest text-muted mt-2">
                projects so far in interiors and constructions
              </span>
            </div>

            <div className="flex flex-col items-center">
              <span className="text-4xl sm:text-5xl font-light text-foreground tracking-tight tabular-nums">
                {followersCount}
              </span>
              <span className="text-xs uppercase tracking-widest text-muted mt-2">
                followers on Instagram
              </span>
            </div>
          </div>

          {/* CTAs: Official Instagram & Official Website */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <a
              href="https://www.instagram.com/gm_interiors9/"
              target="_blank"
              rel="noopener noreferrer"
              className="h-12 px-8 bg-foreground text-background hover:bg-black/85 text-xs font-semibold uppercase tracking-widest flex items-center gap-2.5 transition-colors shadow-sm"
            >
              <InstagramIcon className="w-4 h-4" />
              <span>Follow Us on Instagram</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
            <a
              href="https://gminteriors.co/"
              target="_blank"
              rel="noopener noreferrer"
              className="h-12 px-8 bg-surface hover:bg-surface-subtle text-foreground border border-border text-xs font-semibold uppercase tracking-widest flex items-center gap-2.5 transition-colors"
            >
              <Globe className="w-4 h-4 text-muted" />
              <span>Visit Official Website</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-muted" />
            </a>
          </div>
          <span className="text-[11px] text-muted tracking-wider mt-3">
            Official Instagram: @gm_interiors9 · gminteriors.co
          </span>
        </div>
      </section>

      {/* 4. FEATURED PIECES — ACTIVE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 pb-3 border-b border-border">
          <div>
            <span className="editorial-badge">Curated Icons</span>
            <h2 className="text-2xl sm:text-3xl font-light text-foreground mt-1">
              Featured Pieces
            </h2>
          </div>
          <Link
            to="/shop"
            className="text-xs uppercase tracking-widest font-medium text-foreground hover:text-muted transition-colors flex items-center gap-1 mt-3 sm:mt-0"
          >
            <span>Explore Entire Catalog</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* 5. SHOP BY CATEGORY — ACTIVE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 pb-3 border-b border-border">
          <div>
            <span className="editorial-badge">Architectural Form</span>
            <h2 className="text-2xl sm:text-3xl font-light text-foreground mt-1">
              Shop by Category
            </h2>
          </div>
          <Link
            to="/shop"
            className="text-xs uppercase tracking-widest font-medium text-foreground hover:text-muted transition-colors flex items-center gap-1 mt-3 sm:mt-0"
          >
            <span>View All Categories</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {mockCategories.map((category) => (
            <Link
              key={category.id}
              to={`/shop/${category.slug}`}
              className="group flex flex-col items-start text-left"
            >
              <div className="aspect-square w-full overflow-hidden bg-surface border border-border relative">
                <img
                  src={category.image}
                  alt={category.name}
                  className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="mt-3">
                <h3 className="text-xs font-medium text-foreground uppercase tracking-wider group-hover:underline">
                  {category.name}
                </h3>
                <span className="text-[11px] text-muted">{category.itemCount} items</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 6. SHOP BY ROOM — COMING SOON (Vibrant imagery with subtle unreleased badges) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 pb-3 border-b border-border">
          <div>
            <span className="editorial-badge">Curated Spatial Environments</span>
            <h2 className="text-2xl sm:text-3xl font-light text-foreground mt-1">
              Shop by Room
            </h2>
          </div>
          <div className="flex items-center gap-2 mt-3 sm:mt-0">
            <ComingSoonBadge label="COMING SOON" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 select-none">
          {mockRooms.slice(0, 2).map((room) => (
            <div
              key={room.id}
              className="relative flex flex-col bg-background border border-border overflow-hidden group"
            >
              <div className="aspect-[16/10] w-full overflow-hidden relative bg-surface">
                {/* Full-color vibrant image preserved */}
                <img
                  src={room.image}
                  alt={room.name}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-102"
                />
                <ComingSoonBadge label="COMING SOON" className="absolute top-4 left-4 z-10" />
              </div>
              <div className="p-6 sm:p-8 flex flex-col justify-between flex-1">
                <div>
                  <span className="editorial-badge text-muted">Curated Space</span>
                  <h3 className="text-xl font-medium text-foreground mt-1">{room.name}</h3>
                  <p className="text-xs text-muted mt-2 leading-relaxed">
                    {room.description}
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-border flex items-center justify-between text-xs">
                  <span className="text-muted">Spatial Environment Preview</span>
                  <span className="text-[10px] tracking-widest uppercase bg-zinc-100 text-zinc-600 px-3 py-1 font-medium border border-border cursor-not-allowed">
                    Preview Only
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 7. SIGNATURE COLLECTION — COMING SOON (Vibrant imagery with subtle unreleased badges) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 pb-3 border-b border-border">
          <div>
            <span className="editorial-badge">Atelier Series</span>
            <h2 className="text-2xl sm:text-3xl font-light text-foreground mt-1">
              Signature Collection
            </h2>
          </div>
          <div className="flex items-center gap-2 mt-3 sm:mt-0">
            <ComingSoonBadge label="COMING SOON" />
          </div>
        </div>

        <div className="relative border border-border bg-background overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 select-none">
            <div className="p-8 sm:p-14 lg:p-16 flex flex-col justify-between">
              <div>
                <span className="editorial-badge">Capsule Collection</span>
                <h3 className="text-3xl sm:text-4xl font-light text-foreground mt-2 tracking-tight">
                  {signatureCollection.name}
                </h3>
                <p className="text-sm font-medium text-muted mt-2">
                  "{signatureCollection.tagline}"
                </p>
                <p className="text-xs sm:text-sm text-muted mt-4 leading-relaxed max-w-md">
                  {signatureCollection.description}
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-border flex items-center justify-between">
                <span className="text-xs text-muted uppercase tracking-wider">
                  Handcrafted Atelier Series
                </span>
                <span className="text-[10px] uppercase font-semibold tracking-widest bg-zinc-100 text-zinc-700 px-3 py-1 border border-border">
                  Unreleased Capsule · Preview Only
                </span>
              </div>
            </div>

            <div className="aspect-[4/3] lg:aspect-auto h-full w-full overflow-hidden bg-surface relative">
              {/* Full-color vibrant image preserved */}
              <img
                src={signatureCollection.image}
                alt={signatureCollection.name}
                className="w-full h-full object-cover"
              />
              <ComingSoonBadge label="COMING SOON" className="absolute top-4 left-4 z-10" />
            </div>
          </div>
        </div>
      </section>

      {/* 8. THE MINIMALIST LINE — COMING SOON (Vibrant imagery with subtle unreleased badges) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 pb-3 border-b border-border">
          <div>
            <span className="editorial-badge">Essentialist Design</span>
            <h2 className="text-2xl sm:text-3xl font-light text-foreground mt-1">
              The Minimalist Line
            </h2>
          </div>
          <div className="flex items-center gap-2 mt-3 sm:mt-0">
            <ComingSoonBadge label="COMING SOON" />
          </div>
        </div>

        <div className="relative border border-border bg-background overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 select-none">
            <div className="aspect-[4/3] lg:aspect-auto h-full w-full overflow-hidden bg-surface order-2 lg:order-1 relative">
              {/* Full-color vibrant image preserved */}
              <img
                src={minimalistCollection.image}
                alt={minimalistCollection.name}
                className="w-full h-full object-cover"
              />
              <ComingSoonBadge label="COMING SOON" className="absolute top-4 left-4 z-10" />
            </div>

            <div className="p-8 sm:p-14 lg:p-16 flex flex-col justify-between order-1 lg:order-2">
              <div>
                <span className="editorial-badge">Architectural Reductionism</span>
                <h3 className="text-3xl sm:text-4xl font-light text-foreground mt-2 tracking-tight">
                  {minimalistCollection.name}
                </h3>
                <p className="text-sm font-medium text-muted mt-2">
                  "{minimalistCollection.tagline}"
                </p>
                <p className="text-xs sm:text-sm text-muted mt-4 leading-relaxed max-w-md">
                  {minimalistCollection.description}
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-border flex items-center justify-between">
                <span className="text-xs text-muted uppercase tracking-wider">
                  Pure Geometric Grace
                </span>
                <span className="text-[10px] uppercase font-semibold tracking-widest bg-zinc-100 text-zinc-700 px-3 py-1 border border-border">
                  Unreleased Capsule · Preview Only
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 9. NEW ARRIVALS — ACTIVE */}
      <section id="new-arrivals" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full scroll-mt-24">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 pb-3 border-b border-border">
          <div>
            <span className="editorial-badge">Spring Atelier Studio</span>
            <h2 className="text-2xl sm:text-3xl font-light text-foreground mt-1">
              New Arrivals
            </h2>
          </div>
          <Link
            to="/shop"
            className="text-xs uppercase tracking-widest font-medium text-foreground hover:text-muted transition-colors flex items-center gap-1 mt-3 sm:mt-0"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {newArrivals.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  )
}
