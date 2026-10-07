import React, { useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface DrawerProps {
  isOpen: boolean
  onClose: () => void
  position?: 'right' | 'left' | 'bottom'
  title?: string
  children: React.ReactNode
  className?: string
  width?: string
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  position = 'right',
  title,
  children,
  className,
  width = 'w-full max-w-full sm:max-w-md',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    const handlePopState = () => {
      onClose()
    }

    if (isOpen) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
      window.addEventListener('popstate', handlePopState)
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('popstate', handlePopState)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const positionStyles = {
    right: 'inset-y-0 right-0 h-full w-full max-w-full',
    left: 'inset-y-0 left-0 h-full w-full max-w-full',
    bottom: 'inset-x-0 bottom-0 max-h-[85vh] w-full',
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-[2px] transition-opacity animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className={cn(
          'fixed bg-background border-border shadow-2xl flex flex-col z-10 transition-transform duration-300 ease-in-out',
          positionStyles[position],
          position === 'right' && cn(width, 'border-l animate-slide-left'),
          position === 'left' && cn(width, 'border-r'),
          position === 'bottom' && 'border-t rounded-t-xl',
          className
        )}
      >
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-border shrink-0">
          {title ? (
            <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground truncate pr-2">
              {title}
            </h3>
          ) : (
            <div />
          )}
          <button
            onClick={onClose}
            className="p-2 -mr-2 text-muted hover:text-foreground transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
            aria-label="Close panel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 pb-safe">{children}</div>
      </div>
    </div>
  )
}
