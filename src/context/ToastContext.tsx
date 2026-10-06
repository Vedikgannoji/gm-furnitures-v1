import React, { createContext, useContext, useState, useCallback } from 'react'
import { Check, X, Info } from 'lucide-react'

export interface ToastMessage {
  id: string
  title: string
  description?: string
  type: 'success' | 'info' | 'error'
}

interface ToastContextType {
  showToast: (title: string, description?: string, type?: 'success' | 'info' | 'error') => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const showToast = useCallback(
    (title: string, description?: string, type: 'success' | 'info' | 'error' = 'info') => {
      const id = Math.random().toString(36).substring(2, 9)
      setToasts((prev) => [...prev, { id, title, description, type }])

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, 2600)
    },
    []
  )

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast Notification Container — Compact, Non-blocking Corner Toast */}
      <div
        className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-auto items-end"
        aria-live="polite"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-center gap-2.5 px-3.5 py-2 bg-white text-zinc-900 border border-zinc-200 shadow-md transition-all duration-200 animate-slide-up"
            role="alert"
          >
            {/* Status Icon */}
            <div className="shrink-0 flex items-center justify-center">
              {toast.type === 'success' && (
                <div className="w-4 h-4 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
              )}
              {toast.type === 'error' && (
                <div className="w-4 h-4 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
                  <X className="w-2.5 h-2.5 stroke-[3]" />
                </div>
              )}
              {toast.type === 'info' && (
                <div className="w-4 h-4 rounded-full bg-zinc-100 text-zinc-600 flex items-center justify-center">
                  <Info className="w-2.5 h-2.5 stroke-[2.5]" />
                </div>
              )}
            </div>

            {/* Message */}
            <div className="text-xs font-medium text-zinc-800 whitespace-nowrap">
              <span>{toast.title}</span>
              {toast.description && !toast.description.includes(toast.title) && (
                <span className="text-zinc-500 font-normal ml-1.5 hidden sm:inline text-[11px]">
                  · {toast.description.replace(/^["']|["']$/g, '').slice(0, 45)}
                </span>
              )}
            </div>

            {/* Dismiss Button */}
            <button
              onClick={() => removeToast(toast.id)}
              className="text-zinc-400 hover:text-zinc-700 transition-colors ml-1 p-0.5"
              aria-label="Dismiss notification"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
