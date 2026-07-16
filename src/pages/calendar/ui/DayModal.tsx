import { useEffect, useState } from 'react'
import type { Drink } from '@/shared/api/diary'
import { getDrinksByDate, isSoberDay, markSoberDay, unmarkSoberDay } from '@/shared/db/diary'
import { formatDayTitle, todayStr } from '@/shared/lib/date'
import { useI18n } from '@/shared/lib/i18n'
import { formatPrice, formatVolume } from '@/shared/lib/volume'
import { Modal } from '@/shared/ui'
import styles from './DayModal.module.css'
import { DrinkIcon } from './DrinkIcon'

interface Props {
  date: string
  onClose: () => void
  onOpenDrink: (drink: Drink | null) => void
  onChanged: () => void
  refreshKey: number
}

export function DayModal({ date, onClose, onOpenDrink, onChanged, refreshKey }: Props) {
  const { locale, t } = useI18n()
  const [drinks, setDrinks] = useState<Drink[]>([])
  const [manualSober, setManualSober] = useState(false)
  const [busy, setBusy] = useState(false)

  // biome-ignore lint/correctness/useExhaustiveDependencies: refreshKey intentionally reloads data after a mutation.
  useEffect(() => {
    getDrinksByDate(date).then(setDrinks)
    isSoberDay(date).then(setManualSober)
  }, [date, refreshKey])

  const hasDrinks = drinks.length > 0
  const showsAsSober = !hasDrinks && manualSober
  const isFuture = date > todayStr()

  const markSober = async () => {
    if (hasDrinks || isFuture) return
    setBusy(true)
    try {
      await markSoberDay(date)
      setManualSober(true)
      onChanged()
    } finally {
      setBusy(false)
    }
  }

  const clearSober = async () => {
    if (isFuture) return
    setBusy(true)
    try {
      await unmarkSoberDay(date)
      setManualSober(false)
      onChanged()
    } finally {
      setBusy(false)
    }
  }

  let statusText = t('noDataDay')
  if (hasDrinks) {
    statusText = ''
  } else if (showsAsSober) {
    statusText = t('markedSober')
  }

  return (
    <Modal title={formatDayTitle(date, locale)} onClose={onClose}>
      <div className={styles.root}>
        {statusText && <p className={styles.status}>{statusText}</p>}

        <div className={styles.cards}>
          {drinks.map((d) => (
            <button
              key={d.id}
              type="button"
              className={styles.card}
              onClick={() => onOpenDrink(d)}
              disabled={isFuture}
            >
              <DrinkIcon alcohol={d.alcohol} size="lg" />
              <div className={styles.cardMeta}>
                <span>{formatVolume(d.amount, d.unit)}</span>
                {d.price != null && (
                  <span className={styles.price}>{formatPrice(d.price, d.currency)}</span>
                )}
              </div>
            </button>
          ))}
          {!hasDrinks && showsAsSober && (
            <div className={`${styles.card} ${styles.soberPreview}`}>
              <DrinkIcon empty size="lg" />
              <div className={styles.cardMeta}>
                <span>{t('didNotDrink')}</span>
              </div>
            </div>
          )}
        </div>

        {!isFuture && !hasDrinks && !manualSober && (
          <button
            type="button"
            className={styles.soberButton}
            disabled={busy}
            onClick={() => void markSober()}
          >
            {t('markSober')}
          </button>
        )}
        {!isFuture && !hasDrinks && manualSober && (
          <button
            type="button"
            className={styles.secondaryButton}
            disabled={busy}
            onClick={() => void clearSober()}
          >
            {t('clearSober')}
          </button>
        )}
        {!isFuture && (
          <button type="button" className={styles.primaryButton} onClick={() => onOpenDrink(null)}>
            {t('addDrink')}
          </button>
        )}
      </div>
    </Modal>
  )
}
