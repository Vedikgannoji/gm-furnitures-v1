import React from 'react'
import { useRouteError, Link } from 'react-router-dom'
import { AlertCircle, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export const StorefrontErrorBoundary: React.FC = () => {
  const error = useRouteError()

  // Log in development console for debugging without exposing to customers
  if (import.meta.env.DEV) {
    console.error('[Storefront Error Boundary Captured]', error)
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-20 bg-background text-foreground">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-12 h-12 mx-auto rounded-full bg-surface border border-border flex items-center justify-center text-muted">
          <AlertCircle className="w-6 h-6 stroke-[1.5]" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-light tracking-tight text-foreground">
            Something went wrong while loading this product.
          </h2>
          <p className="text-xs text-muted leading-relaxed">
            We apologize for the inconvenience. Our team has been notified. Please browse our active catalog or try again later.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <Link to="/shop">
            <Button variant="primary" size="md" className="gap-2 text-xs">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Shop</span>
            </Button>
          </Link>
          <Link to="/">
            <Button variant="outline" size="md" className="text-xs">
              Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
