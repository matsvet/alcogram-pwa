import { CalendarDays, ChartNoAxesColumn, Settings } from 'lucide-react'
import { useI18n } from '@/shared/lib/i18n'
import type { TabId } from '../model/navigation'
import styles from './BottomNav.module.css'

interface Props {
  tab: TabId
  onChange: (t: TabId) => void
}

export function BottomNav({ tab, onChange }: Props) {
  const { t } = useI18n()
  return (
    <nav className={styles.root} aria-label={t('mainNavigation')}>
      <button
        type="button"
        className={`${styles.item} ${tab === 'stats' ? styles.isActive : ''}`}
        onClick={() => onChange('stats')}
      >
        <ChartNoAxesColumn size={22} strokeWidth={2} aria-hidden />
        <span>{t('statistics')}</span>
      </button>
      <button
        type="button"
        className={`${styles.item} ${tab === 'calendar' ? styles.isActive : ''}`}
        onClick={() => onChange('calendar')}
      >
        <CalendarDays size={22} strokeWidth={2} aria-hidden />
        <span>{t('calendar')}</span>
      </button>
      <button
        type="button"
        className={`${styles.item} ${tab === 'settings' ? styles.isActive : ''}`}
        onClick={() => onChange('settings')}
      >
        <Settings size={22} strokeWidth={2} aria-hidden />
        <span>{t('settings')}</span>
      </button>
    </nav>
  )
}
