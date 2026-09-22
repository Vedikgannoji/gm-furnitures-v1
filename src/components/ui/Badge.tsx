import React from 'react'
import { cn } from '@/lib/utils'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'outline' | 'secondary' | 'dark' | 'success' | 'warning' | 'danger'
  size?: 'sm' | 'md'
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'default',
  size = 'md',
  children,
  ...props
}) => {
  const variantStyles = {
    default: 'bg-surface text-foreground border border-border',
    outline: 'bg-transparent text-foreground border border-border',
    secondary: 'bg-zinc-100 text-zinc-800 border border-zinc-200',
    dark: 'bg-foreground text-background border border-foreground',
    success: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
    warning: 'bg-amber-50 text-amber-800 border border-amber-200',
    danger: 'bg-rose-50 text-rose-800 border border-rose-200',
  }

  const sizeStyles = {
    sm: 'text-[10px] py-0.5 px-2 font-medium tracking-widest uppercase',
    md: 'text-xs py-1 px-2.5 font-medium tracking-wider uppercase',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center transition-colors',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}
