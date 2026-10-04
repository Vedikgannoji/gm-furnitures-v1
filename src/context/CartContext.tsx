import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { CartItem, Product } from '@/types'
import { useToast } from './ToastContext'
import { useAuth } from './AuthContext'

interface CartContextType {
  items: CartItem[]
  addToCart: (product: Product, quantity?: number, color?: string) => void
  removeFromCart: (productId: string, color?: string) => void
  updateQuantity: (productId: string, quantity: number, color?: string) => void
  clearCart: () => void
  cartCount: number
  subtotal: number
  tax: number
  shipping: number
  total: number
  isCartDrawerOpen: boolean
  setIsCartDrawerOpen: (open: boolean) => void
  isLoadingCart: boolean
}

const CartContext = createContext<CartContextType | undefined>(undefined)

const GUEST_CART_STORAGE_KEY = 'gm_furniture_guest_cart_v1'

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { showToast } = useToast()
  const { user, token, isAuthenticated } = useAuth()
  const [items, setItems] = useState<CartItem[]>([])
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false)
  const [isLoadingCart, setIsLoadingCart] = useState(false)
  const hasMergedRef = useRef(false)

  // Fetch cart from database when authenticated, or load guest cart when logged out
  const fetchDBCart = useCallback(async (authToken: string) => {
    setIsLoadingCart(true)
    try {
      const res = await fetch('/api/cart', {
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
      // If there are guest cart items in localStorage, merge them once
      const rawGuest = localStorage.getItem(GUEST_CART_STORAGE_KEY)
      let guestItems: CartItem[] = []
      if (rawGuest) {
        try {
          guestItems = JSON.parse(rawGuest)
        } catch {
          guestItems = []
        }
      }

      if (guestItems.length > 0 && !hasMergedRef.current) {
        hasMergedRef.current = true
        fetch('/api/cart/merge', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            items: guestItems.map((g) => ({
              productId: g.product.id,
              quantity: g.quantity,
              selectedColor: g.selectedColor,
            })),
          }),
        }).finally(() => {
          localStorage.removeItem(GUEST_CART_STORAGE_KEY)
          fetchDBCart(token)
        })
      } else {
        fetchDBCart(token)
      }
    } else {
      // User is logged out: load guest cart from localStorage
      hasMergedRef.current = false
      try {
        const saved = localStorage.getItem(GUEST_CART_STORAGE_KEY)
        setItems(saved ? JSON.parse(saved) : [])
      } catch {
        setItems([])
      }
    }
  }, [isAuthenticated, token, fetchDBCart])

  // Save guest cart to localStorage when not logged in
  useEffect(() => {
    if (!isAuthenticated) {
      try {
        localStorage.setItem(GUEST_CART_STORAGE_KEY, JSON.stringify(items))
      } catch (e) {
        console.error('Error saving guest cart to localStorage', e)
      }
    }
  }, [items, isAuthenticated])

  const addToCart = async (product: Product, quantity = 1, color?: string) => {
    const selectedColor = color || (product.colors?.[0]?.name ?? 'Standard')

    // Optimistic / Local update
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

    // If authenticated, persist to database
    if (isAuthenticated && token) {
      try {
        await fetch('/api/cart', {
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
        await fetch(`/api/cart/${toRemove.id}`, {
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
        await fetch(`/api/cart/${targetItem.id}`, {
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
  const tax = Math.round(subtotal * 0.18)
  const shipping = subtotal === 0 || subtotal >= 50000 ? 0 : 2500
  const total = subtotal + tax + shipping

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
        tax,
        shipping,
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
