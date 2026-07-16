import { useEffect, useState } from 'react'
import type { Drink } from '@/shared/api/diary'
import { getDatesWithDrinks, getSoberDatesInMonth } from '@/shared/db/diary'
import { daysInMonth, toDateStr, todayStr, weekdayMon0, weekdays } from '@/shared/lib/date'
import { useI18n } from '@/shared/lib/i18n'
import { PageCard } from '@/shared/ui'
import styles from './CalendarPage.module.css'
import { DrinkIcon } from './DrinkIcon'

interface Props {
  year: number
  month: number
  onYearMonth: (y: number, m: number) => void
  onSelectDay: (date: string) => void
  refreshKey: number
}

export function CalendarPage({ year, month, onYearMonth, onSelectDay, refreshKey }: Props) {
  const { locale, t } = useI18n()
  const [byDate, setByDate] = useState<Map<string, Drink[]>>(new Map())
  const [soberDates, setSoberDates] = useState<Set<string>>(new Set())

  // biome-ignore lint/correctness/useExhaustiveDependencies: refreshKey intentionally reloads data after a mutation.
  useEffect(() => {
    let cancelled = false
    Promise.all([getDatesWithDrinks(year, month), getSoberDatesInMonth(year, month)]).then(
      ([map, sober]) => {
        if (!cancelled) {
          setByDate(map)
          setSoberDates(sober)
        }
      },
    )
    return () => {
      cancelled = true
    }
  }, [year, month, refreshKey])

  const prev = () => {
    if (month === 1) onYearMonth(year - 1, 12)
    else onYearMonth(year, month - 1)
  }
  const next = () => {
    if (month === 12) onYearMonth(year + 1, 1)
    else onYearMonth(year, month + 1)
  }

  const totalDays = daysInMonth(year, month)
  const firstWeekday = weekdayMon0(toDateStr(year, month, 1))
  const today = todayStr()
  const [currentYear, currentMonth] = today.split('-').map(Number)
  const isCurrentMonth = year === currentYear && month === currentMonth
  const cells: (number | string)[] = []
  for (let i = 0; i < firstWeekday; i++) cells.push(`empty-${i}`)
  for (let d = 1; d <= totalDays; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(`empty-${cells.length}`)

  return (
    <div className={styles.root}>
      <PageCard>
        <div className={styles.calendar}>
          <div className={styles.monthNavigation}>
            <button
              type="button"
              className={styles.monthButton}
              onClick={prev}
              aria-label={t('previousMonth')}
            >
              ‹
            </button>
            <input
              type="month"
              className={styles.monthPicker}
              value={`${year}-${String(month).padStart(2, '0')}`}
              onChange={(event) => {
                const [nextYear, nextMonth] = event.target.value.split('-').map(Number)
                onYearMonth(nextYear, nextMonth)
              }}
              aria-label={t('chooseMonth')}
            />
            <button
              type="button"
              className={styles.monthButton}
              onClick={next}
              aria-label={t('nextMonth')}
            >
              ›
            </button>
          </div>

          <div className={styles.weekdays}>
            {weekdays(locale).map((w) => (
              <div key={w}>{w}</div>
            ))}
          </div>

          <div className={styles.days}>
            {cells.map((cell) => {
              if (typeof cell === 'string') {
                return <div key={cell} className={styles.emptySlot} />
              }
              const day = cell
              const date = toDateStr(year, month, day)
              const drinks = byDate.get(date) ?? []
              const visual = drinks.length > 0 ? 'drinks' : soberDates.has(date) ? 'sober' : 'blank'
              return (
                <button
                  key={date}
                  type="button"
                  className={`${styles.dayCell} ${visual === 'blank' ? styles.isBlank : ''} ${date === today ? styles.isToday : ''}`}
                  onClick={() => onSelectDay(date)}
                >
                  {visual === 'drinks' && (
                    <DrinkIcon stack={drinks} alcohol={drinks[0]?.alcohol} size="sm" />
                  )}
                  {visual === 'sober' && <DrinkIcon empty size="sm" />}
                  {visual === 'blank' && <span className={styles.iconSpacer} />}
                  <span className={styles.dayNumber}>{day}</span>
                </button>
              )
            })}
          </div>

          {!isCurrentMonth && (
            <button
              type="button"
              className={styles.todayButton}
              onClick={() => onYearMonth(currentYear, currentMonth)}
            >
              {t('today')}
            </button>
          )}
        </div>
      </PageCard>
    </div>
  )
}
