import { useEffect, useState } from 'react'
import type { Drink } from '../types'
import { getDatesWithDrinks } from '../db'
import { daysInMonth, monthName, toDateStr, WEEKDAYS, weekdayMon0 } from '../utils/date'
import { DrinkIcon } from '../components/DrinkIcon'

interface Props {
  year: number
  month: number
  onYearMonth: (y: number, m: number) => void
  onSelectDay: (date: string) => void
  refreshKey: number
}

export function CalendarPage({
  year,
  month,
  onYearMonth,
  onSelectDay,
  refreshKey,
}: Props) {
  const [byDate, setByDate] = useState<Map<string, Drink[]>>(new Map())

  useEffect(() => {
    let cancelled = false
    getDatesWithDrinks(year, month).then((map) => {
      if (!cancelled) setByDate(map)
    })
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
  const cells: (number | null)[] = []
  for (let i = 0; i < firstWeekday; i++) cells.push(null)
  for (let d = 1; d <= totalDays; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <div className="page calendar-page">
      <div className="calendar-card">
        <div className="month-nav">
          <button type="button" className="nav-arrow" onClick={prev} aria-label="Previous month">
            ‹
          </button>
          <h1>{monthName(month)}</h1>
          <button type="button" className="nav-arrow" onClick={next} aria-label="Next month">
            ›
          </button>
        </div>

        <div className="weekday-row">
          {WEEKDAYS.map((w) => (
            <div key={w} className="weekday">
              {w}
            </div>
          ))}
        </div>

        <div className="days-grid">
          {cells.map((day, idx) => {
            if (day == null) {
              return <div key={`e-${idx}`} className="day-cell empty-slot" />
            }
            const date = toDateStr(year, month, day)
            const drinks = byDate.get(date) ?? []
            const has = drinks.length > 0
            return (
              <button
                key={date}
                type="button"
                className={`day-cell ${has ? 'has-drinks' : ''}`}
                onClick={() => onSelectDay(date)}
              >
                {has ? (
                  <DrinkIcon
                    stack={drinks}
                    alcohol={drinks[0]?.alcohol}
                    size="sm"
                  />
                ) : (
                  <DrinkIcon empty size="sm" />
                )}
                <span className="day-num">{day}</span>
              </button>
            )
          })}
        </div>

        <div className="calendar-year">{year}</div>
      </div>
    </div>
  )
}
