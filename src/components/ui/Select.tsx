import React from 'react'
import { cn } from '@/lib/utils'
import { ChevronDown } from 'lucide-react'

export interface SelectOption {
  label: string
  value: string
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  options: SelectOption[]
  error?: string
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, options, error, id, ...props }, ref) => {
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
        <div className="relative">
          <select
            id={generatedId}
            ref={ref}
            className={cn(
              'flex h-10 w-full appearance-none bg-background px-3 py-2 pr-9 text-sm text-foreground border border-border transition-colors duration-150 focus-visible:outline-none focus-visible:border-foreground disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer',
              error && 'border-rose-500 focus-visible:border-rose-500',
              className
            )}
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-muted" />
        </div>
        {error && <p className="mt-1 text-xs text-rose-500">{error}</p>}
      </div>
    )
  }
)

Select.displayName = 'Select'
