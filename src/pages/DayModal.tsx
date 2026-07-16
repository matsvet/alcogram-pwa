import { useEffect, useState } from 'react'
import type { Drink } from '../types'
import {
  getDrinksByDate,
  isSoberDay,
  markSoberDay,
  unmarkSoberDay,
} from '../db'
import { formatDayTitle } from '../utils/date'
import { formatPrice, formatVolume } from '../utils/units'
import { DrinkIcon } from '../components/DrinkIcon'
import { Modal } from '../components/Modal'

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

  let statusText = 'Нет данных — день не заполнен'
  if (hasDrinks) {
    statusText = ''
  } else if (showsAsSober) {
    statusText = 'Отмечено: не пил'
  }

  return (
    <Modal title={formatDayTitle(date)} onClose={onClose}>
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
                <span className="vol">не пил</span>
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
            Не пил / сегодня не пью
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
            Снять отметку «не пил»
          </button>
        )}
        <button
          type="button"
          className="btn-primary"
          onClick={() => onOpenDrink(null)}
        >
          ADD DRINK
        </button>
      </div>
    </Modal>
  )
}
