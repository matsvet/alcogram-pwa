import { useEffect, useState } from 'react'
import type { Drink } from '../types'
import { getDrinksByDate } from '../db'
import { formatDayTitle } from '../utils/date'
import { formatPrice, formatVolume } from '../utils/units'
import { DrinkIcon } from '../components/DrinkIcon'
import { Modal } from '../components/Modal'

interface Props {
  date: string
  onClose: () => void
  onOpenDrink: (drink: Drink | null) => void
  refreshKey: number
}

export function DayModal({ date, onClose, onOpenDrink, refreshKey }: Props) {
  const [drinks, setDrinks] = useState<Drink[]>([])

  useEffect(() => {
    getDrinksByDate(date).then(setDrinks)
  }, [date, refreshKey])

  return (
    <Modal title={formatDayTitle(date)} onClose={onClose}>
      <div className="day-drinks">
        {drinks.length === 0 && (
          <p className="muted center">Нет записей за этот день</p>
        )}
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
        </div>
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
