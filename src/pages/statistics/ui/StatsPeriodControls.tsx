import { monthName } from '@/shared/lib/date'
import { useI18n } from '@/shared/lib/i18n'
import type { Period } from '../model/statistics'
import styles from './StatsPeriodControls.module.css'

interface Props {
  period: Period
  year: number
  month: number
  onPeriodChange: (period: Period) => void
  onYearMonth: (year: number, month: number) => void
}

export function StatsPeriodControls({ period, year, month, onPeriodChange, onYearMonth }: Props) {
  const { locale, t } = useI18n()
  const label =
    period === 'month'
      ? `${monthName(month, locale)} ${year}`
      : period === 'year'
        ? String(year)
        : t('allTime')

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
    <>
      <div className={styles.tabs}>
        {(['month', 'year', 'all'] as Period[]).map((nextPeriod) => (
          <button
            key={nextPeriod}
            type="button"
            className={`${styles.tab} ${period === nextPeriod ? styles.isActive : ''}`}
            onClick={() => onPeriodChange(nextPeriod)}
          >
            {nextPeriod === 'month' ? t('month') : nextPeriod === 'year' ? t('year') : t('all')}
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
    </>
  )
}
