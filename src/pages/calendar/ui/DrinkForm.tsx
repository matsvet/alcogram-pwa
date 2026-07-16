import { useState } from 'react'
import { ALCOHOL_TYPES, type AlcoholType, type Drink } from '@/shared/api/diary'
import { deleteDrink, getDrinksByDate, putDrink } from '@/shared/db/diary'
import { formatDayShort } from '@/shared/lib/date'
import { alcoholName, useI18n } from '@/shared/lib/i18n'
import { toMl } from '@/shared/lib/volume'
import { Modal } from '@/shared/ui'
import { CURRENCIES, createManualDrink, DEFAULT_ABV_BY_ALCOHOL, UNITS } from '../model/drink'
import styles from './DrinkForm.module.css'
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
  const [abv, setAbv] = useState(() => {
    if (drink) return drink.abv != null ? String(drink.abv) : ''
    return defaultAbv('Beer')
  })
  const [price, setPrice] = useState(drink?.price != null ? String(drink.price) : '')
  const [currency, setCurrency] = useState(drink?.currency ?? '₽')
  const [notes, setNotes] = useState(drink?.notes ?? '')
  const [busy, setBusy] = useState(false)

  const changeAlcohol = (nextAlcohol: AlcoholType) => {
    setAlcohol(nextAlcohol)
    if (!isEdit) setAbv(defaultAbv(nextAlcohol))
  }

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
            className={styles.deleteButton}
            onClick={remove}
            aria-label={t('delete')}
            disabled={busy}
          >
            🗑
          </button>
        ) : undefined
      }
    >
      <div className={styles.form}>
        <div className={styles.typeRow}>
          <div className={styles.typePreview}>
            <DrinkIcon alcohol={alcohol} size="md" />
          </div>
          <select
            className={`${styles.field} ${styles.select}`}
            value={alcohol}
            onChange={(e) => changeAlcohol(e.target.value as AlcoholType)}
          >
            {ALCOHOL_TYPES.map((t) => (
              <option key={t} value={t}>
                {alcoholName(t, locale)}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.grid}>
          <div className={styles.fieldGroup}>
            <input
              className={styles.field}
              inputMode="decimal"
              placeholder={t('volume')}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <select
              className={styles.suffix}
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
          <div className={styles.fieldGroup}>
            <input
              className={styles.field}
              inputMode="decimal"
              placeholder="ABV, °"
              value={abv}
              onChange={(e) => setAbv(e.target.value)}
            />
          </div>
          <div className={styles.fieldGroup}>
            <input
              className={styles.field}
              inputMode="decimal"
              placeholder={t('expenses')}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
            <select
              className={styles.suffix}
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
          <div className={styles.fieldGroup}>
            <input className={styles.field} value={formatDayShort(date, locale)} readOnly />
          </div>
        </div>

        <textarea
          className={`${styles.field} ${styles.notes}`}
          placeholder={t('notes')}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
        />

        <button type="button" className={styles.saveButton} onClick={save} disabled={busy}>
          {t('save')}
        </button>
      </div>
    </Modal>
  )
}

function defaultAbv(alcohol: AlcoholType): string {
  const value = DEFAULT_ABV_BY_ALCOHOL[alcohol]
  return value == null ? '' : String(value)
}
