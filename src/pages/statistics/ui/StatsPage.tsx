import { useEffect, useState } from 'react'
import { getAllDrinks, getDrinksInRange } from '@/shared/db/diary'
import { useI18n } from '@/shared/lib/i18n'
import { PageCard } from '@/shared/ui'
import { computeStats, type Period, type PeriodStats, periodBounds } from '../model/statistics'
import styles from './StatsPage.module.css'
import { StatsPeriodControls } from './StatsPeriodControls'
import { StatsSummary } from './StatsSummary'
import { TopTypes } from './TopTypes'

interface Props {
  year: number
  month: number
  onYearMonth: (year: number, month: number) => void
  refreshKey: number
}

export function StatsPage({ year, month, onYearMonth, refreshKey }: Props) {
  const { t } = useI18n()
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

  return (
    <div className={styles.root}>
      <PageCard>
        <h1 className={styles.title}>{t('statistics')}</h1>
        <StatsPeriodControls
          period={period}
          year={year}
          month={month}
          onPeriodChange={setPeriod}
          onYearMonth={onYearMonth}
        />

        {!stats || stats.totalDrinks === 0 ? (
          <p className={styles.emptyState}>{t('noPeriodData')}</p>
        ) : (
          <>
            <StatsSummary stats={stats} period={period} year={year} month={month} />
            <TopTypes topTypes={stats.topTypes} />
          </>
        )}
      </PageCard>
    </div>
  )
}
