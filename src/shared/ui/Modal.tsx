import { type ReactNode, useEffect } from 'react'
import { useI18n } from '@/shared/lib/i18n'
import styles from './Modal.module.css'

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
    <div className={styles.overlay} onClick={onClose} role="presentation">
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: This only prevents clicks on dialog content from reaching the backdrop. */}
      <div
        className={styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className={styles.header}>
          <div className={styles.leftAction}>{leftAction ?? <span />}</div>
          <h2 id="modal-title" className={styles.title}>
            {title}
          </h2>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label={t('close')}
          >
            ×
          </button>
        </header>
        <div className={styles.body}>{children}</div>
      </div>
    </div>
  )
}
