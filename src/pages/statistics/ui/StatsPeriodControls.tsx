import { monthName } from '@/shared/lib/date'
import { useI18n } from '@/shared/lib/i18n'
import type { Period } from '../model/statistics'

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
      <div className="mb-2 flex rounded-[10px] bg-[#eef1f8] p-0.75">
        {(['month', 'year', 'all'] as Period[]).map((nextPeriod) => (
          <button
            key={nextPeriod}
            type="button"
            className={`flex-1 rounded-lg p-2 text-[0.9rem] text-text-muted ${period === nextPeriod ? 'bg-white font-semibold text-primary shadow-[0_1px_4px_rgba(0,0,0,0.06)]' : ''}`}
            onClick={() => onPeriodChange(nextPeriod)}
          >
            {nextPeriod === 'month' ? t('month') : nextPeriod === 'year' ? t('year') : t('all')}
          </button>
        ))}
      </div>

      {period === 'all' ? (
        <p className="mb-4 text-center text-[0.9rem] text-text-muted">{label}</p>
      ) : (
        <div className="my-5 flex items-center justify-center gap-4">
          <button
            type="button"
            className="flex size-10 items-center justify-center rounded-full text-[1.6rem] text-primary active:bg-primary/12"
            onClick={previousPeriod}
            aria-label={period === 'month' ? t('previousMonth') : t('previousYear')}
          >
            ‹
          </button>
          {period === 'month' ? (
            <input
              type="month"
              className="w-[195px] min-h-10 rounded-lg border border-border bg-card px-2.5 py-1.5 text-center font-semibold text-primary"
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
              className="w-[195px] min-h-10 rounded-lg border border-border bg-card px-2.5 py-1.5 text-center font-semibold text-primary"
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
            className="flex size-10 items-center justify-center rounded-full text-[1.6rem] text-primary active:bg-primary/12"
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
