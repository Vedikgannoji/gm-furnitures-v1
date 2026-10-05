import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { CartItem, Product } from '@/types'
import { useToast } from './ToastContext'
import { useAuth } from './AuthContext'
import { useSettings } from './SettingsContext'
import { API_BASE } from '@/lib/api'

interface CartContextType {
  items: CartItem[]
  addToCart: (product: Product, quantity?: number, color?: string) => void
  removeFromCart: (productId: string, color?: string) => void
  updateQuantity: (productId: string, quantity: number, color?: string) => void
  clearCart: () => void
  cartCount: number
  subtotal: number
  assemblyCharge: number
  convenienceFee: number
  convenienceFeePercent: number
  gst: number
  gstPercent: number
  total: number
  isCartDrawerOpen: boolean
  setIsCartDrawerOpen: (open: boolean) => void
  isLoadingCart: boolean
}

const CartContext = createContext<CartContextType | undefined>(undefined)

const GUEST_CART_STORAGE_KEY = 'gm_furniture_guest_cart_v1'

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { showToast } = useToast()
  const { token, isAuthenticated } = useAuth()
  const { settings } = useSettings()
  const [items, setItems] = useState<CartItem[]>([])
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false)
  const [isLoadingCart, setIsLoadingCart] = useState(false)

  // Fetch cart from database when authenticated
  const fetchDBCart = useCallback(async (authToken: string) => {
    setIsLoadingCart(true)
    try {
      const res = await fetch(`${API_BASE}/api/cart`, {
        headers: { Authorization: `Bearer ${authToken}` },
      })
      if (res.ok) {
        const data = await res.json()
        setItems(data)
      }
    } catch (err) {
      console.error('Failed to load user cart:', err)
    } finally {
      setIsLoadingCart(false)
    }
  }, [])

  useEffect(() => {
    if (isAuthenticated && token) {
      fetchDBCart(token)
    } else {
      setItems([])
    }
  }, [isAuthenticated, token, fetchDBCart])

  const addToCart = async (product: Product, quantity = 1, color?: string) => {
    if (!isAuthenticated || !token) {
      showToast('Sign In Required', 'Please sign in to add items to your shopping bag.', 'info')
      window.location.href = '/auth'
      return
    }

    const selectedColor = color || (product.colors?.[0]?.name ?? 'Standard')

    // Optimistic local update
    setItems((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.product.id === product.id && item.selectedColor === selectedColor
      )
      if (existingIndex > -1) {
        const next = [...prev]
        const newQty = next[existingIndex].quantity + quantity
        next[existingIndex] = {
          ...next[existingIndex],
          quantity: newQty,
        }
        return next
      }
      return [...prev, { product, quantity, selectedColor }]
    })

    showToast('Added to Cart', `${product.name} (${quantity}) added to your bag.`, 'success')

    // Persist to PostgreSQL database
    if (isAuthenticated && token) {
      try {
        await fetch(`${API_BASE}/api/cart`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            productId: product.id,
            quantity,
            selectedColor,
          }),
        })
        fetchDBCart(token)
      } catch (err) {
        console.error('Failed to sync cart item to database:', err)
      }
    }
  }

  const removeFromCart = async (productId: string, color?: string) => {
    const toRemove = items.find(
      (item) => item.product.id === productId && (!color || item.selectedColor === color)
    )

    setItems((prev) =>
      prev.filter(
        (item) => !(item.product.id === productId && (!color || item.selectedColor === color))
      )
    )
    showToast('Item Removed', 'Product removed from your shopping bag.', 'info')

    if (isAuthenticated && token && toRemove?.id) {
      try {
        await fetch(`${API_BASE}/api/cart/${toRemove.id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        })
      } catch (err) {
        console.error('Failed to delete cart item from database:', err)
      }
    }
  }

  const updateQuantity = async (productId: string, quantity: number, color?: string) => {
    if (quantity <= 0) {
      removeFromCart(productId, color)
      return
    }

    const targetItem = items.find(
      (item) => item.product.id === productId && (!color || item.selectedColor === color)
    )

    setItems((prev) =>
      prev.map((item) => {
        if (item.product.id === productId && (!color || item.selectedColor === color)) {
          return {
            ...item,
            quantity,
          }
        }
        return item
      })
    )

    if (isAuthenticated && token && targetItem?.id) {
      try {
        await fetch(`${API_BASE}/api/cart/${targetItem.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ quantity }),
        })
      } catch (err) {
        console.error('Failed to update cart item quantity in database:', err)
      }
    }
  }

  const clearCart = () => {
    setItems([])
    if (!isAuthenticated) {
      localStorage.removeItem(GUEST_CART_STORAGE_KEY)
    }
  }

  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0)
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0)

  // Dynamic calculations according to Store Settings from PostgreSQL
  const assemblyCharge = items.length > 0 ? (settings.assemblyCharge ?? 3000) : 0
  const convenienceFeePercent = settings.convenienceFeePercent ?? 0
  const convenienceFee = items.length > 0 ? Math.round(subtotal * (convenienceFeePercent / 100)) : 0
  const gstPercent = settings.gstPercent ?? 18
  // IMPORTANT: GST is calculated on convenience fee ONLY, not on full product price
  const gst = items.length > 0 ? Math.round(convenienceFee * (gstPercent / 100)) : 0
  const total = items.length > 0 ? subtotal + assemblyCharge + convenienceFee + gst : 0

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartCount,
        subtotal,
        assemblyCharge,
        convenienceFee,
        convenienceFeePercent,
        gst,
        gstPercent,
        total,
        isCartDrawerOpen,
        setIsCartDrawerOpen,
        isLoadingCart,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
