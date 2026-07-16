import { useI18n } from '@/shared/lib/i18n'
import type { TabId } from '../model/navigation'
import styles from './BottomNav.module.css'
import { CalendarIcon } from './CalendarIcon'
import { SettingsIcon } from './SettingsIcon'
import { StatsIcon } from './StatsIcon'

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
        <StatsIcon />
        <span>{t('statistics')}</span>
      </button>
      <button
        type="button"
        className={`${styles.item} ${tab === 'calendar' ? styles.isActive : ''}`}
        onClick={() => onChange('calendar')}
      >
        <CalendarIcon />
        <span>{t('calendar')}</span>
      </button>
      <button
        type="button"
        className={`${styles.item} ${tab === 'settings' ? styles.isActive : ''}`}
        onClick={() => onChange('settings')}
      >
        <SettingsIcon />
        <span>{t('settings')}</span>
      </button>
    </nav>
  )
}
