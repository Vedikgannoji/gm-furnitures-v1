import React, { useState, useEffect, useRef } from 'react'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { ArrowUpRight, Award } from 'lucide-react'

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

const GlobeIcon: React.FC<{ className?: string }> = ({ className }) => (
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
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
)

export const AboutPage: React.FC = () => {
  // Gallery state supporting dynamic images up to 6 without breaking if missing
  const [galleryImages, setGalleryImages] = useState<string[]>([
    '/about-gallery/1.png',
    '/about-gallery/2.png',
    '/about-gallery/3.png',
    '/about-gallery/4.png',
    '/about-gallery/5.png',
    '/about-gallery/6.png',
  ])

  const handleImageError = (failedSrc: string) => {
    setGalleryImages((prev) => prev.filter((src) => src !== failedSrc))
  }

  // Animated Metrics (0 -> 100%, 0 -> 10-Yr, 0 -> Zero, 0 -> 3,400+)
  const metricsRef = useRef<HTMLDivElement>(null)
  const [hasAnimated, setHasAnimated] = useState(false)
  const [hardwoodVal, setHardwoodVal] = useState('0%')
  const [warrantyVal, setWarrantyVal] = useState('0-Yr')
  const [vocVal, setVocVal] = useState('0')
  const [residencesVal, setResidencesVal] = useState('0+')

  useEffect(() => {
    const el = metricsRef.current
    if (!el) return

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (prefersReducedMotion) {
      setHardwoodVal('100%')
      setWarrantyVal('10-Yr')
      setVocVal('Zero')
      setResidencesVal('3,400+')
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true)
          const startTime = performance.now()
          const duration = 1800

          const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime
            const progress = Math.min(1, elapsed / duration)
            const easeOutQuart = 1 - Math.pow(1 - progress, 4)

            const curHardwood = Math.round(easeOutQuart * 100)
            const curWarranty = Math.round(easeOutQuart * 10)
            const curResidences = Math.round(easeOutQuart * 3400)

            setHardwoodVal(`${curHardwood}%`)
            setWarrantyVal(`${curWarranty}-Yr`)
            setVocVal(progress > 0.4 ? 'Zero' : '0')
            setResidencesVal(
              curResidences >= 1000
                ? `${(curResidences / 1000).toFixed(1).replace('.0', '')},${(curResidences % 1000).toString().padStart(3, '0')}+`
                : `${curResidences}+`
            )

            if (progress < 1) {
              requestAnimationFrame(animate)
            } else {
              setHardwoodVal('100%')
              setWarrantyVal('10-Yr')
              setVocVal('Zero')
              setResidencesVal('3,400+')
            }
          }

          requestAnimationFrame(animate)
        }
      },
      { threshold: 0.15 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [hasAnimated])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-12 sm:pb-16 space-y-8 sm:space-y-10 lg:space-y-12">
      <Breadcrumbs items={[{ label: 'Our Story' }]} className="mb-2 sm:mb-3" />

      {/* 1. INTRO / MANIFESTO (Centered, compact editorial block) */}
      <section className="max-w-3xl mx-auto text-center pt-1 sm:pt-2">
        <span className="editorial-badge text-muted mb-2 block tracking-[0.2em]">
          Our Heritage & Philosophy
        </span>
        <h1 className="text-2xl sm:text-4xl lg:text-[40px] font-light text-foreground tracking-tight leading-[1.22] max-w-2xl mx-auto">
          "We do not create disposable fashion. We shape quiet architectural monuments for everyday life."
        </h1>
        <div className="mt-4 sm:mt-5 space-y-2 text-xs sm:text-sm text-muted leading-relaxed max-w-2xl mx-auto">
          <p className="font-medium text-foreground">
            GM Furniture is an integral part of GM Group.
          </p>
          <p>
            GM Group, established in 2006 by the Vavilala family, proudly serves South India with expert residential and commercial architectural solutions. With deep roots in the Telugu states, we specialize in creating stylish, functional spaces tailored to your needs. Our experienced team is dedicated to delivering quality craftsmanship, innovative designs, and reliable service, making GM Group your trusted partner for architectural and interior design projects.
          </p>
        </div>
      </section>

      {/* 2. FROM THE HOUSE OF GM GROUP BRAND CREDIBILITY SECTION (Tightened) */}
      <section className="w-full">
        <div className="bg-white border border-border p-6 sm:p-8 lg:p-10 flex flex-col items-center text-center shadow-sm">
          {/* Logo Placeholder */}
          <div className="w-13 h-13 border-2 border-foreground flex items-center justify-center mb-3 bg-white shadow-sm">
            <span className="text-sm font-bold tracking-[0.25em] text-foreground">
              GM
            </span>
          </div>

          <span className="editorial-badge text-muted mb-1 tracking-[0.2em]">
            Brand Heritage
          </span>

          <h2 className="text-xl sm:text-2xl lg:text-3xl font-light tracking-tight text-foreground max-w-2xl uppercase leading-snug">
            FROM THE HOUSE OF GM GROUP OF INTERIORS AND CONSTRUCTIONS
          </h2>

          <p className="mt-2.5 text-xs sm:text-sm text-muted max-w-xl leading-relaxed">
            Delivering exceptional architectural craftsmanship, turnkey execution, and bespoke interior spaces across Hyderabad and South India since 2006.
          </p>

          {/* Dual Black CTAs */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
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
              <GlobeIcon className="w-4 h-4 text-background" />
              <span>Visit Official Website</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-background" />
            </a>
          </div>
        </div>
      </section>

      {/* 3. AWARDS SECTION (Compact & Refined) */}
      <section className="w-full">
        <div className="bg-surface border border-border p-5 sm:p-7 flex flex-col md:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-4 text-left">
            <div className="w-11 h-11 bg-white border border-border flex items-center justify-center shrink-0">
              <Award className="w-5 h-5 text-foreground stroke-[1.5]" />
            </div>
            <div>
              <span className="editorial-badge text-muted tracking-widest">Industry Recognition</span>
              <h3 className="text-base sm:text-lg font-medium text-foreground mt-0.5">
                The Times of India Design & Architecture Honor
              </h3>
              <p className="text-xs text-muted mt-0.5 leading-relaxed max-w-xl">
                Recognized for architectural distinction, precision furniture craftsmanship, and enduring residential execution across South India.
              </p>
            </div>
          </div>
          <div className="shrink-0 px-4 py-2 border border-border bg-white text-center">
            <span className="text-[10px] uppercase tracking-widest text-muted block">Presented By</span>
            <span className="text-xs font-semibold tracking-wider text-foreground uppercase block mt-0.5">
              Times of India
            </span>
          </div>
        </div>
      </section>

      {/* 4. GALLERY (Continuous seamless infinite marquee, slow premium speed) */}
      {galleryImages.length > 0 && (
        <section className="w-full space-y-3">
          <div className="flex items-end justify-between pb-2 border-b border-border">
            <div>
              <span className="editorial-badge text-muted">Visual Archive</span>
              <h2 className="text-xl sm:text-2xl font-light text-foreground mt-0.5">
                Gallery
              </h2>
            </div>
          </div>

          <div className="overflow-hidden w-full relative">
            <div className="flex w-max hover:[animation-play-state:paused]">
              {/* Primary Track */}
              <div className="flex shrink-0 gap-4 sm:gap-6 pr-4 sm:pr-6 animate-marquee-slow motion-reduce:animate-none">
                {galleryImages.map((src, index) => (
                  <div
                    key={`track1-${src}-${index}`}
                    className="shrink-0 w-[260px] sm:w-[320px] md:w-[360px] aspect-[4/3] bg-surface border border-border overflow-hidden relative"
                  >
                    <img
                      src={src}
                      alt={`Gallery archive ${index + 1}`}
                      onError={() => handleImageError(src)}
                      className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>

              {/* Duplicate Track (Seamless Loop) */}
              <div
                className="flex shrink-0 gap-4 sm:gap-6 pr-4 sm:pr-6 animate-marquee-slow motion-reduce:animate-none"
                aria-hidden="true"
              >
                {galleryImages.map((src, index) => (
                  <div
                    key={`track2-${src}-${index}`}
                    className="shrink-0 w-[260px] sm:w-[320px] md:w-[360px] aspect-[4/3] bg-surface border border-border overflow-hidden relative"
                  >
                    <img
                      src={src}
                      alt=""
                      onError={() => handleImageError(src)}
                      className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 5. CRAFT PILLARS: MATERIALITY / PROPORTION / LONGEVITY (Controlled Spacing) */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 pb-8 sm:pb-10 border-b border-border">
        <div className="p-5 sm:p-6 bg-white border border-border flex flex-col justify-between">
          <div>
            <span className="editorial-badge text-muted">01 / Materiality</span>
            <h3 className="text-base sm:text-lg font-light text-foreground mt-1.5">
              Sustainable Solid Hardwoods
            </h3>
            <p className="text-xs text-muted mt-2.5 leading-relaxed">
              Every dining table, low platform bed, and console is sculpted from FSC-certified European white oak, American black walnut, and reclaimed teak. We reject engineered particle boards.
            </p>
          </div>
        </div>

        <div className="p-5 sm:p-6 bg-white border border-border flex flex-col justify-between">
          <div>
            <span className="editorial-badge text-muted">02 / Proportion</span>
            <h3 className="text-base sm:text-lg font-light text-foreground mt-1.5">
              Radical Reductionism
            </h3>
            <p className="text-xs text-muted mt-2.5 leading-relaxed">
              Inspired by classical brutalist architecture and Japanese wabi-sabi aesthetics, our silhouettes focus entirely on balance, negative space, and light reflection.
            </p>
          </div>
        </div>

        <div className="p-5 sm:p-6 bg-white border border-border flex flex-col justify-between">
          <div>
            <span className="editorial-badge text-muted">03 / Longevity</span>
            <h3 className="text-base sm:text-lg font-light text-foreground mt-1.5">
              Heirloom Longevity
            </h3>
            <p className="text-xs text-muted mt-2.5 leading-relaxed">
              Pieces are assembled with traditional mortise-and-tenon joints, sealed with zero-VOC plant oils, and backed by a comprehensive 10-year structural warranty.
            </p>
          </div>
        </div>
      </section>

      {/* 6. ANIMATED METRICS (100% / 10-Yr / Zero / 3,400+) */}
      <section ref={metricsRef} className="py-2 sm:py-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center border-y border-border py-6 sm:py-8">
          <div>
            <span className="text-3xl sm:text-4xl lg:text-5xl font-light text-foreground tracking-tight block tabular-nums">
              {hardwoodVal}
            </span>
            <span className="text-[11px] uppercase tracking-widest text-muted mt-1.5 block">
              Solid Hardwood
            </span>
          </div>
          <div>
            <span className="text-3xl sm:text-4xl lg:text-5xl font-light text-foreground tracking-tight block tabular-nums">
              {warrantyVal}
            </span>
            <span className="text-[11px] uppercase tracking-widest text-muted mt-1.5 block">
              Framework Warranty
            </span>
          </div>
          <div>
            <span className="text-3xl sm:text-4xl lg:text-5xl font-light text-foreground tracking-tight block tabular-nums">
              {vocVal}
            </span>
            <span className="text-[11px] uppercase tracking-widest text-muted mt-1.5 block">
              Toxic VOC Finishes
            </span>
          </div>
          <div>
            <span className="text-3xl sm:text-4xl lg:text-5xl font-light text-foreground tracking-tight block tabular-nums">
              {residencesVal}
            </span>
            <span className="text-[11px] uppercase tracking-widest text-muted mt-1.5 block">
              Curated Residences
            </span>
          </div>
        </div>
      </section>
    </div>
  )
}
