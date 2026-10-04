import React, { useState } from 'react'
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-12 sm:pb-16 space-y-8 sm:space-y-10 lg:space-y-12">
      <Breadcrumbs items={[{ label: 'About Us' }]} className="mb-2 sm:mb-3" />

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
          {/* Brand Logo */}
          <div className="mb-3 flex items-center justify-center">
            <img
              src="/logo.png"
              alt="GM Group Logo"
              className="h-10 sm:h-12 w-auto object-contain"
            />
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
      <section className="w-full space-y-4">
        {/* Award 1 */}
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

        {/* Award 2 */}
        <div className="bg-surface border border-border p-5 sm:p-7 flex flex-col md:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-4 text-left">
            <div className="w-11 h-11 bg-white border border-border flex items-center justify-center shrink-0">
              <Award className="w-5 h-5 text-foreground stroke-[1.5]" />
            </div>
            <div>
              <span className="editorial-badge text-muted tracking-widest">Industry Recognition</span>
              <h3 className="text-base sm:text-lg font-medium text-foreground mt-0.5">
                Architecture & Interior Design Excellence Awards & Conference 2023
              </h3>
              <p className="text-xs text-muted mt-0.5 leading-relaxed max-w-xl">
                Recognized for excellence in architecture and interior design.
              </p>
            </div>
          </div>
          <div className="shrink-0 px-4 py-2 border border-border bg-white text-center">
            <span className="text-[10px] uppercase tracking-widest text-muted block">Presented In</span>
            <span className="text-xs font-semibold tracking-wider text-foreground uppercase block mt-0.5">
              2023
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
    </div>
  )
}
