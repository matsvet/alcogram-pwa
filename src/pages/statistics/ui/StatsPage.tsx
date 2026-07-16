import { useEffect, useState } from 'react'
import { getAllDrinks, getDrinksInRange } from '@/shared/db/diary'
import { monthName } from '@/shared/lib/date'
import { computeStats, type PeriodStats, periodBounds } from '../model/statistics'

type Period = 'month' | 'year' | 'all'

interface Props {
  year: number
  month: number
  refreshKey: number
}

export function StatsPage({ year, month, refreshKey }: Props) {
  const [period, setPeriod] = useState<Period>('month')
  const [stats, setStats] = useState<PeriodStats | null>(null)

  // biome-ignore lint/correctness/useExhaustiveDependencies: refreshKey intentionally reloads data after a mutation.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const bounds = periodBounds(period, year, month)
      const drinks = bounds ? await getDrinksInRange(bounds.from, bounds.to) : await getAllDrinks()
      if (!cancelled) setStats(computeStats(drinks))
    })()
    return () => {
      cancelled = true
    }
  }, [period, year, month, refreshKey])

  const label =
    period === 'month'
      ? `${monthName(month)} ${year}`
      : period === 'year'
        ? String(year)
        : 'Всё время'

  const maxCount = Math.max(1, ...(stats?.topTypes.map((t) => t.count) ?? [1]))

  return (
    <div className="page stats-page">
      <div className="stats-card">
        <h1>Statistics</h1>

        <div className="period-tabs">
          {(['month', 'year', 'all'] as Period[]).map((p) => (
            <button
              key={p}
              type="button"
              className={period === p ? 'active' : ''}
              onClick={() => setPeriod(p)}
            >
              {p === 'month' ? 'Месяц' : p === 'year' ? 'Год' : 'Всё'}
            </button>
          ))}
        </div>
        <p className="period-label">{label}</p>

        {!stats || stats.totalDrinks === 0 ? (
          <p className="muted center">Нет данных за период</p>
        ) : (
          <>
            <div className="stat-grid">
              <div className="stat-box">
                <div className="stat-value">
                  {stats.totalEthanolMl > 0 ? `${(stats.totalEthanolMl / 1000).toFixed(2)} l` : '—'}
                </div>
                <div className="stat-name">Этанол</div>
                {!stats.totalEthanolKnown && stats.totalEthanolMl > 0 && (
                  <div className="stat-hint">часть записей без ABV</div>
                )}
              </div>
              <div className="stat-box">
                <div className="stat-value">
                  {Object.keys(stats.currencies).length === 0
                    ? '—'
                    : Object.entries(stats.currencies)
                        .map(([c, v]) => `${Math.round(v)} ${c}`)
                        .join(', ')}
                </div>
                <div className="stat-name">Потрачено</div>
              </div>
              <div className="stat-box">
                <div className="stat-value">{stats.drinkingDays}</div>
                <div className="stat-name">Дней с выпивкой</div>
              </div>
              <div className="stat-box">
                <div className="stat-value">{stats.totalDrinks}</div>
                <div className="stat-name">Напитков</div>
              </div>
            </div>

            <h2 className="section-title">Топ типов</h2>
            <div className="top-list">
              {stats.topTypes.map((t) => (
                <div key={t.alcohol} className="top-row">
                  <div className="top-label">
                    <span>{t.alcohol}</span>
                    <span className="muted">{t.count}×</span>
                  </div>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${(t.count / maxCount) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
