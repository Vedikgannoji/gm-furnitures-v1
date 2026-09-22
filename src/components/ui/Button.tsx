import React from 'react'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'link' | 'dark'
  size?: 'sm' | 'md' | 'lg' | 'icon'
  isLoading?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground disabled:opacity-40 disabled:cursor-not-allowed select-none active:scale-[0.98]'

    const variantStyles = {
      primary:
        'bg-foreground text-background hover:bg-black/85 shadow-none border border-foreground',
      secondary:
        'bg-surface hover:bg-surface-subtle text-foreground border border-border',
      outline:
        'bg-transparent border border-border hover:border-foreground text-foreground hover:bg-surface/50',
      ghost:
        'bg-transparent hover:bg-surface text-foreground',
      link:
        'bg-transparent text-foreground underline-offset-4 hover:underline p-0 h-auto font-normal',
      dark:
        'bg-black text-white hover:bg-zinc-900 border border-black',
    }

    const sizeStyles = {
      sm: 'h-8 px-3 text-xs tracking-wider uppercase',
      md: 'h-10 px-5 text-xs tracking-wider uppercase',
      lg: 'h-12 px-7 text-sm tracking-wider uppercase',
      icon: 'h-10 w-10 p-0',
    }

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
