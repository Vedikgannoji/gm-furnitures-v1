import { useState, useEffect } from 'react'
import { Product } from '@/types'
import { API_BASE } from '@/lib/api'

let cachedProducts: Product[] | null = null
let fetchPromise: Promise<Product[]> | null = null

export function invalidateProductsCache() {
  cachedProducts = null
  fetchPromise = null
}

export function useProducts() {
  const [products, setProducts] = useState<Product[]>(() => cachedProducts || [])
  const [isLoading, setIsLoading] = useState<boolean>(() => !cachedProducts)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadProducts() {
      if (cachedProducts) {
        if (isMounted) {
          setProducts(cachedProducts)
          setIsLoading(false)
        }
        return
      }

      setIsLoading(true)
      try {
        if (!fetchPromise) {
          fetchPromise = fetch(`${API_BASE}/api/products`, { cache: 'no-store' })
            .then(async (res) => {
              if (!res.ok) {
                const errData = await res.json().catch(() => ({}))
                throw new Error(errData.error || `HTTP error ${res.status}`)
              }
              const data = await res.json()
              return Array.isArray(data) ? data : []
            })
            .catch((err) => {
              fetchPromise = null
              throw err
            })
        }

        const data = await fetchPromise
        cachedProducts = data
        if (isMounted) {
          setProducts(data)
          setError(null)
        }
      } catch (err: unknown) {
        console.error('API products fetch error:', err)
        fetchPromise = null
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch products')
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

