import { useI18n } from '@/shared/lib/i18n'
import type { TabId } from '../model/navigation'

interface Props {
  tab: TabId
  onChange: (t: TabId) => void
}

export function BottomNav({ tab, onChange }: Props) {
  const { t } = useI18n()
  return (
    <nav
      className="fixed bottom-0 left-1/2 z-50 flex w-full max-w-[480px] -translate-x-1/2 bg-primary pt-2 pr-0 pb-[calc(8px+env(safe-area-inset-bottom,0px))] pl-0"
      aria-label={t('mainNavigation')}
    >
      <button
        type="button"
        className={`flex flex-1 flex-col items-center gap-0.5 p-1 text-[0.7rem] text-nav-inactive ${tab === 'stats' ? 'font-semibold text-white' : ''}`}
        onClick={() => onChange('stats')}
      >
        <StatsIcon />
        <span>{t('statistics')}</span>
      </button>
      <button
        type="button"
        className={`flex flex-1 flex-col items-center gap-0.5 p-1 text-[0.7rem] text-nav-inactive ${tab === 'calendar' ? 'font-semibold text-white' : ''}`}
        onClick={() => onChange('calendar')}
      >
        <CalendarIcon />
        <span>{t('calendar')}</span>
      </button>
      <button
        type="button"
        className={`flex flex-1 flex-col items-center gap-0.5 p-1 text-[0.7rem] text-nav-inactive ${tab === 'settings' ? 'font-semibold text-white' : ''}`}
        onClick={() => onChange('settings')}
      >
        <SettingsIcon />
        <span>{t('settings')}</span>
      </button>
    </nav>
  )
}

function StatsIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <title>Статистика</title>
      <path d="M4 19V9M12 19V5M20 19v-7" strokeLinecap="round" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <title>Календарь</title>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" strokeLinecap="round" />
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <title>Настройки</title>
      <circle cx="12" cy="12" r="3" />
      <path
        d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
        strokeLinecap="round"
      />
    </svg>
  )
}
