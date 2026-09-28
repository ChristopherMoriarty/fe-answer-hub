import { useEffect, useRef, useState, type ReactNode } from 'react'

import {
  SIDEBAR_MAX_WIDTH,
  SIDEBAR_MIN_WIDTH,
  useSidebarWidth,
} from '../../hooks/useSidebarWidth'

interface ResizableSidebarProps {
  children: ReactNode
  className?: string
}

export function ResizableSidebar({ children, className = '' }: ResizableSidebarProps) {
  const { width, setWidth } = useSidebarWidth()
  const [dragging, setDragging] = useState(false)
  const dragStartX = useRef(0)
  const dragStartWidth = useRef(width)

  useEffect(() => {
    if (!dragging) return

    const onMove = (event: PointerEvent) => {
      const delta = event.clientX - dragStartX.current
      setWidth(dragStartWidth.current + delta)
    }

    const onUp = () => {
      setDragging(false)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)

    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [dragging, setWidth])

  return (
    <aside
      style={{ width }}
      className={`relative flex h-full shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)]/80 backdrop-blur-sm ${className}`}
    >
      {children}

      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize sidebar"
        aria-valuemin={SIDEBAR_MIN_WIDTH}
        aria-valuemax={SIDEBAR_MAX_WIDTH}
        aria-valuenow={width}
        tabIndex={0}
        onPointerDown={(event) => {
          event.preventDefault()
          dragStartX.current = event.clientX
          dragStartWidth.current = width
          setDragging(true)
        }}
        onKeyDown={(event) => {
          if (event.key === 'ArrowLeft') {
            event.preventDefault()
            setWidth(width - 16)
          }
          if (event.key === 'ArrowRight') {
            event.preventDefault()
            setWidth(width + 16)
          }
        }}
        className={`absolute inset-y-0 -right-1 z-20 w-2 cursor-col-resize touch-none ${
          dragging ? 'bg-[var(--color-accent)]/25' : 'hover:bg-[var(--color-accent)]/15'
        }`}
      >
        <span
          className={`absolute inset-y-0 left-1/2 w-px -translate-x-1/2 transition ${
            dragging
              ? 'bg-[var(--color-accent)]'
              : 'bg-transparent group-hover:bg-[var(--color-border-bright)]'
          }`}
        />
      </div>
    </aside>
  )
}
