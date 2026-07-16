import { daysInMonth } from '@/shared/lib/date'
import { useI18n } from '@/shared/lib/i18n'
import type { Period, PeriodStats } from '../model/statistics'
import styles from './StatsSummary.module.css'

interface Props {
  stats: PeriodStats
  period: Period
  year: number
  month: number
}

export function StatsSummary({ stats, period, year, month }: Props) {
  const { locale, t } = useI18n()
  const periodDays =
    period === 'month'
      ? daysInMonth(year, month)
      : period === 'year'
        ? daysInMonth(year, 2) === 29
          ? 366
          : 365
        : null
  const drinkingDayPercentage = periodDays == null ? null : (stats.drinkingDays / periodDays) * 100
  const formattedDrinkingDayPercentage = new Intl.NumberFormat(locale, {
    maximumFractionDigits: 1,
  }).format(drinkingDayPercentage ?? 0)

  return (
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
                .map(([currency, value]) => `${Math.round(value)} ${currency}`)
                .join(', ')}
        </div>
        <div className={styles.statName}>{t('spent')}</div>
      </div>
      <div className={styles.stat}>
        <div className={`${styles.statValue} ${styles.drinkingDaysValue}`}>
          <span>{stats.drinkingDays}</span>
          {drinkingDayPercentage != null && (
            <span className={styles.drinkingDaysPercentage}>{formattedDrinkingDayPercentage}%</span>
          )}
        </div>
        <div className={styles.statName}>{t('drinkingDays')}</div>
      </div>
      <div className={styles.stat}>
        <div className={styles.statValue}>{stats.totalDrinks}</div>
        <div className={styles.statName}>{t('drinks')}</div>
      </div>
    </div>
  )
}
