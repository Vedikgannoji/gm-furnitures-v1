import React, { useState, useEffect, useRef } from 'react'
import { X, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react'

interface ImageZoomModalProps {
  isOpen: boolean
  imageSrc: string
  altText: string
  onClose: () => void
}

export const ImageZoomModal: React.FC<ImageZoomModalProps> = ({
  isOpen,
  imageSrc,
  altText,
  onClose,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1.5)
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 50, y: 50 })
  const containerRef = useRef<HTMLDivElement | null>(null)

  // Reset zoom on open
  useEffect(() => {
    if (isOpen) {
      setZoomLevel(1.5)
      setPosition({ x: 50, y: 50 })
    }
  }, [isOpen, imageSrc])

  // ESC key listener
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Wheel zoom listener
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.deltaY < 0) {
      // Zoom in
      setZoomLevel((prev) => Math.min(4, Number((prev + 0.25).toFixed(2))))
    } else {
      // Zoom out
      setZoomLevel((prev) => Math.max(1, Number((prev - 0.25).toFixed(2))))
    }
  }

  // Mouse move to pan inspection
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setPosition({
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y)),
    })
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md select-none transition-opacity duration-300"
      onClick={onClose}
    >
      {/* Top action toolbar */}
      <div
        className="absolute top-4 inset-x-4 sm:inset-x-8 flex items-center justify-between z-30 pointer-events-none"
      >
        <div className="flex items-center gap-2 bg-black/70 backdrop-blur border border-white/20 text-white px-3 py-1.5 rounded text-xs font-mono tracking-wider pointer-events-auto">
          <span>{Math.round(zoomLevel * 100)}% ZOOM</span>
          <span className="text-zinc-400">·</span>
          <span className="text-[11px] text-zinc-300 hidden sm:inline">
            Scroll mouse wheel to zoom in/out · Move to pan
          </span>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Zoom controls */}
          <div className="flex items-center bg-black/70 backdrop-blur border border-white/20 rounded overflow-hidden">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setZoomLevel((prev) => Math.max(1, Number((prev - 0.25).toFixed(2))))
              }}
              className="p-2 text-white hover:bg-white/20 transition-colors"
              title="Zoom out"
              aria-label="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setZoomLevel(1)
                setPosition({ x: 50, y: 50 })
              }}
              className="px-2 py-2 text-[11px] text-white hover:bg-white/20 transition-colors font-mono"
              title="Reset zoom"
              aria-label="Reset zoom"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setZoomLevel((prev) => Math.min(4, Number((prev + 0.25).toFixed(2))))
              }}
              className="p-2 text-white hover:bg-white/20 transition-colors"
              title="Zoom in"
              aria-label="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="p-2.5 bg-black/80 hover:bg-white hover:text-black text-white border border-white/20 rounded transition-colors shadow-lg"
            title="Close viewer (Esc)"
            aria-label="Close viewer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Image Container */}
      <div
        ref={containerRef}
        onWheel={handleWheel}
        onMouseMove={handleMouseMove}
        onClick={(e) => e.stopPropagation()}
        className="relative w-[92vw] h-[85vh] sm:w-[86vw] sm:h-[88vh] max-w-6xl overflow-hidden flex items-center justify-center cursor-crosshair"
      >
        <img
          src={imageSrc}
          alt={altText}
          style={{
            transform: `scale(${zoomLevel})`,
            transformOrigin: `${position.x}% ${position.y}%`,
            transition: 'transform 0.12s ease-out',
          }}
          className="max-w-full max-h-full object-contain pointer-events-none drop-shadow-2xl"
          loading="eager"
        />
      </div>

      {/* Bottom hint */}
      <div className="absolute bottom-4 inset-x-0 text-center pointer-events-none">
        <span className="bg-black/60 backdrop-blur px-3 py-1 rounded text-[11px] text-zinc-400 font-mono tracking-wider">
          Press <kbd className="text-white font-semibold">ESC</kbd> or click outside to exit
        </span>
      </div>
    </div>
  )
}
