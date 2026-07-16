import { useEffect, useState } from 'react'
import { getAllDrinks, getDrinksInRange } from '@/shared/db/diary'
import { monthName } from '@/shared/lib/date'
import { alcoholName, useI18n } from '@/shared/lib/i18n'
import { computeStats, type PeriodStats, periodBounds } from '../model/statistics'

type Period = 'month' | 'year' | 'all'

interface Props {
  year: number
  month: number
  refreshKey: number
}

export function StatsPage({ year, month, refreshKey }: Props) {
  const { locale, t } = useI18n()
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
      ? `${monthName(month, locale)} ${year}`
      : period === 'year'
        ? String(year)
        : t('allTime')

  const maxCount = Math.max(1, ...(stats?.topTypes.map((t) => t.count) ?? [1]))

  return (
    <div className="min-h-full">
      <div className="min-h-[calc(100vh-100px)] rounded-card bg-card px-3 pt-4 pb-5 shadow-card">
        <h1 className="mb-4 text-center text-[1.35rem] text-primary">{t('statistics')}</h1>

        <div className="mb-2 flex rounded-[10px] bg-[#eef1f8] p-0.75">
          {(['month', 'year', 'all'] as Period[]).map((p) => (
            <button
              key={p}
              type="button"
              className={`flex-1 rounded-lg p-2 text-[0.9rem] text-text-muted ${period === p ? 'bg-white font-semibold text-primary shadow-[0_1px_4px_rgba(0,0,0,0.06)]' : ''}`}
              onClick={() => setPeriod(p)}
            >
              {p === 'month' ? t('month') : p === 'year' ? t('year') : t('all')}
            </button>
          ))}
        </div>
        <p className="mb-4 text-center text-[0.9rem] text-text-muted">{label}</p>

        {!stats || stats.totalDrinks === 0 ? (
          <p className="text-center text-text-muted">{t('noPeriodData')}</p>
        ) : (
          <>
            <div className="mb-5 grid grid-cols-2 gap-2.5">
              <div className="rounded-xl bg-[#f5f7fc] px-3 py-3.5 text-center">
                <div className="break-words text-[1.15rem] font-bold text-text">
                  {stats.totalEthanolMl > 0
                    ? `${(stats.totalEthanolMl / 1000).toFixed(2)} ${locale === 'ru' ? 'л' : 'l'}`
                    : '—'}
                </div>
                <div className="mt-1 text-[0.75rem] text-text-muted">{t('ethanol')}</div>
                {!stats.totalEthanolKnown && stats.totalEthanolMl > 0 && (
                  <div className="mt-0.5 text-[0.65rem] text-text-muted">{t('missingAbv')}</div>
                )}
              </div>
              <div className="rounded-xl bg-[#f5f7fc] px-3 py-3.5 text-center">
                <div className="break-words text-[1.15rem] font-bold text-text">
                  {Object.keys(stats.currencies).length === 0
                    ? '—'
                    : Object.entries(stats.currencies)
                        .map(([c, v]) => `${Math.round(v)} ${c}`)
                        .join(', ')}
                </div>
                <div className="mt-1 text-[0.75rem] text-text-muted">{t('spent')}</div>
              </div>
              <div className="rounded-xl bg-[#f5f7fc] px-3 py-3.5 text-center">
                <div className="break-words text-[1.15rem] font-bold text-text">
                  {stats.drinkingDays}
                </div>
                <div className="mt-1 text-[0.75rem] text-text-muted">{t('drinkingDays')}</div>
              </div>
              <div className="rounded-xl bg-[#f5f7fc] px-3 py-3.5 text-center">
                <div className="break-words text-[1.15rem] font-bold text-text">
                  {stats.totalDrinks}
                </div>
                <div className="mt-1 text-[0.75rem] text-text-muted">{t('drinks')}</div>
              </div>
            </div>

            <h2 className="mb-3 text-[1rem] text-text">{t('topTypes')}</h2>
            <div className="flex flex-col gap-2.5">
              {stats.topTypes.map((t) => (
                <div key={t.alcohol} className="flex flex-col gap-1">
                  <div className="flex justify-between text-[0.9rem]">
                    <span>{alcoholName(t.alcohol, locale)}</span>
                    <span className="text-text-muted">{t.count}×</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded bg-[#eef1f8]">
                    <div
                      className="h-full min-w-1 rounded bg-primary transition-[width] duration-300"
                      style={{ width: `${(t.count / maxCount) * 100}%` }}
                    />
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
