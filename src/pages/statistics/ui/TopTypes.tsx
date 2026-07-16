import { useState } from 'react'
import { alcoholName, useI18n } from '@/shared/lib/i18n'
import type { PeriodStats } from '../model/statistics'
import styles from './TopTypes.module.css'

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
    <section className={styles.root}>
      <div className={styles.header}>
        <h2 className={styles.title}>{t('topTypes')}</h2>
        <div className={styles.metricTabs}>
          {(['count', 'volume'] as TopTypesMetric[]).map((nextMetric) => (
            <button
              key={nextMetric}
              type="button"
              className={`${styles.metricTab} ${metric === nextMetric ? styles.isActive : ''}`}
              onClick={() => setMetric(nextMetric)}
            >
              {nextMetric === 'count' ? t('quantity') : t('liters')}
            </button>
          ))}
        </div>
      </div>
      <div className={styles.list}>
        {topTypes.map((item) => {
          const value = metric === 'count' ? item.count : item.volumeMl
          return (
            <div key={item.alcohol} className={styles.row}>
              <div className={styles.label}>
                <span>{alcoholName(item.alcohol, locale)}</span>
                <span className={styles.muted}>
                  {metric === 'count'
                    ? `${item.count}×`
                    : `${litersFormatter.format(item.volumeMl / 1000)} ${locale === 'ru' ? 'л' : 'l'}`}
                </span>
              </div>
              <div className={styles.barTrack}>
                <div className={styles.barFill} style={{ width: `${(value / maxValue) * 100}%` }} />
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
