import React from 'react'
import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import { ToastProvider } from './context/ToastContext'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { WishlistProvider } from './context/WishlistContext'
import { GoogleOAuthProvider } from '@react-oauth/google'

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

export function App() {
  const content = (
    <ToastProvider>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <RouterProvider router={router} />
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </ToastProvider>
  )

  if (googleClientId) {
    return (
      <GoogleOAuthProvider clientId={googleClientId}>
        {content}
      </GoogleOAuthProvider>
    )
  }

  return content
}

export default App
