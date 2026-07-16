import type { Drink } from '../types'
import { ethanolMl } from './units'

export interface PeriodStats {
  totalEthanolMl: number
  totalEthanolKnown: boolean
  totalMoney: number
  currencies: Record<string, number>
  drinkingDays: number
  totalDrinks: number
  topTypes: { alcohol: string; count: number; ethanolMl: number }[]
}

export function computeStats(drinks: Drink[]): PeriodStats {
  let totalEthanolMl = 0
  let hasAnyEthanol = false
  let missingAbv = false
  const currencies: Record<string, number> = {}
  const days = new Set<string>()
  const byType = new Map<string, { count: number; ethanolMl: number }>()

  for (const d of drinks) {
    days.add(d.date)
    const eth = ethanolMl(d.amountMl, d.abv)
    if (eth != null) {
      totalEthanolMl += eth
      hasAnyEthanol = true
    } else if (d.abv == null) {
      missingAbv = true
    }

    if (d.price != null) {
      const cur = d.currency || '₽'
      currencies[cur] = (currencies[cur] ?? 0) + d.price
    }

    const t = byType.get(d.alcohol) ?? { count: 0, ethanolMl: 0 }
    t.count++
    if (eth != null) t.ethanolMl += eth
    byType.set(d.alcohol, t)
  }

  const topTypes = [...byType.entries()]
    .map(([alcohol, v]) => ({ alcohol, ...v }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)

  const totalMoney = Object.values(currencies).reduce((a, b) => a + b, 0)

  return {
    totalEthanolMl,
    totalEthanolKnown: hasAnyEthanol && !missingAbv ? true : hasAnyEthanol,
    totalMoney,
    currencies,
    drinkingDays: days.size,
    totalDrinks: drinks.length,
    topTypes,
  }
}

export function periodBounds(
  period: 'month' | 'year' | 'all',
  year: number,
  month: number,
): { from: string; to: string } | null {
  if (period === 'all') return null
  if (period === 'year') {
    return { from: `${year}-01-01`, to: `${year}-12-31` }
  }
  const mm = String(month).padStart(2, '0')
  const last = new Date(year, month, 0).getDate()
  return {
    from: `${year}-${mm}-01`,
    to: `${year}-${mm}-${String(last).padStart(2, '0')}`,
  }
}
