import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Shield, Award, Truck } from 'lucide-react'
import { ProductCard } from '@/components/commerce/ProductCard'
import { mockProducts, mockCategories, mockRooms, mockCollections } from '@/data/mockData'

export const HomePage: React.FC = () => {
  const featuredProducts = mockProducts.filter((p) => p.featured).slice(0, 4)
  const newArrivals = mockProducts.filter((p) => p.newArrival).slice(0, 4)
  const bestSellers = mockProducts.filter((p) => p.bestSeller).slice(0, 4)

  return (
    <div className="flex flex-col space-y-24 sm:space-y-32 pb-24">
      {/* 1. EDITORIAL HERO SECTION */}
      <section className="relative h-[85vh] min-h-[620px] w-full flex items-end justify-start overflow-hidden bg-surface-dark text-white">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=2000&q=85"
            alt="Considered minimal living room interior"
            className="w-full h-full object-cover object-center opacity-85 scale-100 hover:scale-105 transition-transform duration-1000 ease-out"
          />
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/20" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 sm:pb-24 w-full">
          <div className="max-w-2xl">
            <span className="editorial-badge text-zinc-300 mb-3 block">
              Architectural Living / Edition 2026
            </span>
            <h1 className="text-4xl sm:text-6xl font-light tracking-tight text-white leading-[1.1]">
              Furniture for considered spaces.
            </h1>
            <p className="mt-4 text-sm sm:text-base text-zinc-300 font-normal leading-relaxed max-w-lg">
              Benchcrafted from sustainable solid hardwoods, natural stone, and Belgian textiles. Form stripped to pure necessity.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                to="/shop"
                className="h-12 px-7 bg-white text-black hover:bg-zinc-100 text-xs font-semibold uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg"
              >
                <span>Shop Furniture</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                to="/rooms"
                className="h-12 px-7 bg-transparent hover:bg-white/10 text-white border border-white/40 text-xs font-semibold uppercase tracking-widest flex items-center gap-2 transition-all backdrop-blur-sm"
              >
                <span>Explore Rooms</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2. VALUES BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full -mt-12 sm:-mt-16 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border border border-border bg-opacity-80">
          <div className="bg-background p-6 flex items-start gap-4">
            <Award className="w-5 h-5 text-foreground shrink-0 mt-1 stroke-[1.5]" />
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                Architectural Integrity
              </h4>
              <p className="text-xs text-muted mt-1 leading-relaxed">
                Traditional mortise-and-tenon joinery and zero-VOC organic hardwax finishes.
              </p>
            </div>
          </div>
          <div className="bg-background p-6 flex items-start gap-4">
            <Truck className="w-5 h-5 text-foreground shrink-0 mt-1 stroke-[1.5]" />
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                White-Glove Assembly
              </h4>
              <p className="text-xs text-muted mt-1 leading-relaxed">
                Complimentary room placement, full assembly, and packaging recycling across India.
              </p>
            </div>
          </div>
          <div className="bg-background p-6 flex items-start gap-4">
            <Shield className="w-5 h-5 text-foreground shrink-0 mt-1 stroke-[1.5]" />
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

      {/* 3. FEATURED CATEGORIES */}
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

      {/* 4. FEATURED PRODUCTS */}
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

      {/* 5. SHOP BY ROOM SHOWCASE */}
      <section className="bg-surface py-20 border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 pb-3 border-b border-border">
            <div>
              <span className="editorial-badge">Curated Spatial Environments</span>
              <h2 className="text-2xl sm:text-3xl font-light text-foreground mt-1">
                Shop by Room
              </h2>
            </div>
            <Link
              to="/rooms"
              className="text-xs uppercase tracking-widest font-medium text-foreground hover:text-muted transition-colors flex items-center gap-1 mt-3 sm:mt-0"
            >
              <span>Explore All Rooms</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {mockRooms.slice(0, 2).map((room) => (
              <Link
                key={room.id}
                to={`/rooms/${room.slug}`}
                className="group relative flex flex-col bg-background border border-border overflow-hidden"
              >
                <div className="aspect-[16/10] w-full overflow-hidden relative">
                  <img
                    src={room.image}
                    alt={room.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                </div>
                <div className="p-6 sm:p-8 flex flex-col justify-between flex-1">
                  <div>
                    <span className="editorial-badge text-muted">Shop Curated Space</span>
                    <h3 className="text-xl font-medium text-foreground mt-1">{room.name}</h3>
                    <p className="text-xs text-muted mt-2 leading-relaxed">
                      {room.description}
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-border flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-foreground">
                    <span>View Room Suite</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 6. FEATURED COLLECTION PROMO */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {mockCollections.slice(0, 1).map((col) => (
          <div
            key={col.id}
            className="grid grid-cols-1 lg:grid-cols-2 bg-background border border-border"
          >
            <div className="p-8 sm:p-14 lg:p-16 flex flex-col justify-between">
              <div>
                <span className="editorial-badge">Signature Collection</span>
                <h2 className="text-3xl sm:text-4xl font-light text-foreground mt-2 tracking-tight">
                  {col.name}
                </h2>
                <p className="text-sm font-medium text-muted mt-2">
                  "{col.tagline}"
                </p>
                <p className="text-xs sm:text-sm text-muted mt-4 leading-relaxed max-w-md">
                  {col.description}
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-border flex items-center gap-6">
                <Link
                  to={`/collections/${col.slug}`}
                  className="h-11 px-6 bg-foreground text-background hover:bg-black/85 text-xs font-semibold uppercase tracking-widest flex items-center gap-2 transition-colors"
                >
                  <span>Explore Collection</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <span className="text-xs text-muted uppercase tracking-wider">
                  {col.productCount} Handcrafted Pieces
                </span>
              </div>
            </div>

            <div className="aspect-[4/3] lg:aspect-auto h-full w-full overflow-hidden bg-surface">
              <img
                src={col.image}
                alt={col.name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        ))}
      </section>

      {/* 7. NEW ARRIVALS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
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

      {/* 8. BEST SELLERS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 pb-3 border-b border-border">
          <div>
            <span className="editorial-badge">Enduring Favorites</span>
            <h2 className="text-2xl sm:text-3xl font-light text-foreground mt-1">
              Best Sellers
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
          {bestSellers.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* 9. BRAND PHILOSOPHY / ATELIER SECTION */}
      <section className="bg-surface py-20 border-y border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <span className="editorial-badge">The Philosophy</span>
          <h2 className="text-3xl sm:text-4xl font-light text-foreground mt-3 tracking-tight leading-tight">
            "Space is not empty. It is a canvas for consideration, stillness, and light."
          </h2>
          <p className="mt-6 text-xs sm:text-sm text-muted leading-relaxed max-w-2xl mx-auto">
            At GM Atelier, we reject seasonal disposable trends. Each silhouette is developed in collaboration with master woodworkers and stone artisans using sustainably managed FSC forests. We design furniture that remains relevant for decades.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link
              to="/about"
              className="text-xs uppercase tracking-widest font-semibold text-foreground underline underline-offset-8 hover:text-muted transition-colors"
            >
              Read Atelier Manifesto &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* 10. FINAL CONSULTATION CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="bg-foreground text-background p-10 sm:p-16 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div className="max-w-xl">
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400">
              Architectural Advisory
            </span>
            <h3 className="text-2xl sm:text-3xl font-light mt-2 tracking-tight text-white">
              Planning a full residence or studio space?
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400 mt-3 leading-relaxed">
              Book a private consultation with our interior spatial architects. We provide material swatches, 2D floorplan spatial layouts, and bespoke timber finish matching.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto shrink-0">
            <Link to="/contact">
              <button className="h-11 px-6 bg-white text-black hover:bg-zinc-200 text-xs font-semibold uppercase tracking-widest transition-colors w-full sm:w-auto">
                Schedule Advisory
              </button>
            </Link>
            <Link to="/rooms">
              <button className="h-11 px-6 bg-transparent hover:bg-white/10 text-white border border-zinc-700 text-xs font-semibold uppercase tracking-widest transition-colors w-full sm:w-auto">
                Browse Rooms
              </button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
