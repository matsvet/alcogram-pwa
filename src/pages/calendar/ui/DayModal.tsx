import { useEffect, useState } from 'react'
import type { Drink } from '@/shared/api/diary'
import {
  getDrinksByDate,
  isSoberDay,
  markSoberDay,
  unmarkSoberDay,
} from '@/shared/db/diary'
import { formatDayTitle } from '@/shared/lib/date'
import { formatPrice, formatVolume } from '@/shared/lib/volume'
import { useI18n } from '@/shared/lib/i18n'
import { Modal } from '@/shared/ui/Modal'
import { DrinkIcon } from './DrinkIcon'

interface Props {
  date: string
  onClose: () => void
  onOpenDrink: (drink: Drink | null) => void
  onChanged: () => void
  refreshKey: number
}

export function DayModal({
  date,
  onClose,
  onOpenDrink,
  onChanged,
  refreshKey,
}: Props) {
  const { locale, t } = useI18n()
  const [drinks, setDrinks] = useState<Drink[]>([])
  const [manualSober, setManualSober] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    getDrinksByDate(date).then(setDrinks)
    isSoberDay(date).then(setManualSober)
  }, [date, refreshKey])

  const hasDrinks = drinks.length > 0
  const showsAsSober = !hasDrinks && manualSober

  const markSober = async () => {
    if (hasDrinks) return
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
      <div className="day-drinks">
        {statusText && <p className="muted center day-status">{statusText}</p>}

        <div className="drink-cards">
          {drinks.map((d) => (
            <button
              key={d.id}
              type="button"
              className="drink-card"
              onClick={() => onOpenDrink(d)}
            >
              <DrinkIcon alcohol={d.alcohol} size="lg" />
              <div className="drink-card-meta">
                <span className="vol">{formatVolume(d.amount, d.unit)}</span>
                {d.price != null && (
                  <span className="price">{formatPrice(d.price, d.currency)}</span>
                )}
              </div>
            </button>
          ))}
          {!hasDrinks && showsAsSober && (
            <div className="drink-card sober-preview">
              <DrinkIcon empty size="lg" />
              <div className="drink-card-meta">
                <span className="vol">{t('didNotDrink')}</span>
              </div>
            </div>
          )}
        </div>

        {!hasDrinks && !manualSober && (
          <button
            type="button"
            className="btn-sober"
            disabled={busy}
            onClick={() => void markSober()}
          >
            {t('markSober')}
          </button>
        )}
        {!hasDrinks && manualSober && (
          <button
            type="button"
            className="btn-secondary"
            style={{ width: '100%' }}
            disabled={busy}
            onClick={() => void clearSober()}
          >
            {t('clearSober')}
          </button>
        )}
        <button
          type="button"
          className="btn-primary"
          onClick={() => onOpenDrink(null)}
        >
          {t('addDrink')}
        </button>
      </div>
    </Modal>
  )
}
