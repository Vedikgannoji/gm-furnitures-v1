import React from 'react'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Award, Shield, Compass, Sparkles } from 'lucide-react'

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      <Breadcrumbs items={[{ label: 'About Atelier' }]} className="mb-8" />

      {/* Hero */}
      <div className="max-w-3xl mb-16">
        <span className="editorial-badge text-muted">The Atelier Story</span>
        <h1 className="text-3xl sm:text-5xl font-light text-foreground mt-2 tracking-tight leading-[1.15]">
          "We do not create disposable fashion. We shape quiet architectural monuments for everyday life."
        </h1>
        <p className="mt-6 text-sm text-muted leading-relaxed">
          Founded in 2022, GM Atelier was established out of a desire to return furniture making to its foundational roots: honest solid hardwoods, raw monolithic stone, and structural integrity devoid of decorative pretense.
        </p>
      </div>

      {/* Visual Break */}
      <div className="aspect-[21/9] w-full bg-surface border border-border overflow-hidden mb-16">
        <img
          src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1800&q=80"
          alt="Architectural furniture atelier studio"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Philosophy Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10 pb-16 border-b border-border">
        <div>
          <span className="editorial-badge text-muted">01 / Materiality</span>
          <h3 className="text-lg font-light text-foreground mt-2">
            Sustainable Solid Hardwoods
          </h3>
          <p className="text-xs text-muted mt-3 leading-relaxed">
            Every dining table, low platform bed, and console is sculpted from FSC-certified European white oak, American black walnut, and reclaimed teak. We reject engineered particle boards.
          </p>
        </div>

        <div>
          <span className="editorial-badge text-muted">02 / Proportion</span>
          <h3 className="text-lg font-light text-foreground mt-2">
            Radical Reductionism
          </h3>
          <p className="text-xs text-muted mt-3 leading-relaxed">
            Inspired by classical brutalist architecture and Japanese wabi-sabi aesthetics, our silhouettes focus entirely on balance, negative space, and light reflection.
          </p>
        </div>

        <div>
          <span className="editorial-badge text-muted">03 / Longevity</span>
          <h3 className="text-lg font-light text-foreground mt-2">
            Heirloom Longevity
          </h3>
          <p className="text-xs text-muted mt-3 leading-relaxed">
            Pieces are assembled with traditional mortise-and-tenon joints, sealed with zero-VOC plant oils, and backed by a comprehensive 10-year structural warranty.
          </p>
        </div>
      </div>

      {/* Studio Workshop Stats */}
      <div className="py-16 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
        <div>
          <span className="text-3xl sm:text-4xl font-light text-foreground block">100%</span>
          <span className="text-xs uppercase tracking-widest text-muted mt-1 block">Solid Hardwood</span>
        </div>
        <div>
          <span className="text-3xl sm:text-4xl font-light text-foreground block">10-Yr</span>
          <span className="text-xs uppercase tracking-widest text-muted mt-1 block">Framework Warranty</span>
        </div>
        <div>
          <span className="text-3xl sm:text-4xl font-light text-foreground block">Zero</span>
          <span className="text-xs uppercase tracking-widest text-muted mt-1 block">Toxic VOC Finishes</span>
        </div>
        <div>
          <span className="text-3xl sm:text-4xl font-light text-foreground block">3,400+</span>
          <span className="text-xs uppercase tracking-widest text-muted mt-1 block">Curated Residences</span>
        </div>
      </div>
    </div>
  )
}
