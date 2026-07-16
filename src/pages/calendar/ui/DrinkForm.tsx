import { useState } from 'react'
import { ALCOHOL_TYPES, type AlcoholType, type Drink } from '@/shared/api/diary'
import { deleteDrink, getDrinksByDate, putDrink } from '@/shared/db/diary'
import { formatDayShort } from '@/shared/lib/date'
import { alcoholName, useI18n } from '@/shared/lib/i18n'
import { toMl } from '@/shared/lib/volume'
import { Modal } from '@/shared/ui/Modal'
import { CURRENCIES, createManualDrink, UNITS } from '../model/drink'
import { DrinkIcon } from './DrinkIcon'

interface Props {
  date: string
  drink: Drink | null
  onClose: () => void
  onSaved: () => void
}

export function DrinkForm({ date, drink, onClose, onSaved }: Props) {
  const { locale, t } = useI18n()
  const isEdit = !!drink
  const [alcohol, setAlcohol] = useState<AlcoholType>(drink?.alcohol ?? 'Beer')
  const [amount, setAmount] = useState(drink ? String(drink.amount) : '')
  const [unit, setUnit] = useState(drink?.unit ?? 'l')
  const [abv, setAbv] = useState(drink?.abv != null ? String(drink.abv) : '')
  const [price, setPrice] = useState(drink?.price != null ? String(drink.price) : '')
  const [currency, setCurrency] = useState(drink?.currency ?? '₽')
  const [notes, setNotes] = useState(drink?.notes ?? '')
  const [busy, setBusy] = useState(false)

  const save = async () => {
    const amountNum = Number(String(amount).replace(',', '.'))
    if (!alcohol.trim() || !Number.isFinite(amountNum) || amountNum <= 0) {
      alert(t('requiredDrink'))
      return
    }
    const abvNum = abv.trim() === '' ? null : Number(String(abv).replace(',', '.'))
    const priceNum = price.trim() === '' ? null : Number(String(price).replace(',', '.'))
    if (abvNum != null && !Number.isFinite(abvNum)) {
      alert(t('abvNumber'))
      return
    }
    if (priceNum != null && !Number.isFinite(priceNum)) {
      alert(t('priceNumber'))
      return
    }

    setBusy(true)
    try {
      if (isEdit && drink) {
        const updated: Drink = {
          ...drink,
          alcohol,
          amount: amountNum,
          unit,
          amountMl: toMl(amountNum, unit),
          abv: abvNum,
          price: priceNum,
          currency,
          notes: notes.trim(),
          updatedAt: Date.now(),
        }
        await putDrink(updated)
      } else {
        const existing = await getDrinksByDate(date)
        const nextIndex =
          existing.length === 0 ? 1 : Math.max(...existing.map((d) => d.drinkIndex)) + 1
        const created = createManualDrink({
          date,
          alcohol,
          amount: amountNum,
          unit,
          abv: abvNum,
          price: priceNum,
          currency,
          notes: notes.trim(),
          drinkIndex: nextIndex,
        })
        await putDrink(created)
      }
      onSaved()
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    if (!drink) return
    if (!confirm(t('deleteDrink'))) return
    setBusy(true)
    try {
      await deleteDrink(drink.id)
      onSaved()
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      title={isEdit ? t('drinkData') : t('addDrink')}
      onClose={onClose}
      leftAction={
        isEdit ? (
          <button
            type="button"
            className="flex size-9 items-center justify-center rounded-full text-[1.1rem] text-text-muted disabled:opacity-60"
            onClick={remove}
            aria-label={t('delete')}
            disabled={busy}
          >
            🗑
          </button>
        ) : undefined
      }
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-stretch gap-2.5">
          <div className="flex size-[52px] shrink-0 items-center justify-center rounded-[10px] border-[1.5px] border-primary">
            <DrinkIcon alcohol={alcohol} size="md" />
          </div>
          <select
            className="w-full rounded-[10px] border-[1.5px] border-primary bg-white px-3.5 py-3 outline-none focus:shadow-[0_0_0_3px_rgba(107,127,232,0.2)]"
            value={alcohol}
            onChange={(e) => setAlcohol(e.target.value as AlcoholType)}
          >
            {ALCOHOL_TYPES.map((t) => (
              <option key={t} value={t}>
                {alcoholName(t, locale)}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="flex overflow-hidden rounded-[10px] border-[1.5px] border-primary bg-white">
            <input
              className="min-w-0 flex-1 border-0 px-3.5 py-3 outline-none"
              inputMode="decimal"
              placeholder={t('volume')}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <select
              className="max-w-[52px] border-0 border-l border-border bg-[#f7f8fc] px-2 text-[0.9rem] text-text-muted"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
            >
              {UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
          <div className="flex overflow-hidden rounded-[10px] border-[1.5px] border-primary bg-white">
            <input
              className="min-w-0 flex-1 border-0 px-3.5 py-3 outline-none"
              inputMode="decimal"
              placeholder="ABV, °"
              value={abv}
              onChange={(e) => setAbv(e.target.value)}
            />
          </div>
          <div className="flex overflow-hidden rounded-[10px] border-[1.5px] border-primary bg-white">
            <input
              className="min-w-0 flex-1 border-0 px-3.5 py-3 outline-none"
              inputMode="decimal"
              placeholder={t('expenses')}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
            <select
              className="max-w-[52px] border-0 border-l border-border bg-[#f7f8fc] px-2 text-[0.9rem] text-text-muted"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="flex overflow-hidden rounded-[10px] border-[1.5px] border-primary bg-white">
            <input
              className="min-w-0 flex-1 border-0 px-3.5 py-3 outline-none"
              value={formatDayShort(date, locale)}
              readOnly
            />
          </div>
        </div>

        <input
          className="w-full rounded-[10px] border-[1.5px] border-primary bg-white px-3.5 py-3 text-center outline-none focus:shadow-[0_0_0_3px_rgba(107,127,232,0.2)]"
          placeholder={t('notes')}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <button
          type="button"
          className="mt-1 w-full rounded-[10px] bg-primary p-3.5 font-semibold tracking-[0.04em] text-white active:bg-primary-dark disabled:opacity-60"
          onClick={save}
          disabled={busy}
        >
          {t('save')}
        </button>
      </div>
    </Modal>
  )
}
