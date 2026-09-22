import React from 'react'
import { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Link } from 'react-router-dom'

export interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  actionLabel?: string
  actionHref?: string
  onAction?: () => void
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-4 max-w-md mx-auto">
      <div className="w-14 h-14 rounded-full bg-surface border border-border flex items-center justify-center mb-5 text-muted">
        <Icon className="w-6 h-6 stroke-[1.5]" />
      </div>
      <h3 className="text-base font-medium text-foreground tracking-tight">{title}</h3>
      <p className="text-xs text-muted mt-2 leading-relaxed max-w-sm">{description}</p>
      {(actionLabel && actionHref) && (
        <div className="mt-6">
          <Link to={actionHref}>
            <Button variant="primary" size="md">
              {actionLabel}
            </Button>
          </Link>
        </div>
      )}
      {(actionLabel && onAction && !actionHref) && (
        <div className="mt-6">
          <Button onClick={onAction} variant="primary" size="md">
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  )
}
