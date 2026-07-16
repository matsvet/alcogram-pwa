import { useEffect, useState } from 'react'
import { getAllDrinks, getDrinksInRange } from '@/shared/db/diary'
import { daysInMonth, monthName } from '@/shared/lib/date'
import { alcoholName, useI18n } from '@/shared/lib/i18n'
import { PageCard } from '@/shared/ui'
import { computeStats, type PeriodStats, periodBounds } from '../model/statistics'
import styles from './StatsPage.module.css'

type Period = 'month' | 'year' | 'all'
type TopTypesMetric = 'count' | 'volume'

interface Props {
  year: number
  month: number
  onYearMonth: (year: number, month: number) => void
  refreshKey: number
}

export function StatsPage({ year, month, onYearMonth, refreshKey }: Props) {
  const { locale, t } = useI18n()
  const [period, setPeriod] = useState<Period>('month')
  const [topTypesMetric, setTopTypesMetric] = useState<TopTypesMetric>('count')
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

  const topTypes = [...(stats?.topTypes ?? [])].sort((a, b) =>
    topTypesMetric === 'count' ? b.count - a.count : b.volumeMl - a.volumeMl,
  )
  const maxTopValue = Math.max(
    1,
    ...topTypes.map((t) => (topTypesMetric === 'count' ? t.count : t.volumeMl)),
  )
  const periodDays =
    period === 'month'
      ? daysInMonth(year, month)
      : period === 'year'
        ? daysInMonth(year, 2) === 29
          ? 366
          : 365
        : null
  const drinkingDayPercentage =
    periodDays == null ? null : ((stats?.drinkingDays ?? 0) / periodDays) * 100
  const formattedDrinkingDayPercentage = new Intl.NumberFormat(locale, {
    maximumFractionDigits: 1,
  }).format(drinkingDayPercentage ?? 0)
  const litersFormatter = new Intl.NumberFormat(locale, {
    maximumFractionDigits: 3,
  })

  const previousPeriod = () => {
    if (period === 'year') onYearMonth(year - 1, month)
    else if (month === 1) onYearMonth(year - 1, 12)
    else onYearMonth(year, month - 1)
  }

  const nextPeriod = () => {
    if (period === 'year') onYearMonth(year + 1, month)
    else if (month === 12) onYearMonth(year + 1, 1)
    else onYearMonth(year, month + 1)
  }

  return (
    <div className={styles.root}>
      <PageCard>
        <h1 className={styles.title}>{t('statistics')}</h1>

        <div className={styles.tabs}>
          {(['month', 'year', 'all'] as Period[]).map((p) => (
            <button
              key={p}
              type="button"
              className={`${styles.tab} ${period === p ? styles.isActive : ''}`}
              onClick={() => setPeriod(p)}
            >
              {p === 'month' ? t('month') : p === 'year' ? t('year') : t('all')}
            </button>
          ))}
        </div>
        {period === 'all' ? (
          <p className={styles.periodLabel}>{label}</p>
        ) : (
          <div className={styles.periodNavigation}>
            <button
              type="button"
              className={styles.periodButton}
              onClick={previousPeriod}
              aria-label={period === 'month' ? t('previousMonth') : t('previousYear')}
            >
              ‹
            </button>
            {period === 'month' ? (
              <input
                type="month"
                className={styles.periodPicker}
                value={`${year}-${String(month).padStart(2, '0')}`}
                onChange={(event) => {
                  const [nextYear, nextMonth] = event.target.value.split('-').map(Number)
                  onYearMonth(nextYear, nextMonth)
                }}
                aria-label={t('chooseMonth')}
              />
            ) : (
              <input
                type="number"
                className={styles.periodPicker}
                value={year}
                min="1"
                onChange={(event) => {
                  const nextYear = Number(event.target.value)
                  if (Number.isInteger(nextYear) && nextYear > 0) onYearMonth(nextYear, month)
                }}
                aria-label={t('chooseYear')}
              />
            )}
            <button
              type="button"
              className={styles.periodButton}
              onClick={nextPeriod}
              aria-label={period === 'month' ? t('nextMonth') : t('nextYear')}
            >
              ›
            </button>
          </div>
        )}

        {!stats || stats.totalDrinks === 0 ? (
          <p className={styles.emptyState}>{t('noPeriodData')}</p>
        ) : (
          <>
            <div className={styles.grid}>
              <div className={styles.stat}>
                <div className={styles.statValue}>
                  {stats.totalEthanolMl > 0
                    ? `${(stats.totalEthanolMl / 1000).toFixed(2)} ${locale === 'ru' ? 'л' : 'l'}`
                    : '—'}
                </div>
                <div className={styles.statName}>{t('ethanol')}</div>
                {!stats.totalEthanolKnown && stats.totalEthanolMl > 0 && (
                  <div className={styles.statHint}>{t('missingAbv')}</div>
                )}
              </div>
              <div className={styles.stat}>
                <div className={styles.statValue}>
                  {Object.keys(stats.currencies).length === 0
                    ? '—'
                    : Object.entries(stats.currencies)
                        .map(([c, v]) => `${Math.round(v)} ${c}`)
                        .join(', ')}
                </div>
                <div className={styles.statName}>{t('spent')}</div>
              </div>
              <div className={styles.stat}>
                <div className={`${styles.statValue} ${styles.drinkingDaysValue}`}>
                  <span>{stats.drinkingDays}</span>
                  {drinkingDayPercentage != null && (
                    <span className={styles.drinkingDaysPercentage}>
                      {formattedDrinkingDayPercentage}%
                    </span>
                  )}
                </div>
                <div className={styles.statName}>{t('drinkingDays')}</div>
              </div>
              <div className={styles.stat}>
                <div className={styles.statValue}>{stats.totalDrinks}</div>
                <div className={styles.statName}>{t('drinks')}</div>
              </div>
            </div>

            <div className={styles.topHeader}>
              <h2 className={styles.sectionTitle}>{t('topTypes')}</h2>
              <div className={styles.topMetricTabs}>
                {(['count', 'volume'] as TopTypesMetric[]).map((metric) => (
                  <button
                    key={metric}
                    type="button"
                    className={`${styles.topMetricTab} ${topTypesMetric === metric ? styles.isActive : ''}`}
                    onClick={() => setTopTypesMetric(metric)}
                  >
                    {metric === 'count' ? t('quantity') : t('liters')}
                  </button>
                ))}
              </div>
            </div>
            <div className={styles.topList}>
              {topTypes.map((t) => {
                const value = topTypesMetric === 'count' ? t.count : t.volumeMl
                return (
                  <div key={t.alcohol} className={styles.topRow}>
                    <div className={styles.topLabel}>
                      <span>{alcoholName(t.alcohol, locale)}</span>
                      <span className={styles.muted}>
                        {topTypesMetric === 'count'
                          ? `${t.count}×`
                          : `${litersFormatter.format(t.volumeMl / 1000)} ${locale === 'ru' ? 'л' : 'l'}`}
                      </span>
                    </div>
                    <div className={styles.barTrack}>
                      <div
                        className={styles.barFill}
                        style={{ width: `${(value / maxTopValue) * 100}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </PageCard>
    </div>
  )
}
