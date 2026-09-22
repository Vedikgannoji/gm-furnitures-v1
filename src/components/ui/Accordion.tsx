import React, { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface AccordionItemData {
  id: string
  title: string
  content: React.ReactNode
}

export interface AccordionProps {
  items: AccordionItemData[]
  allowMultiple?: boolean
  defaultOpenIds?: string[]
  className?: string
}

export const Accordion: React.FC<AccordionProps> = ({
  items,
  allowMultiple = false,
  defaultOpenIds = [],
  className,
}) => {
  const [openIds, setOpenIds] = useState<string[]>(defaultOpenIds)

  const toggle = (id: string) => {
    setOpenIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id)
      } else {
        return allowMultiple ? [...prev, id] : [id]
      }
    })
  }

  return (
    <div className={cn('divide-y divide-border border-y border-border', className)}>
      {items.map((item) => {
        const isOpen = openIds.includes(item.id)
        return (
          <div key={item.id} className="py-1">
            <button
              onClick={() => toggle(item.id)}
              className="flex w-full items-center justify-between py-4 text-left font-medium text-sm text-foreground transition-colors hover:text-muted focus-visible:outline-none"
              aria-expanded={isOpen}
            >
              <span>{item.title}</span>
              <ChevronDown
                className={cn(
                  'h-4 w-4 shrink-0 text-muted transition-transform duration-200',
                  isOpen && 'rotate-180 text-foreground'
                )}
              />
            </button>
            {isOpen && (
              <div className="pb-5 pt-1 text-sm text-muted leading-relaxed animate-slide-down">
                {item.content}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
