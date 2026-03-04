'use client'

import dynamic from 'next/dynamic'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { Maximize2, Mic, Minimize2, X } from 'lucide-react'

type Point = {
  x: number
  y: number
}

type DragState = {
  pointerId: number
  startX: number
  startY: number
  originX: number
  originY: number
}

const VoiceAssistant = dynamic(
  () => import('@/components/voice-assistant').then((mod) => mod.VoiceAssistant),
  {
    ssr: false,
    loading: () => (
      <div className="h-full flex items-center justify-center text-sm text-brand-stone">
        Loading assistant...
      </div>
    ),
  },
)

const DESKTOP_SIZE = { width: 420, height: 620 }
const MOBILE_MARGIN = 10
const DESKTOP_MARGIN = 18

type FloatingVoiceAssistantProps = {
  shopId: string
  hidden?: boolean
}

export function FloatingVoiceAssistant({ shopId, hidden = false }: FloatingVoiceAssistantProps) {
  const [open, setOpen] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const [position, setPosition] = useState<Point | null>(null)
  const [viewport, setViewport] = useState({ width: 0, height: 0 })

  const dragStateRef = useRef<DragState | null>(null)
  const panelRef = useRef<HTMLDivElement | null>(null)

  const panelSize = useMemo(() => {
    if (viewport.width === 0 || viewport.height === 0) {
      return DESKTOP_SIZE
    }

    const isMobile = viewport.width < 640
    if (!isMobile) {
      return DESKTOP_SIZE
    }

    return {
      width: Math.max(300, viewport.width - MOBILE_MARGIN * 2),
      height: Math.max(430, Math.min(560, viewport.height - 110)),
    }
  }, [viewport.height, viewport.width])

  const getBounds = useCallback(
    (width: number, height: number) => {
      const margin = viewport.width < 640 ? MOBILE_MARGIN : DESKTOP_MARGIN
      const maxX = Math.max(margin, viewport.width - width - margin)
      const maxY = Math.max(margin, viewport.height - height - margin)
      return { minX: margin, minY: margin, maxX, maxY, margin }
    },
    [viewport.height, viewport.width],
  )

  const clampToBounds = useCallback(
    (x: number, y: number, width: number, height: number) => {
      const bounds = getBounds(width, height)
      return {
        x: Math.min(bounds.maxX, Math.max(bounds.minX, x)),
        y: Math.min(bounds.maxY, Math.max(bounds.minY, y)),
      }
    },
    [getBounds],
  )

  const moveToDefaultPosition = useCallback(() => {
    if (!viewport.width || !viewport.height) return
    const bounds = getBounds(panelSize.width, panelSize.height)
    setPosition({
      x: bounds.maxX,
      y: bounds.maxY,
    })
  }, [getBounds, panelSize.height, panelSize.width, viewport.height, viewport.width])

  useEffect(() => {
    const updateViewport = () => {
      setViewport({ width: window.innerWidth, height: window.innerHeight })
    }
    updateViewport()
    window.addEventListener('resize', updateViewport)
    return () => window.removeEventListener('resize', updateViewport)
  }, [])

  useEffect(() => {
    if (!viewport.width || !viewport.height) return
    if (!position) {
      moveToDefaultPosition()
      return
    }

    const clamped = clampToBounds(position.x, position.y, panelSize.width, panelSize.height)
    if (clamped.x !== position.x || clamped.y !== position.y) {
      setPosition(clamped)
    }
  }, [
    clampToBounds,
    moveToDefaultPosition,
    panelSize.height,
    panelSize.width,
    position,
    viewport.height,
    viewport.width,
  ])

  useEffect(() => {
    if (!open) {
      dragStateRef.current = null
    }
  }, [open])

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!open || !position) return
    if (event.pointerType === 'mouse' && event.button !== 0) return

    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: position.x,
      originY: position.y,
    }

    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const dragState = dragStateRef.current
    if (!dragState || dragState.pointerId !== event.pointerId) return

    const deltaX = event.clientX - dragState.startX
    const deltaY = event.clientY - dragState.startY
    const next = clampToBounds(
      dragState.originX + deltaX,
      dragState.originY + deltaY,
      panelSize.width,
      panelSize.height,
    )
    setPosition(next)
  }

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const dragState = dragStateRef.current
    if (!dragState || dragState.pointerId !== event.pointerId) return
    dragStateRef.current = null

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  const preventDragFromButton = (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.stopPropagation()
  }

  if (hidden) {
    return null
  }

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-24 right-4 lg:bottom-5 lg:right-5 z-40 w-14 h-14 rounded-2xl bg-brand-ink text-white shadow-lg shadow-black/20 hover:bg-brand-charcoal transition-colors flex items-center justify-center"
          aria-label="Open voice assistant"
        >
          <Mic size={23} />
        </button>
      )}

      {open && position && (
        <div
          ref={panelRef}
          className="fixed z-50 rounded-2xl border border-brand-border bg-white shadow-2xl overflow-hidden"
          style={{
            width: `${panelSize.width}px`,
            height: minimized ? 'auto' : `${panelSize.height}px`,
            transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
          }}
        >
          <div
            className="h-12 px-3 border-b border-brand-border bg-brand-cream/90 backdrop-blur-sm flex items-center justify-between cursor-move select-none touch-none"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-brand-ink text-white flex items-center justify-center">
                <Mic size={14} />
              </div>
              <p className="text-sm font-semibold text-brand-ink">Voice Assistant</p>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setMinimized((value) => !value)}
                onPointerDown={preventDragFromButton}
                className="p-2 rounded-lg text-brand-stone hover:text-brand-ink hover:bg-white transition-colors"
                aria-label={minimized ? 'Expand assistant' : 'Minimize assistant'}
              >
                {minimized ? <Maximize2 size={15} /> : <Minimize2 size={15} />}
              </button>
              <button
                type="button"
                onClick={() => {
                  setOpen(false)
                  setMinimized(false)
                }}
                onPointerDown={preventDragFromButton}
                className="p-2 rounded-lg text-brand-stone hover:text-brand-ink hover:bg-white transition-colors"
                aria-label="Close assistant"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {!minimized && (
            <div className="h-[calc(100%-3rem)]">
              <VoiceAssistant shopId={shopId} />
            </div>
          )}
        </div>
      )}
    </>
  )
}
