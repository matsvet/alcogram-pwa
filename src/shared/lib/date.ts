const MONTHS_EN = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

const MONTHS_RU = [
  'Январь',
  'Февраль',
  'Март',
  'Апрель',
  'Май',
  'Июнь',
  'Июль',
  'Август',
  'Сентябрь',
  'Октябрь',
  'Ноябрь',
  'Декабрь',
]

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

export { WEEKDAYS }

export function monthName(month: number, locale: 'en' | 'ru' = 'en'): string {
  const list = locale === 'ru' ? MONTHS_RU : MONTHS_EN
  return list[month - 1] ?? ''
}

/** Day of week Mon=0 .. Sun=6 for a YYYY-MM-DD */
export function weekdayMon0(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number)
  const js = new Date(y, m - 1, d).getDay() // Sun=0
  return js === 0 ? 6 : js - 1
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

export function toDateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export function formatDayTitle(dateStr: string): string {
  const [, m, d] = dateStr.split('-').map(Number)
  return `${d} ${MONTHS_EN[m - 1]}`
}

export function formatDayShort(dateStr: string): string {
  const [, m, d] = dateStr.split('-').map(Number)
  return `${d} ${MONTHS_EN[m - 1]}`
}

export function todayStr(): string {
  const n = new Date()
  return toDateStr(n.getFullYear(), n.getMonth() + 1, n.getDate())
}
