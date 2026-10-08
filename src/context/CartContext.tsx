import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { CartItem, Product } from '@/types'
import { useToast } from './ToastContext'
import { useAuth } from './AuthContext'
import { useSettings } from './SettingsContext'
import { API_BASE } from '@/lib/api'

export interface PendingCartAction {
  productId: string
  quantity: number
  selectedColor?: string
  timestamp: number
}

export const PENDING_CART_STORAGE_KEY = 'gm_pending_cart_action_v1'

interface CartContextType {
  items: CartItem[]
  addToCart: (product: Product, quantity?: number, color?: string) => Promise<void>
  removeFromCart: (productId: string, color?: string) => void
  updateQuantity: (productId: string, quantity: number, color?: string) => void
  clearCart: () => void
  refreshCart: () => Promise<void>
  processPendingCartAction: (authToken?: string, userRole?: string) => Promise<boolean>
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
  const { token, isAuthenticated, user } = useAuth()
  const { settings } = useSettings()
  const [items, setItems] = useState<CartItem[]>([])
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false)
  const [isLoadingCart, setIsLoadingCart] = useState(false)
  const isProcessingPendingRef = React.useRef(false)

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

  const refreshCart = useCallback(async () => {
    if (token) {
      await fetchDBCart(token)
    }
  }, [token, fetchDBCart])

  /**
   * Process and restore pending Add to Bag action after customer authentication.
   * Admin accounts are strictly isolated and never receive pending cart actions.
   */
  const processPendingCartAction = useCallback(
    async (authToken?: string, userRole?: string): Promise<boolean> => {
      const effectiveRole = userRole || user?.role
      if (effectiveRole === 'admin') {
        return false
      }

      const tokenToUse =
        authToken ||
        token ||
        (typeof window !== 'undefined' ? localStorage.getItem('gm_auth_token') : null)

      if (!tokenToUse) {
        return false
      }

      // Guard against race conditions and duplicate executions
      if (isProcessingPendingRef.current) {
        return false
      }

      const stored =
        typeof window !== 'undefined'
          ? localStorage.getItem(PENDING_CART_STORAGE_KEY)
          : null
      if (!stored) {
        return false
      }

      let pending: PendingCartAction
      try {
        pending = JSON.parse(stored)
      } catch {
        localStorage.removeItem(PENDING_CART_STORAGE_KEY)
        return false
      }

      if (!pending?.productId) {
        localStorage.removeItem(PENDING_CART_STORAGE_KEY)
        return false
      }

      // Expire stale pending actions older than 7 days
      if (pending.timestamp && Date.now() - pending.timestamp > 7 * 24 * 60 * 60 * 1000) {
        localStorage.removeItem(PENDING_CART_STORAGE_KEY)
        return false
      }

      isProcessingPendingRef.current = true

      try {
        const res = await fetch(`${API_BASE}/api/cart`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${tokenToUse}`,
          },
          body: JSON.stringify({
            productId: pending.productId,
            quantity: Math.max(1, pending.quantity || 1),
            selectedColor: pending.selectedColor || 'Standard',
          }),
        })

        const data = await res.json().catch(() => ({}))

        if (res.ok) {
          // Clear pending action ONLY after cart operation successfully completes
          localStorage.removeItem(PENDING_CART_STORAGE_KEY)
          await fetchDBCart(tokenToUse)
          showToast('Added to Bag', 'Product added to your shopping bag.', 'success')
          return true
        } else {
          // If server rejects with 400 or 404 (unavailable/out of stock/not found), clear stale pending action
          if (res.status === 400 || res.status === 404) {
            localStorage.removeItem(PENDING_CART_STORAGE_KEY)
            showToast('Item Unavailable', data.error || "Couldn't add this item to your bag.", 'error')
          } else {
            showToast('Cart Error', "Couldn't add this item to your bag. Please try again.", 'error')
          }
          return false
        }
      } catch (err) {
        console.error('Failed to process pending cart action:', err)
        showToast('Cart Error', "Couldn't add this item to your bag. Please try again.", 'error')
        return false
      } finally {
        isProcessingPendingRef.current = false
      }
    },
    [token, user?.role, fetchDBCart, showToast]
  )

  useEffect(() => {
    if (isAuthenticated && token) {
      fetchDBCart(token)
      if (user?.role !== 'admin') {
        processPendingCartAction(token, user?.role)
      }
    } else {
      setItems([])
    }
  }, [isAuthenticated, token, user?.role, fetchDBCart, processPendingCartAction])

  const addToCart = async (product: Product, quantity = 1, color?: string) => {
    const selectedColor = color || (product.colors?.[0]?.name ?? 'Standard')

    if (!isAuthenticated || !token) {
      // Preserve intended cart action before navigating to authentication
      const pendingAction: PendingCartAction = {
        productId: product.id,
        quantity: Math.max(1, quantity),
        selectedColor,
        timestamp: Date.now(),
      }
      try {
        localStorage.setItem(PENDING_CART_STORAGE_KEY, JSON.stringify(pendingAction))
      } catch (err) {
        console.error('Failed to preserve pending cart action:', err)
      }

      showToast('Sign In Required', 'Please sign in to add items to your shopping bag.', 'info')
      window.location.href = '/auth'
      return
    }

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
        refreshCart,
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
        processPendingCartAction,
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
