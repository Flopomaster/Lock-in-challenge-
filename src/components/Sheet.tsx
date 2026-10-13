import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { IconClose } from './icons'

interface SheetProps {
  title: ReactNode
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
}

/** Bottom sheet modal — the main editing surface on phones. */
export default function Sheet({ title, onClose, children, footer }: SheetProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // Portal: a transformed ancestor (e.g. a page entry animation) would otherwise trap `position: fixed`.
  return createPortal(
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/45 animate-fade-in" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        className="animate-sheet-up flex w-full max-w-lg flex-col rounded-t-3xl bg-surface"
        style={{ maxHeight: 'calc(100dvh - 2.5rem)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-border px-5 py-3.5">
          <h2 className="flex-1 truncate text-lg font-bold">{title}</h2>
          <button type="button" onClick={onClose} className="rounded-full p-1.5 text-text-dim hover:bg-surface-hi" aria-label="close">
            <IconClose size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && (
          <div className="flex gap-2 border-t border-border px-5 pt-3" style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}>
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}
