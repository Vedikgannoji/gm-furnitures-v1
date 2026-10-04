import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ArrowUpRight, Award, Shield, Truck, Globe } from 'lucide-react'
import { ProductCard } from '@/components/commerce/ProductCard'
import { ComingSoonBadge } from '@/components/ui/ComingSoon'
import { mockProducts, mockCategories, mockRooms, mockCollections } from '@/data/mockData'

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

// Explicit Data Model for Credibility Metrics
interface MetricConfig {
  value: number
  format: (current: number) => string
  finalFormatted: string
}

const METRICS_DATA: { projects: MetricConfig; followers: MetricConfig } = {
  projects: {
    value: 700,
    format: (val: number) => `${Math.floor(val)}+`,
    finalFormatted: '700+',
  },
  followers: {
    value: 276000,
    format: (val: number) => `${Math.floor(val / 1000)}K`,
    finalFormatted: '276K',
  },
}

function useCredibilityMetrics(duration: number = 1800) {
  const [projectsDisplay, setProjectsDisplay] = useState('0+')
  const [followersDisplay, setFollowersDisplay] = useState('0K')
  const sectionRef = useRef<HTMLDivElement | null>(null)
  const hasTriggeredRef = useRef(false)

  useEffect(() => {
    // Check user preference for reduced motion
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setProjectsDisplay(METRICS_DATA.projects.finalFormatted)
      setFollowersDisplay(METRICS_DATA.followers.finalFormatted)
      return
    }

    const element = sectionRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry.isIntersecting && !hasTriggeredRef.current) {
          hasTriggeredRef.current = true
          observer.disconnect()

          let startTime: number | null = null

          const animate = (currentTime: number) => {
            if (!startTime) startTime = currentTime
            const elapsed = currentTime - startTime
            const progress = Math.min(elapsed / duration, 1)

            // Quartic ease-out curve for natural, premium deceleration
            const easeProgress = 1 - Math.pow(1 - progress, 4)

            const currentProjects = easeProgress * METRICS_DATA.projects.value
            const currentFollowers = easeProgress * METRICS_DATA.followers.value

            if (progress < 1) {
              setProjectsDisplay(METRICS_DATA.projects.format(currentProjects))
              setFollowersDisplay(METRICS_DATA.followers.format(currentFollowers))
              window.requestAnimationFrame(animate)
            } else {
              setProjectsDisplay(METRICS_DATA.projects.finalFormatted)
              setFollowersDisplay(METRICS_DATA.followers.finalFormatted)
            }
          }

          window.requestAnimationFrame(animate)
        }
      },
      { threshold: 0.15 }
    )

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [duration])

  return { projectsDisplay, followersDisplay, sectionRef }
}

export const HomePage: React.FC = () => {
  const featuredProducts = mockProducts.filter((p) => p.featured).slice(0, 4)
  const newArrivals = mockProducts.filter((p) => p.newArrival).slice(0, 4)

  const signatureCollection = mockCollections.find((c) => c.slug === 'nordic-atelier') || mockCollections[1]
  const minimalistCollection = mockCollections.find((c) => c.slug === 'minimalist-line') || mockCollections[0]

  // Metric animation state
  const { projectsDisplay, followersDisplay, sectionRef: metricsRef } = useCredibilityMetrics(1800)

  return (
    <div className="flex flex-col space-y-8 sm:space-y-10 lg:space-y-12 pb-14 sm:pb-16">
      {/* 1. HERO SECTION (Full-Width Background Image + Overlayed Content) */}
      <section className="relative min-h-[540px] sm:min-h-[580px] lg:h-[80vh] w-full flex items-center overflow-hidden border-b border-border">
        {/* Full-bleed Hero Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src="/hero.png"
            alt="GM Furniture Architectural Interior"
            className="w-full h-full object-cover object-center sm:object-[center_35%]"
            loading="eager"
          />
          {/* Subtle gradient overlay ensuring typography readability without heavily darkening the image */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/45 to-black/30 sm:bg-gradient-to-r sm:from-black/75 sm:via-black/40 sm:to-transparent" />
        </div>

        {/* Content Container Overlayed on Background */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-28 w-full relative z-10">
          <div className="max-w-xl lg:max-w-2xl">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-light tracking-tight text-white leading-[1.1] text-balance">
              Furniture for considered spaces.
            </h1>
            <p className="mt-4 sm:mt-5 text-sm sm:text-base text-zinc-200 font-normal leading-relaxed max-w-lg drop-shadow-sm">
              Benchcrafted from sustainable solid hardwoods, natural stone, and Belgian textiles. Form stripped to pure necessity.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                to="/shop"
                className="h-11 px-7 bg-white text-black hover:bg-zinc-100 text-xs font-semibold uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg"
              >
                <span>Shop Furniture</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <a
                href="#new-arrivals"
                className="h-11 px-7 bg-black/30 backdrop-blur-sm hover:bg-black/50 text-white border border-white/30 text-xs font-semibold uppercase tracking-widest flex items-center gap-2 transition-all"
              >
                <span>Explore New Arrivals</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 2. RESTORED TRUST / SERVICE ASSURANCE STRIP (Compact & Premium) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full -mt-6 sm:-mt-8 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border bg-white border border-border shadow-sm">
          <div className="p-5 sm:p-6 flex items-start gap-3.5">
            <Award className="w-5 h-5 text-foreground shrink-0 mt-0.5 stroke-[1.5]" />
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                Architectural Integrity
              </h4>
              <p className="text-xs text-muted mt-1 leading-relaxed">
                Traditional mortise-and-tenon joinery and zero-VOC organic hardwax finishes.
              </p>
            </div>
          </div>

          <div className="p-5 sm:p-6 flex items-start gap-3.5">
            <Truck className="w-5 h-5 text-foreground shrink-0 mt-0.5 stroke-[1.5]" />
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                Delivery & Assembly
              </h4>
              <p className="text-xs text-muted mt-1 leading-relaxed">
                Complimentary room placement, full assembly, and packaging removal across India.
              </p>
            </div>
          </div>

          <div className="p-5 sm:p-6 flex items-start gap-3.5">
            <Shield className="w-5 h-5 text-foreground shrink-0 mt-0.5 stroke-[1.5]" />
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                10-Year Framework Warranty
              </h4>
              <p className="text-xs text-muted mt-1 leading-relaxed">
                Engineered to endure generations of daily living and age with timeless grace.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. FROM THE HOUSE OF GM GROUP BRAND CREDIBILITY SECTION (Tightened & Compact) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full -mt-2 sm:-mt-4">
        <div className="bg-white border border-border p-6 sm:p-10 lg:p-12 flex flex-col items-center text-center">
          {/* Brand Logo */}
          <div className="mb-4 flex items-center justify-center">
            <img
              src="/logo.png"
              alt="GM Group Logo"
              className="h-10 sm:h-12 w-auto object-contain"
            />
          </div>

          <span className="editorial-badge text-muted mb-1.5 tracking-[0.2em]">
            Brand Heritage
          </span>

          <h2 className="text-xl sm:text-2xl lg:text-3xl font-light tracking-tight text-foreground max-w-2xl uppercase leading-snug">
            FROM THE HOUSE OF GM GROUP OF INTERIORS AND CONSTRUCTIONS
          </h2>

          {/* Animated Metrics with Viewport Detection */}
          <div
            ref={metricsRef}
            className="mt-6 py-6 grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-10 w-full max-w-2xl border-y border-border"
          >
            <div className="flex flex-col items-center">
              <span className="text-4xl sm:text-5xl font-light text-foreground tracking-tight tabular-nums">
                {projectsDisplay}
              </span>
              <span className="text-xs uppercase tracking-widest text-muted mt-1.5">
                projects so far in interiors and constructions
              </span>
            </div>

            <div className="flex flex-col items-center">
              <span className="text-4xl sm:text-5xl font-light text-foreground tracking-tight tabular-nums">
                {followersDisplay}
              </span>
              <span className="text-xs uppercase tracking-widest text-muted mt-1.5">
                followers on Instagram
              </span>
            </div>
          </div>

          {/* CTAs: Official Instagram & Official Website */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <a
              href="https://www.instagram.com/gm_interiors9/"
              target="_blank"
              rel="noopener noreferrer"
              className="h-11 px-7 bg-foreground text-background hover:bg-black/85 text-xs font-semibold uppercase tracking-widest flex items-center gap-2.5 transition-colors shadow-sm"
            >
              <InstagramIcon className="w-4 h-4" />
              <span>Follow Us on Instagram</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
            <a
              href="https://gminteriors.co/"
              target="_blank"
              rel="noopener noreferrer"
              className="h-11 px-7 bg-foreground text-background hover:bg-black/85 text-xs font-semibold uppercase tracking-widest flex items-center gap-2.5 transition-colors shadow-sm"
            >
              <Globe className="w-4 h-4 text-background" />
              <span>Visit Official Website</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-background" />
            </a>
          </div>
        </div>
      </section>

      {/* 4. FEATURED PIECES — ACTIVE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 pb-2.5 border-b border-border">
          <div>
            <span className="editorial-badge">Featured Furniture</span>
            <h2 className="text-2xl sm:text-3xl font-light text-foreground mt-1">
              Featured Pieces
            </h2>
          </div>
          <Link
            to="/shop"
            className="text-xs uppercase tracking-widest font-medium text-foreground hover:text-muted transition-colors flex items-center gap-1 mt-2 sm:mt-0"
          >
            <span>Explore Entire Catalog</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* 5. SHOP BY CATEGORY — DINING ACTIVE, OTHERS COMING SOON */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 pb-2.5 border-b border-border">
          <div>
            <span className="editorial-badge">Categories</span>
            <h2 className="text-2xl sm:text-3xl font-light text-foreground mt-1">
              Shop by Category
            </h2>
          </div>
          <Link
            to="/shop"
            className="text-xs uppercase tracking-widest font-medium text-foreground hover:text-muted transition-colors flex items-center gap-1 mt-2 sm:mt-0"
          >
            <span>View All Categories</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {mockCategories.map((category) => {
            const isAvailable = category.slug === 'dining'

            if (isAvailable) {
              return (
                <Link
                  key={category.id}
                  to="/shop"
                  className="group flex flex-col items-start text-left cursor-pointer"
                >
                  <div className="aspect-square w-full overflow-hidden bg-surface border border-border relative">
                    <img
                      src={category.image}
                      alt={category.name}
                      className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="mt-2.5">
                    <h3 className="text-xs font-medium text-foreground uppercase tracking-wider group-hover:underline">
                      {category.name}
                    </h3>
                    <span className="text-[11px] text-muted">{category.itemCount} items</span>
                  </div>
                </Link>
              )
            }

            return (
              <div
                key={category.id}
                className="group flex flex-col items-start text-left cursor-default select-none"
              >
                <div className="aspect-square w-full overflow-hidden bg-surface border border-border relative">
                  <img
                    src={category.image}
                    alt={category.name}
                    className="h-full w-full object-cover object-center grayscale contrast-90 opacity-90 transition-none"
                  />
                  <div className="absolute inset-0 flex items-center justify-center p-2">
                    <ComingSoonBadge label="COMING SOON" />
                  </div>
                </div>
                <div className="mt-2.5">
                  <h3 className="text-xs font-medium text-muted uppercase tracking-wider">
                    {category.name}
                  </h3>
                  <span className="text-[11px] font-medium tracking-wider text-muted/70 uppercase">
                    COMING SOON
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* 6. SHOP BY ROOM — CONTINUOUS AUTO-SCROLLING CAROUSEL */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 pb-2.5 border-b border-border">
          <div>
            <span className="editorial-badge">Room Inspiration</span>
            <h2 className="text-2xl sm:text-3xl font-light text-foreground mt-1">
              Shop by Room
            </h2>
          </div>
          <Link
            to="/rooms"
            className="text-xs uppercase tracking-widest font-medium text-foreground hover:opacity-75 transition-opacity flex items-center gap-1 mt-2 sm:mt-0"
          >
            <span>View All Rooms</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Seamless Infinite Marquee Carousel */}
        <div className="overflow-hidden w-full relative">
          <div className="flex w-max hover:[animation-play-state:paused]">
            {/* Primary Track */}
            <div className="flex shrink-0 gap-5 sm:gap-6 pr-5 sm:pr-6 animate-marquee-slow motion-reduce:animate-none">
              {mockRooms.map((room) => {
                const isDining = room.slug === 'dining-room'
                return (
                  <Link
                    key={`track1-${room.id}`}
                    to={`/rooms/${room.slug}`}
                    className="w-[280px] sm:w-[340px] md:w-[380px] shrink-0 flex flex-col bg-background border border-border overflow-hidden group transition-all hover:border-foreground/50"
                  >
                    <div className="aspect-[16/10] w-full overflow-hidden relative bg-surface">
                      <img
                        src={room.image}
                        alt={room.name}
                        className={`w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-102 ${
                          !isDining ? 'opacity-85 brightness-105' : ''
                        }`}
                      />
                      {!isDining && (
                        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 bg-black py-2 sm:py-2.5 px-4 text-center z-10">
                          <span className="text-[10px] sm:text-[11px] font-bold tracking-[0.25em] text-white uppercase">
                            COMING SOON
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-5 sm:p-6 flex flex-col flex-1 justify-between">
                      <div>
                        <span className="editorial-badge text-muted">{room.tagline}</span>
                        <h3 className="text-xl font-medium text-foreground mt-1">{room.name}</h3>
                        <p className="text-xs text-muted mt-2 leading-relaxed line-clamp-2">
                          {room.description}
                        </p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-xs">
                        <span className="font-semibold text-foreground uppercase tracking-wider text-[11px]">
                          {isDining ? 'EXPLORE CATALOG →' : 'Room Preview'}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-muted group-hover:text-foreground transition-colors" />
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>

            {/* Duplicate Track (Seamless Loop) */}
            <div
              className="flex shrink-0 gap-5 sm:gap-6 pr-5 sm:pr-6 animate-marquee-slow motion-reduce:animate-none"
              aria-hidden="true"
            >
              {mockRooms.map((room) => {
                const isDining = room.slug === 'dining-room'
                return (
                  <Link
                    key={`track2-${room.id}`}
                    to={`/rooms/${room.slug}`}
                    className="w-[280px] sm:w-[340px] md:w-[380px] shrink-0 flex flex-col bg-background border border-border overflow-hidden group transition-all hover:border-foreground/50"
                  >
                    <div className="aspect-[16/10] w-full overflow-hidden relative bg-surface">
                      <img
                        src={room.image}
                        alt={room.name}
                        className={`w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-102 ${
                          !isDining ? 'opacity-85 brightness-105' : ''
                        }`}
                      />
                      {!isDining && (
                        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 bg-black py-2 sm:py-2.5 px-4 text-center z-10">
                          <span className="text-[10px] sm:text-[11px] font-bold tracking-[0.25em] text-white uppercase">
                            COMING SOON
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-5 sm:p-6 flex flex-col flex-1 justify-between">
                      <div>
                        <span className="editorial-badge text-muted">{room.tagline}</span>
                        <h3 className="text-xl font-medium text-foreground mt-1">{room.name}</h3>
                        <p className="text-xs text-muted mt-2 leading-relaxed line-clamp-2">
                          {room.description}
                        </p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-xs">
                        <span className="font-semibold text-foreground uppercase tracking-wider text-[11px]">
                          {isDining ? 'EXPLORE CATALOG →' : 'Room Preview'}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-muted group-hover:text-foreground transition-colors" />
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 7. SIGNATURE COLLECTION — COMING SOON (Clean, compact, no badge on image) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 pb-2.5 border-b border-border">
          <div>
            <span className="editorial-badge">Atelier Series</span>
            <h2 className="text-2xl sm:text-3xl font-light text-foreground mt-1">
              Signature Collection
            </h2>
          </div>
          <div className="flex items-center gap-2 mt-2 sm:mt-0">
            <ComingSoonBadge label="COMING SOON" />
          </div>
        </div>

        <div className="relative border border-border bg-background overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 select-none">
            <div className="p-6 sm:p-10 lg:p-12 flex flex-col justify-center">
              <span className="editorial-badge">Capsule Collection</span>
              <h3 className="text-3xl sm:text-4xl font-light text-foreground mt-2 tracking-tight">
                {signatureCollection.name}
              </h3>
              <p className="text-sm font-medium text-muted mt-2">
                "{signatureCollection.tagline}"
              </p>
              <p className="text-xs sm:text-sm text-muted mt-3 leading-relaxed max-w-md">
                {signatureCollection.description}
              </p>
            </div>

            <div className="aspect-[4/3] lg:aspect-auto h-full w-full overflow-hidden bg-surface relative">
              <img
                src={signatureCollection.image}
                alt={signatureCollection.name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 8. THE MINIMALIST LINE — COMING SOON (Clean, compact, no badge on image) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 pb-2.5 border-b border-border">
          <div>
            <span className="editorial-badge">Essentialist Design</span>
            <h2 className="text-2xl sm:text-3xl font-light text-foreground mt-1">
              The Minimalist Line
            </h2>
          </div>
          <div className="flex items-center gap-2 mt-2 sm:mt-0">
            <ComingSoonBadge label="COMING SOON" />
          </div>
        </div>

        <div className="relative border border-border bg-background overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 select-none">
            <div className="aspect-[4/3] lg:aspect-auto h-full w-full overflow-hidden bg-surface order-2 lg:order-1 relative">
              <img
                src={minimalistCollection.image}
                alt={minimalistCollection.name}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="p-6 sm:p-10 lg:p-12 flex flex-col justify-center order-1 lg:order-2">
              <span className="editorial-badge">Architectural Reductionism</span>
              <h3 className="text-3xl sm:text-4xl font-light text-foreground mt-2 tracking-tight">
                {minimalistCollection.name}
              </h3>
              <p className="text-sm font-medium text-muted mt-2">
                "{minimalistCollection.tagline}"
              </p>
              <p className="text-xs sm:text-sm text-muted mt-3 leading-relaxed max-w-md">
                {minimalistCollection.description}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 9. NEW ARRIVALS — ACTIVE */}
      <section id="new-arrivals" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full scroll-mt-24">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 pb-2.5 border-b border-border">
          <div>
            <span className="editorial-badge">Spring Atelier Studio</span>
            <h2 className="text-2xl sm:text-3xl font-light text-foreground mt-1">
              New Arrivals
            </h2>
          </div>
          <Link
            to="/shop"
            className="text-xs uppercase tracking-widest font-medium text-foreground hover:text-muted transition-colors flex items-center gap-1 mt-2 sm:mt-0"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          {newArrivals.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  )
}
