import { useEffect, useState } from 'react'
import type { Drink } from '@/shared/api/diary'
import { getDatesWithDrinks, getSoberDatesInMonth } from '@/shared/db/diary'
import { daysInMonth, toDateStr, weekdayMon0, weekdays } from '@/shared/lib/date'
import { useI18n } from '@/shared/lib/i18n'
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
  const cells: (number | string)[] = []
  for (let i = 0; i < firstWeekday; i++) cells.push(`empty-${i}`)
  for (let d = 1; d <= totalDays; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(`empty-${cells.length}`)

  return (
    <div className="min-h-full">
      <div className="min-h-[calc(100vh-100px)] rounded-card bg-card px-3 pt-4 pb-5 shadow-card">
        <div className="flex items-center justify-between px-2 pt-1 pb-4">
          <button
            type="button"
            className="flex size-10 items-center justify-center rounded-full text-[1.6rem] text-primary active:bg-primary/12"
            onClick={prev}
            aria-label={t('previousMonth')}
          >
            ‹
          </button>
          <input
            type="month"
            className="min-h-10 rounded-lg border border-border bg-card px-2.5 py-1.5 text-center font-semibold text-primary"
            value={`${year}-${String(month).padStart(2, '0')}`}
            onChange={(event) => {
              const [nextYear, nextMonth] = event.target.value.split('-').map(Number)
              onYearMonth(nextYear, nextMonth)
            }}
            aria-label={t('chooseMonth')}
          />
          <button
            type="button"
            className="flex size-10 items-center justify-center rounded-full text-[1.6rem] text-primary active:bg-primary/12"
            onClick={next}
            aria-label={t('nextMonth')}
          >
            ›
          </button>
        </div>

        <div className="mb-1 grid grid-cols-7 border-b border-border pb-2 text-center text-[0.8rem] font-medium text-text-muted">
          {weekdays(locale).map((w) => (
            <div key={w} className="weekday">
              {w}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-y-0.5">
          {cells.map((cell) => {
            if (typeof cell === 'string') {
              return <div key={cell} className="min-h-16 rounded-lg" />
            }
            const day = cell
            const date = toDateStr(year, month, day)
            const drinks = byDate.get(date) ?? []
            const visual = drinks.length > 0 ? 'drinks' : soberDates.has(date) ? 'sober' : 'blank'
            const dayClasses = visual === 'blank' ? 'text-text-muted' : 'text-text'
            return (
              <button
                key={date}
                type="button"
                className={`flex min-h-16 flex-col items-center justify-start gap-0.5 rounded-lg border-b border-[#f0f2f6] px-0.5 pt-2 pb-2.5 active:bg-primary/10 ${dayClasses}`}
                onClick={() => onSelectDay(date)}
              >
                {visual === 'drinks' && (
                  <DrinkIcon stack={drinks} alcohol={drinks[0]?.alcohol} size="sm" />
                )}
                {visual === 'sober' && <DrinkIcon empty size="sm" />}
                {visual === 'blank' && <span className="block size-7" />}
                <span className="text-[0.85rem] font-medium">{day}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
