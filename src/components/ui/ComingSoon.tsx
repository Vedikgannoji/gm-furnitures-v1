import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ComingSoonBadgeProps {
  className?: string
  label?: string
}

export const ComingSoonBadge: React.FC<ComingSoonBadgeProps> = ({
  className,
  label = 'COMING SOON',
}) => {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center text-[9px] font-semibold tracking-widest uppercase bg-black text-white px-2 py-0.5 shadow-sm leading-none',
        className
      )}
    >
      {label}
    </span>
  )
}

export interface ComingSoonProps {
  variant?: 'badge' | 'header' | 'card' | 'page'
  title?: string
  eyebrow?: string
  subtitle?: string
  className?: string
  actionLabel?: string
  actionHref?: string
  children?: React.ReactNode
}

export const ComingSoon: React.FC<ComingSoonProps> = ({
  variant = 'header',
  title = 'COMING SOON',
  eyebrow,
  subtitle = 'This collection is being prepared for upcoming release.',
  className,
  actionLabel = 'Explore Active Catalog',
  actionHref = '/shop',
  children,
}) => {
  // 1. Badge variant
  if (variant === 'badge') {
    return <ComingSoonBadge className={className} label={title} />
  }

  // 2. Card badge overlay (subtle top-left badge without desaturating the image)
  if (variant === 'card') {
    return (
      <div className={cn('relative overflow-hidden', className)}>
        {children}
        <div className="absolute top-3 left-3 z-10">
          <ComingSoonBadge label={title} />
        </div>
      </div>
    )
  }

  // 3. Editorial Preview Page variant
  if (variant === 'page') {
    return (
      <div
        className={cn(
          'w-full max-w-3xl mx-auto py-12 sm:py-16 text-center flex flex-col items-center justify-center',
          className
        )}
      >
        <div className="mb-4">
          <ComingSoonBadge label={title} />
        </div>

        {eyebrow && (
          <span className="editorial-badge text-muted mb-2 block">
            {eyebrow}
          </span>
        )}

        <h1 className="text-2xl sm:text-4xl font-light text-foreground tracking-tight uppercase">
          Unreleased Atelier Preview
        </h1>

        <p className="mt-3 text-xs sm:text-sm text-muted max-w-lg mx-auto leading-relaxed">
          {subtitle}
        </p>

        {children && <div className="mt-8 w-full">{children}</div>}

        {actionHref && (
          <div className="mt-8">
            <Link
              to={actionHref}
              className="inline-flex items-center gap-2 h-11 px-7 bg-foreground text-background hover:bg-black/85 text-xs font-semibold uppercase tracking-widest transition-colors shadow-sm"
            >
              <span>{actionLabel}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </div>
    )
  }

  // 4. Header status / compact banner (default)
  return (
    <div
      className={cn(
        'inline-flex items-center gap-2',
        className
      )}
    >
      <ComingSoonBadge label={title} />
      {subtitle && (
        <span className="text-[11px] text-muted tracking-wide font-normal hidden sm:inline">
          {subtitle}
        </span>
      )}
    </div>
  )
}
