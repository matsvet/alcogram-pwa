/**
 * Active tracking window from Alcogram export:
 * if a day has no drinks inside this range, treat as sober (empty glass).
 * Outside: unknown — blank cell unless user marks sober manually.
 */
export const TRACKED_FROM = '2023-01-01'
export const TRACKED_TO = '2026-03-31'

export type DayVisual = 'blank' | 'sober' | 'drinks'

export function isInTrackedPeriod(date: string): boolean {
  return date >= TRACKED_FROM && date <= TRACKED_TO
}

/**
 * Resolve how a calendar day should look.
 * Drinks always win. Then manual sober or auto-sober in tracked period.
 */
export function resolveDayVisual(
  date: string,
  hasDrinks: boolean,
  manualSober: boolean,
): DayVisual {
  if (hasDrinks) return 'drinks'
  if (manualSober || isInTrackedPeriod(date)) return 'sober'
  return 'blank'
}
