import { useState, useEffect } from 'react'
import { Product } from '@/types'
import { CANONICAL_PRODUCTS } from '@/data/canonicalProducts'

export function useProducts() {
  const [products, setProducts] = useState<Product[]>(CANONICAL_PRODUCTS)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadProducts() {
      setIsLoading(true)
      try {
        const res = await fetch('/api/products')
        if (res.ok) {
          const data: Product[] = await res.json()
          if (isMounted && Array.isArray(data) && data.length > 0) {
            setProducts(data)
          }
        }
      } catch (err: any) {
        console.warn('API products fetch fallback to canonical products:', err)
        if (isMounted) {
          setError(err.message)
        }
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    loadProducts()

    return () => {
      isMounted = false
    }
  }, [])

  const featuredProducts = products.filter((p) => p.featured)
  const newArrivals = products.filter((p) => p.newArrival)

  const getProduct = (slugOrId: string): Product | undefined => {
    return products.find((p) => p.slug === slugOrId || p.id === slugOrId)
  }

  return {
    products,
    featuredProducts,
    newArrivals,
    getProduct,
    isLoading,
    error,
  }
}
