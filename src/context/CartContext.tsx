import React, { createContext, useContext, useState, useEffect } from 'react'
import { CartItem, Product } from '@/types'
import { useToast } from './ToastContext'

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
}

const CartContext = createContext<CartContextType | undefined>(undefined)

const CART_STORAGE_KEY = 'gm_furniture_cart_v1'

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { showToast } = useToast()
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY)
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false)

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
    } catch (e) {
      console.error('Error saving cart to localStorage', e)
    }
  }, [items])

  const addToCart = (product: Product, quantity = 1, color?: string) => {
    const selectedColor = color || (product.colors?.[0]?.name ?? 'Default')
    setItems((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.product.id === product.id && item.selectedColor === selectedColor
      )
      if (existingIndex > -1) {
        const next = [...prev]
        const newQty = next[existingIndex].quantity + quantity
        next[existingIndex] = {
          ...next[existingIndex],
          quantity: Math.min(newQty, product.stock || 10),
        }
        return next
      }
      return [...prev, { product, quantity, selectedColor }]
    })

    showToast('Added to Cart', `${product.name} (${quantity}) added to your bag.`, 'success')
  }

  const removeFromCart = (productId: string, color?: string) => {
    setItems((prev) =>
      prev.filter(
        (item) => !(item.product.id === productId && (!color || item.selectedColor === color))
      )
    )
    showToast('Item Removed', 'Product removed from your shopping bag.', 'info')
  }

  const updateQuantity = (productId: string, quantity: number, color?: string) => {
    if (quantity <= 0) {
      removeFromCart(productId, color)
      return
    }
    setItems((prev) =>
      prev.map((item) => {
        if (item.product.id === productId && (!color || item.selectedColor === color)) {
          return {
            ...item,
            quantity: Math.min(quantity, item.product.stock || 10),
          }
        }
        return item
      })
    )
  }

  const clearCart = () => {
    setItems([])
  }

  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0)
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  // 18% GST standard rate for furniture
  const tax = Math.round(subtotal * 0.18)
  // Complimentary delivery over ₹50,000, else flat ₹2,500
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
