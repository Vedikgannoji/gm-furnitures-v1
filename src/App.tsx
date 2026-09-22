import React from 'react'
import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import { ToastProvider } from './context/ToastContext'
import { CartProvider } from './context/CartContext'
import { WishlistProvider } from './context/WishlistContext'

export function App() {
  return (
    <ToastProvider>
      <CartProvider>
        <WishlistProvider>
          <RouterProvider router={router} />
        </WishlistProvider>
      </CartProvider>
    </ToastProvider>
  )
}

export default App
