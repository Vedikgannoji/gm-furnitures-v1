import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useToast } from './ToastContext'
import { useAuth } from './AuthContext'
import { Product } from '@/types'

interface WishlistContextType {
  wishlistIds: string[]
  wishlistProducts: Product[]
  toggleWishlist: (productId: string, productName?: string) => void
  isInWishlist: (productId: string) => boolean
  wishlistCount: number
  isLoadingWishlist: boolean
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined)

const GUEST_WISHLIST_KEY = 'gm_furniture_guest_wishlist_v1'

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { showToast } = useToast()
  const { token, isAuthenticated } = useAuth()
  const [wishlistIds, setWishlistIds] = useState<string[]>([])
  const [wishlistProducts, setWishlistProducts] = useState<Product[]>([])
  const [isLoadingWishlist, setIsLoadingWishlist] = useState<boolean>(false)

  const fetchDBWishlist = useCallback(async (authToken: string) => {
    setIsLoadingWishlist(true)
    try {
      const res = await fetch('/api/wishlist', {
        headers: { Authorization: `Bearer ${authToken}` },
      })
      if (res.ok) {
        const products: Product[] = await res.json()
        setWishlistProducts(products)
        setWishlistIds(products.map((p) => p.id))
      }
    } catch (err) {
      console.error('Failed to load user wishlist:', err)
    } finally {
      setIsLoadingWishlist(false)
    }
  }, [])

  useEffect(() => {
    if (isAuthenticated && token) {
      fetchDBWishlist(token)
    } else {
      // Guest: load from localStorage without fake items
      try {
        const saved = localStorage.getItem(GUEST_WISHLIST_KEY)
        setWishlistIds(saved ? JSON.parse(saved) : [])
        setWishlistProducts([])
      } catch {
        setWishlistIds([])
        setWishlistProducts([])
      }
    }
  }, [isAuthenticated, token, fetchDBWishlist])

  // Save guest wishlist to localStorage when logged out
  useEffect(() => {
    if (!isAuthenticated) {
      try {
        localStorage.setItem(GUEST_WISHLIST_KEY, JSON.stringify(wishlistIds))
      } catch (e) {
        console.error('Error saving guest wishlist to localStorage', e)
      }
    }
  }, [wishlistIds, isAuthenticated])

  const toggleWishlist = async (productId: string, productName?: string) => {
    const exists = wishlistIds.includes(productId)

    // Optimistic state update
    if (exists) {
      setWishlistIds((prev) => prev.filter((id) => id !== productId))
      setWishlistProducts((prev) => prev.filter((p) => p.id !== productId))
      showToast(
        'Removed from Wishlist',
        productName ? `${productName} was removed.` : 'Item removed from saved list.',
        'info'
      )
    } else {
      setWishlistIds((prev) => [...prev, productId])
      showToast(
        'Saved to Wishlist',
        productName ? `${productName} was saved.` : 'Item added to your curated list.',
        'success'
      )
    }

    // Persist to database if authenticated
    if (isAuthenticated && token) {
      try {
        if (exists) {
          await fetch(`/api/wishlist/${productId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          })
        } else {
          await fetch('/api/wishlist', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ productId }),
          })
        }
        fetchDBWishlist(token)
      } catch (err) {
        console.error('Failed to sync wishlist with database:', err)
      }
    }
  }

  const isInWishlist = (productId: string) => wishlistIds.includes(productId)

  return (
    <WishlistContext.Provider
      value={{
        wishlistIds,
        wishlistProducts,
        toggleWishlist,
        isInWishlist,
        wishlistCount: wishlistIds.length,
        isLoadingWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  )
}

export const useWishlist = () => {
  const context = useContext(WishlistContext)
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider')
  }
  return context
}
