import { useEffect, useState } from 'react'
import type { Drink } from '@/shared/api/diary'
import { getDrinksByDate, isSoberDay, markSoberDay, unmarkSoberDay } from '@/shared/db/diary'
import { formatDayTitle } from '@/shared/lib/date'
import { useI18n } from '@/shared/lib/i18n'
import { formatPrice, formatVolume } from '@/shared/lib/volume'
import { Modal } from '@/shared/ui/Modal'
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
      <div className="flex flex-col gap-4">
        {statusText && (
          <p className="mb-1 text-center text-[0.85rem] text-text-muted">{statusText}</p>
        )}

        <div className="flex min-h-20 flex-wrap justify-center gap-4">
          {drinks.map((d) => (
            <button
              key={d.id}
              type="button"
              className="flex min-w-[72px] flex-col items-center gap-1.5 rounded-xl px-3 py-2 active:bg-primary/8"
              onClick={() => onOpenDrink(d)}
            >
              <DrinkIcon alcohol={d.alcohol} size="lg" />
              <div className="flex flex-col items-center text-[0.85rem] text-text">
                <span className="vol">{formatVolume(d.amount, d.unit)}</span>
                {d.price != null && (
                  <span className="font-medium">{formatPrice(d.price, d.currency)}</span>
                )}
              </div>
            </button>
          ))}
          {!hasDrinks && showsAsSober && (
            <div className="pointer-events-none flex min-w-[72px] flex-col items-center gap-1.5 rounded-xl px-3 py-2 opacity-90">
              <DrinkIcon empty size="lg" />
              <div className="flex flex-col items-center text-[0.85rem] text-text">
                <span className="vol">{t('didNotDrink')}</span>
              </div>
            </div>
          )}
        </div>

        {!hasDrinks && !manualSober && (
          <button
            type="button"
            className="w-full rounded-[10px] border-[1.5px] border-[#b7e4c7] bg-[#eef6f0] px-3.5 py-3 font-semibold text-[#2d6a4f] active:bg-[#d8f3dc] disabled:opacity-60"
            disabled={busy}
            onClick={() => void markSober()}
          >
            {t('markSober')}
          </button>
        )}
        {!hasDrinks && manualSober && (
          <button
            type="button"
            className="w-full rounded-[10px] bg-[#eef1f8] px-4 py-3 font-semibold text-primary disabled:opacity-60"
            disabled={busy}
            onClick={() => void clearSober()}
          >
            {t('clearSober')}
          </button>
        )}
        <button
          type="button"
          className="mt-1 w-full rounded-[10px] bg-primary p-3.5 font-semibold tracking-[0.04em] text-white active:bg-primary-dark"
          onClick={() => onOpenDrink(null)}
        >
          {t('addDrink')}
        </button>
      </div>
    </Modal>
  )
}
