import React from 'react'
import { cn } from '@/lib/utils'

export interface TabItem {
  id: string
  label: string
  count?: number
}

export interface TabsProps {
  tabs: TabItem[]
  activeTab: string
  onChange: (id: string) => void
  variant?: 'underline' | 'pill'
  className?: string
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  variant = 'underline',
  className,
}) => {
  return (
    <div
      className={cn(
        'flex items-center gap-2 overflow-x-auto no-scrollbar',
        variant === 'underline' && 'border-b border-border',
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id

        if (variant === 'pill') {
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={cn(
                'px-4 py-2 text-xs uppercase tracking-wider font-medium transition-all whitespace-nowrap border',
                isActive
                  ? 'bg-foreground text-background border-foreground'
                  : 'bg-surface text-muted hover:text-foreground border-border'
              )}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className="ml-2 text-[10px] opacity-70">({tab.count})</span>
              )}
            </button>
          )
        }

        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              'pb-3 pt-2 px-1 text-xs uppercase tracking-wider font-medium transition-all relative whitespace-nowrap',
              isActive
                ? 'text-foreground'
                : 'text-muted hover:text-foreground'
            )}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className="ml-1.5 text-[10px] opacity-70">({tab.count})</span>
            )}
            {isActive && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-foreground" />
            )}
          </button>
        )
      })}
    </div>
  )
}
