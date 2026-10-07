import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

export interface ProtectedRouteProps {
  children?: React.ReactNode
  requireAdmin?: boolean
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireAdmin = false }) => {
  const { user, isAuthenticated, isLoading, isLoggingOut } = useAuth()
  const location = useLocation()

  if (isLoggingOut) {
    return <Navigate to="/" replace />
  }

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-8">
        <div className="w-6 h-6 border-2 border-foreground border-t-transparent rounded-full animate-spin mb-3" />
        <span className="text-[11px] uppercase tracking-widest text-muted">
          Loading...
        </span>
      </div>
    )
  }

  if (!isAuthenticated) {
    const loginUrl = requireAdmin ? '/admin/login' : `/auth?redirect=${encodeURIComponent(location.pathname)}`
    return <Navigate to={loginUrl} replace />
  }

  if (requireAdmin && user?.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  return children ? <>{children}</> : null
}
