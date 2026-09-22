import React, { createContext, useContext, useState, useEffect } from 'react'
import { useToast } from './ToastContext'

interface WishlistContextType {
  wishlistIds: string[]
  toggleWishlist: (productId: string, productName?: string) => void
  isInWishlist: (productId: string) => boolean
  wishlistCount: number
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined)

const WISHLIST_STORAGE_KEY = 'gm_furniture_wishlist_v1'

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { showToast } = useToast()
  const [wishlistIds, setWishlistIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(WISHLIST_STORAGE_KEY)
      return saved ? JSON.parse(saved) : ['gm-prod-02', 'gm-prod-03']
    } catch {
      return ['gm-prod-02', 'gm-prod-03']
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlistIds))
    } catch (e) {
      console.error('Error saving wishlist to localStorage', e)
    }
  }, [wishlistIds])

  const toggleWishlist = (productId: string, productName?: string) => {
    setWishlistIds((prev) => {
      const exists = prev.includes(productId)
      if (exists) {
        showToast(
          'Removed from Wishlist',
          productName ? `${productName} was removed.` : 'Item removed from saved list.',
          'info'
        )
        return prev.filter((id) => id !== productId)
      } else {
        showToast(
          'Saved to Wishlist',
          productName ? `${productName} was saved.` : 'Item added to your curated list.',
          'success'
        )
        return [...prev, productId]
      }
    })
  }

  const isInWishlist = (productId: string) => wishlistIds.includes(productId)

  return (
    <WishlistContext.Provider
      value={{
        wishlistIds,
        toggleWishlist,
        isInWishlist,
        wishlistCount: wishlistIds.length,
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
