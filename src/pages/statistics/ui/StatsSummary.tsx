import { daysInMonth } from '@/shared/lib/date'
import { useI18n } from '@/shared/lib/i18n'
import type { Period, PeriodStats } from '../model/statistics'

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
                .map(([currency, value]) => `${Math.round(value)} ${currency}`)
                .join(', ')}
        </div>
        <div className="mt-1 text-[0.75rem] text-text-muted">{t('spent')}</div>
      </div>
      <div className="rounded-xl bg-[#f5f7fc] px-3 py-3.5 text-center">
        <div className="flex items-baseline justify-center gap-1.5 break-words text-[1.15rem] font-bold text-text">
          <span>{stats.drinkingDays}</span>
          {drinkingDayPercentage != null && (
            <span className="whitespace-nowrap text-[0.75em] font-semibold text-primary">
              {formattedDrinkingDayPercentage}%
            </span>
          )}
        </div>
        <div className="mt-1 text-[0.75rem] text-text-muted">{t('drinkingDays')}</div>
      </div>
      <div className="rounded-xl bg-[#f5f7fc] px-3 py-3.5 text-center">
        <div className="break-words text-[1.15rem] font-bold text-text">{stats.totalDrinks}</div>
        <div className="mt-1 text-[0.75rem] text-text-muted">{t('drinks')}</div>
      </div>
      <div className="rounded-xl bg-[#f5f7fc] px-3 py-3.5 text-center">
        <div className="break-words text-[1.15rem] font-bold text-text">
          {stats.longestDrinkingStreak}
        </div>
        <div className="mt-1 text-[0.75rem] text-text-muted">{t('longestDrinkingStreak')}</div>
      </div>
      <div className="rounded-xl bg-[#f5f7fc] px-3 py-3.5 text-center">
        <div className="break-words text-[1.15rem] font-bold text-text">
          {stats.longestSoberStreak}
        </div>
        <div className="mt-1 text-[0.75rem] text-text-muted">{t('longestSoberStreak')}</div>
      </div>
    </div>
  )
}
