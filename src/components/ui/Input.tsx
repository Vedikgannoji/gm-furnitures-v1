import React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', label, error, helperText, id, ...props }, ref) => {
    const generatedId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={generatedId}
            className="block text-[11px] font-medium uppercase tracking-wider text-muted mb-1.5"
          >
            {label}
          </label>
        )}
        <input
          id={generatedId}
          type={type}
          ref={ref}
          className={cn(
            'flex h-10 w-full bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted/60 border border-border transition-colors duration-150 focus-visible:outline-none focus-visible:border-foreground disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-rose-500 focus-visible:border-rose-500',
            className
          )}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-rose-500">{error}</p>}
        {helperText && !error && (
          <p className="mt-1 text-xs text-muted leading-relaxed">{helperText}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
