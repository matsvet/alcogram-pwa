import { useState } from 'react'
import { alcoholName, useI18n } from '@/shared/lib/i18n'
import type { PeriodStats } from '../model/statistics'

type TopTypesMetric = 'count' | 'volume'

interface Props {
  topTypes: PeriodStats['topTypes']
}

export function TopTypes({ topTypes: sourceTopTypes }: Props) {
  const { locale, t } = useI18n()
  const [metric, setMetric] = useState<TopTypesMetric>('count')
  const topTypes = [...sourceTopTypes].sort((a, b) =>
    metric === 'count' ? b.count - a.count : b.volumeMl - a.volumeMl,
  )
  const maxValue = Math.max(
    1,
    ...topTypes.map((item) => (metric === 'count' ? item.count : item.volumeMl)),
  )
  const litersFormatter = new Intl.NumberFormat(locale, {
    maximumFractionDigits: 3,
  })

  return (
    <section className="flex flex-1 flex-col min-h-0">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="m-0 text-[1rem] text-text">{t('topTypes')}</h2>
        <div className="flex rounded-lg bg-[#eef1f8] p-0.5">
          {(['count', 'volume'] as TopTypesMetric[]).map((nextMetric) => (
            <button
              key={nextMetric}
              type="button"
              className={`rounded-md px-2 py-1 text-[0.75rem] text-text-muted ${metric === nextMetric ? 'bg-white font-semibold text-primary shadow-[0_1px_4px_rgba(0,0,0,0.06)]' : ''}`}
              onClick={() => setMetric(nextMetric)}
            >
              {nextMetric === 'count' ? t('quantity') : t('liters')}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto min-h-0">
        {topTypes.map((item) => {
          const value = metric === 'count' ? item.count : item.volumeMl
          return (
            <div key={item.alcohol} className="flex flex-col gap-1">
              <div className="flex justify-between text-[0.9rem]">
                <span>{alcoholName(item.alcohol, locale)}</span>
                <span className="text-text-muted">
                  {metric === 'count'
                    ? `${item.count}×`
                    : `${litersFormatter.format(item.volumeMl / 1000)} ${locale === 'ru' ? 'л' : 'l'}`}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded bg-[#eef1f8]">
                <div
                  className="h-full min-w-1 rounded bg-primary transition-[width] duration-300 ease-out"
                  style={{ width: `${(value / maxValue) * 100}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
