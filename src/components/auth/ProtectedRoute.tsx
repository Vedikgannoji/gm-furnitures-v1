import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

export const ProtectedRoute: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-8">
        <div className="w-6 h-6 border-2 border-foreground border-t-transparent rounded-full animate-spin mb-3" />
        <span className="text-[11px] uppercase tracking-widest text-muted">
          Authenticating Client Session...
        </span>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to={`/auth?redirect=${encodeURIComponent(location.pathname)}`} replace />
  }

  return children ? <>{children}</> : null
}
