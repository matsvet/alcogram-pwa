import { useEffect, useState } from 'react'
import type { Drink } from '@/shared/api/diary'
import { getDatesWithDrinks, getSoberDatesInMonth } from '@/shared/db/diary'
import { daysInMonth, toDateStr, todayStr, weekdayMon0, weekdays } from '@/shared/lib/date'
import { useI18n } from '@/shared/lib/i18n'
import { PageCard } from '@/shared/ui'
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
    <div className="h-full min-h-0">
      <PageCard className="flex h-full min-h-0 flex-col">
        <div className="flex h-full min-h-0 flex-col">
          <div className="flex items-center justify-between px-2 pt-1 pb-4 max-h-[600px]:pb-2">
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

          <div className="mb-1 grid grid-cols-7 border-b border-border pb-2 text-center text-[0.8rem] font-medium text-text-muted max-h-[600px]:mb-0.5 max-h-[600px]:pb-1">
            {weekdays(locale).map((w) => (
              <div key={w}>{w}</div>
            ))}
          </div>

          <div className="grid flex-1 min-h-0 grid-cols-7 [grid-auto-rows:minmax(0,1fr)] gap-y-0.5">
            {cells.map((cell) => {
              if (typeof cell === 'string') {
                return <div key={cell} className="pointer-events-none" />
              }
              const day = cell
              const date = toDateStr(year, month, day)
              const isFuture = date > today
              const drinks = byDate.get(date) ?? []
              const visual = drinks.length > 0 ? 'drinks' : soberDates.has(date) ? 'sober' : 'blank'
              const isToday = date === today
              return (
                <button
                  key={date}
                  type="button"
                  className="flex flex-col items-center justify-center gap-3 rounded-lg border-b border-[#f0f2f6] px-0.5 pt-2 pb-2.5 transition-colors active:bg-primary/10 max-h-[600px]:gap-0.5 max-h-[600px]:p-0.5 [&_svg]:max-h-[600px]:size-5 disabled:pointer-events-none"
                  onClick={() => onSelectDay(date)}
                  disabled={isFuture}
                >
                  {visual === 'drinks' && (
                    <DrinkIcon stack={drinks} alcohol={drinks[0]?.alcohol} size="sm" />
                  )}
                  {visual === 'sober' && <DrinkIcon empty size="sm" />}
                  {visual === 'blank' && <span className="block size-7 max-h-[600px]:size-5" />}
                  <span
                    className={`text-[0.85rem] font-medium ${isToday ? 'text-[1rem] font-bold text-primary' : visual === 'blank' ? 'text-text-muted' : 'text-text'}`}
                  >
                    {day}
                  </span>
                </button>
              )
            })}
          </div>

          {!isCurrentMonth && (
            <button
              type="button"
              className="mx-auto mt-3 block h-10 w-[40%] shrink-0 rounded-lg border border-border bg-primary/8 font-semibold text-primary active:bg-primary/16"
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
