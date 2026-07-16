import { type ReactNode, useEffect } from 'react'
import { useI18n } from '@/shared/lib/i18n'

interface Props {
  title: string
  onClose: () => void
  children: ReactNode
  leftAction?: ReactNode
}

export function Modal({ title, onClose, children, leftAction }: Props) {
  const { t } = useI18n()
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: The backdrop is decorative; the close button and Escape provide keyboard alternatives.
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-[rgba(40,50,70,0.45)] p-4 animate-[modal-fade-in_0.15s_ease]"
      onClick={onClose}
      role="presentation"
    >
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: This only prevents clicks on dialog content from reaching the backdrop. */}
      <div
        className="max-h-[min(90vh,640px)] w-full max-w-[360px] overflow-y-auto rounded-[14px] bg-card shadow-[0_12px_40px_rgba(0,0,0,0.2)] animate-[modal-slide-up_0.2s_ease]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="grid grid-cols-[40px_1fr_40px] items-center border-b border-[#eef1f5] px-3 pt-3.5 pb-2">
          <div className="flex items-center justify-start">{leftAction ?? <span />}</div>
          <h2
            id="modal-title"
            className="m-0 text-center text-[1.15rem] font-semibold text-primary"
          >
            {title}
          </h2>
          <button
            type="button"
            className="flex size-9 items-center justify-center rounded-full text-[1.5rem] leading-none text-text-muted"
            onClick={onClose}
            aria-label={t('close')}
          >
            ×
          </button>
        </header>
        <div className="p-4">{children}</div>
      </div>
    </div>
  )
}
