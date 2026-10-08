import { useEffect, useId, useRef } from 'react'
import type { ReactNode } from 'react'

interface Props {
  title: string
  onClose: () => void
  children: ReactNode
}

export function Modal({ title, onClose, children }: Props) {
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const pressStartedOnBackdrop = useRef(false)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    panelRef.current?.focus()
    return () => {
      document.body.style.overflow = previousOverflow
      previouslyFocused?.focus?.()
    }
  }, [])

  return (
    <div
      className="fixed inset-0 z-50 flex animate-fade-in items-start justify-center overflow-y-auto bg-slate-900/50 p-4 pt-10 backdrop-blur-sm sm:pt-16"
      // Only close when the click both started and ended on the backdrop, so dragging
      // a text selection out of a field doesn't dismiss the dialog.
      onMouseDown={(e) => {
        pressStartedOnBackdrop.current = e.target === e.currentTarget
      }}
      onClick={(e) => {
        if (pressStartedOnBackdrop.current && e.target === e.currentTarget) onClose()
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="w-full max-w-2xl animate-pop-in rounded-xl bg-white p-5 shadow-2xl ring-1 ring-slate-900/5 outline-none sm:p-6 dark:bg-slate-900 dark:ring-white/10"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 id={titleId} className="min-w-0 truncate text-lg font-semibold text-slate-900 dark:text-slate-100">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5">
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
