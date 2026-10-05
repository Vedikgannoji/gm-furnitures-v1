import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ArrowUpRight, Award, Shield, Truck, Globe } from 'lucide-react'
import { ProductCard } from '@/components/commerce/ProductCard'
import { Category, Room, Collection } from '@/types'
import { useProducts } from '@/hooks/useProducts'

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
  const { featuredProducts: apiFeatured, newArrivals: apiNewArrivals } = useProducts()
  const featuredProducts = apiFeatured.slice(0, 4)
  const newArrivals = apiNewArrivals.slice(0, 4)

  const [categories, setCategories] = useState<Category[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [collections, setCollections] = useState<Collection[]>([])

  useEffect(() => {
    let isMounted = true
    async function loadTaxonomy() {
      try {
        const [catRes, roomRes, colRes] = await Promise.all([
          fetch('/api/categories'),
          fetch('/api/rooms'),
          fetch('/api/collections'),
        ])
        if (isMounted) {
          if (catRes.ok) setCategories(await catRes.json())
          if (roomRes.ok) setRooms(await roomRes.json())
          if (colRes.ok) setCollections(await colRes.json())
        }
      } catch (err) {
        console.error('Failed to load homepage taxonomy:', err)
      }
    }
    loadTaxonomy()
    return () => {
      isMounted = false
    }
  }, [])

  const signatureCollection = collections[0]
  const secondaryCollection = collections[1]

  const { projectsDisplay, followersDisplay, sectionRef: metricsRef } = useCredibilityMetrics(1800)

  return (
    <div className="flex flex-col space-y-8 sm:space-y-10 lg:space-y-12 pb-14 sm:pb-16">
      {/* 1. HERO SECTION */}
      <section className="relative min-h-[540px] sm:min-h-[580px] lg:h-[80vh] w-full flex items-center overflow-hidden border-b border-border">
        <div className="absolute inset-0 z-0">
          <img
            src="/hero.png"
            alt="GM Furniture Modern Interior"
            className="w-full h-full object-cover object-center sm:object-[center_35%]"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/45 to-black/30 sm:bg-gradient-to-r sm:from-black/75 sm:via-black/40 sm:to-transparent" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-28 w-full relative z-10">
          <div className="max-w-xl lg:max-w-2xl">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-light tracking-tight text-white leading-[1.1] text-balance">
              Furniture for considered spaces.
            </h1>
            <p className="mt-4 sm:mt-5 text-sm sm:text-base text-zinc-200 font-normal leading-relaxed max-w-lg drop-shadow-sm">
              Handcrafted solid wood furniture and architectural interiors by GM Group. Designed for modern living spaces across India.
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

      {/* 2. TRUST / SERVICE ASSURANCE STRIP */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full -mt-6 sm:-mt-8 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border bg-white border border-border shadow-sm">
          <div className="p-5 sm:p-6 flex items-start gap-3.5">
            <Award className="w-5 h-5 text-foreground shrink-0 mt-0.5 stroke-[1.5]" />
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                Solid Hardwood Craft
              </h4>
              <p className="text-xs text-muted mt-1 leading-relaxed">
                Traditional mortise-and-tenon joinery and organic natural matte finishes.
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
                Direct doorstep delivery with expert assembly service across India.
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
                Engineered to endure generations of daily living and age with timeless beauty.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. FROM THE HOUSE OF GM GROUP BRAND CREDIBILITY SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full -mt-2 sm:-mt-4">
        <div className="bg-white border border-border p-6 sm:p-10 lg:p-12 flex flex-col items-center text-center">
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

          <div
            ref={metricsRef}
            className="mt-6 py-6 grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-10 w-full max-w-2xl border-y border-border"
          >
            <div className="flex flex-col items-center">
              <span className="text-4xl sm:text-5xl font-light text-foreground tracking-tight tabular-nums">
                {projectsDisplay}
              </span>
              <span className="text-xs uppercase tracking-widest text-muted mt-1.5">
                projects completed in interiors and constructions
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

      {/* 4. FEATURED PIECES */}
      {featuredProducts.length > 0 && (
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
      )}

      {/* 5. SHOP BY CATEGORY */}
      {categories.length > 0 && (
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
            {categories.map((category) => (
              <Link
                key={category.id}
                to={`/shop/${category.slug}`}
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
                  <span className="text-[11px] text-muted">
                    {category.itemCount || 0} products
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 6. SHOP BY ROOM */}
      {rooms.length > 0 && (
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

          <div className="overflow-hidden w-full relative">
            <div className="flex w-max hover:[animation-play-state:paused]">
              <div className="flex shrink-0 gap-5 sm:gap-6 pr-5 sm:pr-6 animate-marquee-slow motion-reduce:animate-none">
                {rooms.map((room) => (
                  <Link
                    key={`track1-${room.id}`}
                    to={`/rooms/${room.slug}`}
                    className="w-[280px] sm:w-[340px] md:w-[380px] shrink-0 flex flex-col bg-background border border-border overflow-hidden group transition-all hover:border-foreground cursor-pointer"
                  >
                    <div className="aspect-[16/10] w-full overflow-hidden relative bg-surface">
                      <img
                        src={room.image}
                        alt={room.name}
                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      />
                    </div>
                    <div className="p-5 sm:p-6 flex flex-col flex-1 justify-between">
                      <div>
                        {room.tagline && (
                          <span className="editorial-badge text-muted">{room.tagline}</span>
                        )}
                        <h3 className="text-xl font-medium text-foreground mt-1">{room.name}</h3>
                        <p className="text-xs text-muted mt-2 leading-relaxed line-clamp-2">
                          {room.description}
                        </p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-xs">
                        <span className="font-semibold text-foreground uppercase tracking-wider text-[11px]">
                          VIEW ROOM
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-muted group-hover:text-foreground group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              <div
                className="flex shrink-0 gap-5 sm:gap-6 pr-5 sm:pr-6 animate-marquee-slow motion-reduce:animate-none"
                aria-hidden="true"
              >
                {rooms.map((room) => (
                  <Link
                    key={`track2-${room.id}`}
                    to={`/rooms/${room.slug}`}
                    className="w-[280px] sm:w-[340px] md:w-[380px] shrink-0 flex flex-col bg-background border border-border overflow-hidden group transition-all hover:border-foreground cursor-pointer"
                  >
                    <div className="aspect-[16/10] w-full overflow-hidden relative bg-surface">
                      <img
                        src={room.image}
                        alt={room.name}
                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      />
                    </div>
                    <div className="p-5 sm:p-6 flex flex-col flex-1 justify-between">
                      <div>
                        {room.tagline && (
                          <span className="editorial-badge text-muted">{room.tagline}</span>
                        )}
                        <h3 className="text-xl font-medium text-foreground mt-1">{room.name}</h3>
                        <p className="text-xs text-muted mt-2 leading-relaxed line-clamp-2">
                          {room.description}
                        </p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-xs">
                        <span className="font-semibold text-foreground uppercase tracking-wider text-[11px]">
                          VIEW ROOM
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-muted group-hover:text-foreground group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 7. FEATURED COLLECTION 1 */}
      {signatureCollection && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 pb-2.5 border-b border-border">
            <div>
              <span className="editorial-badge">Featured Line</span>
              <h2 className="text-2xl sm:text-3xl font-light text-foreground mt-1">
                {signatureCollection.name}
              </h2>
            </div>
            <Link
              to={`/collections/${signatureCollection.slug}`}
              className="text-xs uppercase tracking-widest font-medium text-foreground hover:text-muted transition-colors flex items-center gap-1 mt-2 sm:mt-0"
            >
              <span>Explore Collection</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <Link
            to={`/collections/${signatureCollection.slug}`}
            className="block relative border border-border bg-background overflow-hidden group hover:border-foreground transition-colors"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2">
              <div className="p-6 sm:p-10 lg:p-12 flex flex-col justify-center">
                <span className="editorial-badge">Design Collection</span>
                <h3 className="text-3xl sm:text-4xl font-light text-foreground mt-2 tracking-tight">
                  {signatureCollection.name}
                </h3>
                {signatureCollection.tagline && (
                  <p className="text-sm font-medium text-muted mt-2">
                    "{signatureCollection.tagline}"
                  </p>
                )}
                <p className="text-xs sm:text-sm text-muted mt-3 leading-relaxed max-w-md">
                  {signatureCollection.description}
                </p>
                <div className="mt-6 flex items-center gap-2 text-xs font-semibold text-foreground uppercase tracking-wider">
                  <span>View Collection Pieces</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              <div className="aspect-[4/3] lg:aspect-auto h-full w-full overflow-hidden bg-surface relative">
                <img
                  src={signatureCollection.image}
                  alt={signatureCollection.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
              </div>
            </div>
          </Link>
        </section>
      )}

      {/* 8. FEATURED COLLECTION 2 */}
      {secondaryCollection && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 pb-2.5 border-b border-border">
            <div>
              <span className="editorial-badge">Essentialist Design</span>
              <h2 className="text-2xl sm:text-3xl font-light text-foreground mt-1">
                {secondaryCollection.name}
              </h2>
            </div>
            <Link
              to={`/collections/${secondaryCollection.slug}`}
              className="text-xs uppercase tracking-widest font-medium text-foreground hover:text-muted transition-colors flex items-center gap-1 mt-2 sm:mt-0"
            >
              <span>Explore Collection</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <Link
            to={`/collections/${secondaryCollection.slug}`}
            className="block relative border border-border bg-background overflow-hidden group hover:border-foreground transition-colors"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2">
              <div className="aspect-[4/3] lg:aspect-auto h-full w-full overflow-hidden bg-surface order-2 lg:order-1 relative">
                <img
                  src={secondaryCollection.image}
                  alt={secondaryCollection.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
              </div>

              <div className="p-6 sm:p-10 lg:p-12 flex flex-col justify-center order-1 lg:order-2">
                <span className="editorial-badge">Clean Proportions</span>
                <h3 className="text-3xl sm:text-4xl font-light text-foreground mt-2 tracking-tight">
                  {secondaryCollection.name}
                </h3>
                {secondaryCollection.tagline && (
                  <p className="text-sm font-medium text-muted mt-2">
                    "{secondaryCollection.tagline}"
                  </p>
                )}
                <p className="text-xs sm:text-sm text-muted mt-3 leading-relaxed max-w-md">
                  {secondaryCollection.description}
                </p>
                <div className="mt-6 flex items-center gap-2 text-xs font-semibold text-foreground uppercase tracking-wider">
                  <span>View Collection Pieces</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </Link>
        </section>
      )}

      {/* 9. NEW ARRIVALS */}
      {newArrivals.length > 0 && (
        <section id="new-arrivals" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full scroll-mt-24">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 pb-2.5 border-b border-border">
            <div>
              <span className="editorial-badge">Fresh Releases</span>
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
      )}
    </div>
  )
}
