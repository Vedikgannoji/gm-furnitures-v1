import React from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface BreadcrumbItem {
  label: string
  href?: string
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[]
  className?: string
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, className }) => {
  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center text-xs text-muted', className)}>
      <ol className="flex items-center space-x-2">
        <li>
          <Link to="/" className="hover:text-foreground transition-colors uppercase tracking-wider">
            Home
          </Link>
        </li>
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          return (
            <li key={index} className="flex items-center space-x-2">
              <ChevronRight className="w-3 h-3 text-muted/60" />
              {item.href && !isLast ? (
                <Link
                  to={item.href}
                  className="hover:text-foreground transition-colors uppercase tracking-wider"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="text-foreground font-medium uppercase tracking-wider">
                  {item.label}
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
