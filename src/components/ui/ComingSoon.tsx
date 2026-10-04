import React from 'react'
import { Link } from 'react-router-dom'
import { Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ComingSoonProps {
  variant?: 'section' | 'card' | 'product' | 'page'
  title?: string
  eyebrow?: string
  subtitle?: string
  className?: string
  actionLabel?: string
  actionHref?: string
  children?: React.ReactNode
}

export const ComingSoon: React.FC<ComingSoonProps> = ({
  variant = 'section',
  title = 'COMING SOON',
  eyebrow,
  subtitle = 'This collection is being prepared. Stay tuned.',
  className,
  actionLabel = 'Explore Available Furniture',
  actionHref = '/shop',
  children,
}) => {
  // Card-level overlay / badge
  if (variant === 'card') {
    return (
      <div className={cn('relative overflow-hidden', className)}>
        {children}
        <div className="absolute inset-0 bg-white/70 backdrop-blur-none flex flex-col items-center justify-center p-4 text-center z-10 transition-opacity">
          <span className="editorial-badge bg-black text-white px-3 py-1 font-semibold tracking-[0.2em]">
            {title}
          </span>
          {subtitle && (
            <p className="mt-2 text-[11px] text-zinc-600 max-w-[200px] leading-relaxed font-normal">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    )
  }

  // Page-level or product-level full display
  if (variant === 'page' || variant === 'product') {
    return (
      <div
        className={cn(
          'max-w-4xl mx-auto px-4 py-24 sm:py-32 text-center flex flex-col items-center justify-center',
          className
        )}
      >
        <div className="w-12 h-12 rounded-full border border-border flex items-center justify-center mb-6 text-foreground bg-surface">
          <Clock className="w-5 h-5 stroke-[1.5]" />
        </div>

        {eyebrow && (
          <span className="editorial-badge text-muted mb-2 block">
            {eyebrow}
          </span>
        )}

        <h1 className="text-3xl sm:text-5xl font-light text-foreground tracking-tight uppercase">
          {title}
        </h1>

        <p className="mt-4 text-sm sm:text-base text-muted max-w-md mx-auto leading-relaxed">
          {subtitle}
        </p>

        {actionHref && (
          <div className="mt-8">
            <Link
              to={actionHref}
              className="inline-flex items-center justify-center h-11 px-7 bg-foreground text-background hover:bg-black/85 text-xs font-semibold uppercase tracking-widest transition-colors shadow-sm"
            >
              {actionLabel}
            </Link>
          </div>
        )}
      </div>
    )
  }

  // Section-level Coming Soon (default)
  return (
    <div
      className={cn(
        'w-full bg-white border border-border p-8 sm:p-14 text-center flex flex-col items-center justify-center relative overflow-hidden',
        className
      )}
    >
      {eyebrow && (
        <span className="editorial-badge text-muted mb-2 block">
          {eyebrow}
        </span>
      )}

      <h3 className="text-xl sm:text-2xl font-light tracking-[0.15em] uppercase text-foreground">
        {title}
      </h3>

      <p className="mt-3 text-xs sm:text-sm text-muted max-w-md leading-relaxed font-normal">
        {subtitle}
      </p>

      {children && <div className="mt-8 w-full">{children}</div>}
    </div>
  )
}
