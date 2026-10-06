import { useState, useEffect } from 'react'
import { Product } from '@/types'
import { API_BASE } from '@/lib/api'

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadProducts() {
      setIsLoading(true)
      try {
        const res = await fetch(`${API_BASE}/api/products`, {
          cache: 'no-store',
        })
        if (res.ok) {
          const data = await res.json()
          if (isMounted && Array.isArray(data)) {
            setProducts(data)
          }
        } else {
          const errData = await res.json().catch(() => ({}))
          if (isMounted) {
            setError(errData.error || `HTTP error ${res.status}`)
          }
        }
      } catch (err: any) {
        console.error('API products fetch error:', err)
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
