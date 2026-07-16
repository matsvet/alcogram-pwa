import { type ReactNode, useEffect } from 'react'

interface Props {
  title: string
  onClose: () => void
  children: ReactNode
  leftAction?: ReactNode
}

export function Modal({ title, onClose, children, leftAction }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: The backdrop is decorative; the close button and Escape provide keyboard alternatives.
    <div className="modal-overlay" onClick={onClose} role="presentation">
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: This only prevents clicks on dialog content from reaching the backdrop. */}
      <div
        className="modal-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal-header">
          <div className="modal-left">{leftAction ?? <span />}</div>
          <h2 id="modal-title">{title}</h2>
          <button type="button" className="icon-btn close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  )
}
