import { useState } from 'react'
import type { Drink } from '../types'
import { ALCOHOL_TYPES, CURRENCIES, UNITS } from '../types'
import { deleteDrink, getDrinksByDate, putDrink } from '../db'
import { createManualDrink } from '../utils/csv'
import { formatDayShort } from '../utils/date'
import { toMl } from '../utils/units'
import { DrinkIcon } from '../components/DrinkIcon'
import { Modal } from '../components/Modal'

interface Props {
  date: string
  drink: Drink | null
  onClose: () => void
  onSaved: () => void
}

export function DrinkForm({ date, drink, onClose, onSaved }: Props) {
  const isEdit = !!drink
  const [alcohol, setAlcohol] = useState(drink?.alcohol ?? 'Beer')
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
      alert('Укажите тип и объём')
      return
    }
    const abvNum = abv.trim() === '' ? null : Number(String(abv).replace(',', '.'))
    const priceNum = price.trim() === '' ? null : Number(String(price).replace(',', '.'))
    if (abvNum != null && !Number.isFinite(abvNum)) {
      alert('ABV должно быть числом')
      return
    }
    if (priceNum != null && !Number.isFinite(priceNum)) {
      alert('Цена должна быть числом')
      return
    }

    setBusy(true)
    try {
      if (isEdit && drink) {
        const updated: Drink = {
          ...drink,
          alcohol: alcohol.trim(),
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
          existing.length === 0
            ? 1
            : Math.max(...existing.map((d) => d.drinkIndex)) + 1
        const created = createManualDrink({
          date,
          alcohol: alcohol.trim(),
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
    if (!confirm('Удалить запись?')) return
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
      title={isEdit ? 'Drink data' : 'Add drink'}
      onClose={onClose}
      leftAction={
        isEdit ? (
          <button
            type="button"
            className="icon-btn danger"
            onClick={remove}
            aria-label="Delete"
            disabled={busy}
          >
            🗑
          </button>
        ) : undefined
      }
    >
      <div className="form">
        <div className="form-row type-row">
          <div className="type-preview">
            <DrinkIcon alcohol={alcohol} size="md" />
          </div>
          <select
            className="field select"
            value={
              ALCOHOL_TYPES.includes(alcohol as (typeof ALCOHOL_TYPES)[number])
                ? alcohol
                : '__custom__'
            }
            onChange={(e) => {
              if (e.target.value !== '__custom__') setAlcohol(e.target.value)
            }}
          >
            {ALCOHOL_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
            {!ALCOHOL_TYPES.includes(alcohol as (typeof ALCOHOL_TYPES)[number]) && (
              <option value="__custom__">{alcohol}</option>
            )}
          </select>
        </div>

        {!ALCOHOL_TYPES.includes(alcohol as (typeof ALCOHOL_TYPES)[number]) && (
          <input
            className="field"
            value={alcohol}
            onChange={(e) => setAlcohol(e.target.value)}
            placeholder="Тип напитка"
          />
        )}

        <div className="form-grid">
          <div className="field-group">
            <input
              className="field"
              inputMode="decimal"
              placeholder="Volume"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <select
              className="field-suffix"
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
          <div className="field-group">
            <input
              className="field"
              inputMode="decimal"
              placeholder="ABV, °"
              value={abv}
              onChange={(e) => setAbv(e.target.value)}
            />
          </div>
          <div className="field-group">
            <input
              className="field"
              inputMode="decimal"
              placeholder="Expenses"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
            <select
              className="field-suffix"
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
          <div className="field-group">
            <input className="field" value={formatDayShort(date)} readOnly />
          </div>
        </div>

        <input
          className="field notes"
          placeholder="Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <button
          type="button"
          className="btn-primary"
          onClick={save}
          disabled={busy}
        >
          SAVE
        </button>
      </div>
    </Modal>
  )
}
