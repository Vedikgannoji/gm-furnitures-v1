import React, { useState, useMemo, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Search, X } from 'lucide-react'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { ProductCard } from '@/components/commerce/ProductCard'
import { EmptyState } from '@/components/commerce/EmptyState'
import { mockProducts } from '@/data/mockData'

export const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialQuery = searchParams.get('q') || ''
  const [query, setQuery] = useState(initialQuery)

  useEffect(() => {
    setQuery(searchParams.get('q') || '')
  }, [searchParams])

  const handleQueryChange = (val: string) => {
    setQuery(val)
    if (val.trim()) {
      setSearchParams({ q: val })
    } else {
      setSearchParams({})
    }
  }

  const searchResults = useMemo(() => {
    const trimmed = query.trim().toLowerCase()
    if (!trimmed) return mockProducts

    return mockProducts.filter((product) => {
      const matchName = product.name.toLowerCase().includes(trimmed)
      const matchCat = product.category.toLowerCase().includes(trimmed)
      const matchMaterial = product.material.toLowerCase().includes(trimmed)
      const matchSku = product.sku.toLowerCase().includes(trimmed)
      const matchRoom = product.room.toLowerCase().includes(trimmed)
      const matchTags = product.tags.some((t) => t.toLowerCase().includes(trimmed))
      return matchName || matchCat || matchMaterial || matchSku || matchRoom || matchTags
    })
  }, [query])

  const popularSearches = ['Modular Sofa', 'Travertine', 'Solid Oak', 'Dining Table', 'Platform Bed', 'Walnut']

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      <Breadcrumbs items={[{ label: 'Search Catalog' }]} className="mb-6" />

      {/* Search Input Bar */}
      <div className="max-w-3xl mx-auto text-center mb-12">
        <h1 className="text-2xl sm:text-4xl font-light text-foreground mb-6 tracking-tight">
          Search Considered Furniture
        </h1>

        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="Search by piece name, wood species, travertine stone, SKU..."
            className="w-full h-14 bg-surface border border-border pl-12 pr-12 text-sm sm:text-base text-foreground focus:border-foreground focus:outline-none transition-colors"
            autoFocus
          />
          <Search className="w-5 h-5 absolute left-4 top-4.5 text-muted" />
          {query && (
            <button
              onClick={() => handleQueryChange('')}
              className="absolute right-4 top-4.5 text-muted hover:text-foreground p-1"
              aria-label="Clear search query"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Quick Tag Pills */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs">
          <span className="text-muted text-[11px] uppercase tracking-wider">Suggested:</span>
          {popularSearches.map((term) => (
            <button
              key={term}
              onClick={() => handleQueryChange(term)}
              className="px-2.5 py-1 bg-surface border border-border hover:border-foreground text-foreground text-xs transition-colors"
            >
              {term}
            </button>
          ))}
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border mb-8">
        <span className="text-xs text-muted">
          {query ? (
            <>
              Found <span className="font-semibold text-foreground">{searchResults.length}</span> results for "{query}"
            </>
          ) : (
            <>
              Displaying all <span className="font-semibold text-foreground">{mockProducts.length}</span> pieces
            </>
          )}
        </span>
        {query && (
          <button
            onClick={() => handleQueryChange('')}
            className="text-xs text-muted hover:text-foreground underline"
          >
            Clear Search
          </button>
        )}
      </div>

      {/* Results Grid */}
      {searchResults.length === 0 ? (
        <EmptyState
          icon={Search}
          title={`No designs matching "${query}"`}
          description="Try checking for typos, searching for broader terms like 'oak' or 'table', or explore our complete catalog."
          actionLabel="View All Furniture"
          actionHref="/shop"
          onAction={() => handleQueryChange('')}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {searchResults.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}
