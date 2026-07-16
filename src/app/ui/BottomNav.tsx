import { CalendarDays, ChartNoAxesColumn, Settings } from 'lucide-react'
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
        className={`flex flex-1 flex-col items-center gap-0.5 p-1 text-[0.7rem] ${tab === 'stats' ? 'font-semibold text-white [&>svg]:opacity-100' : 'text-nav-inactive [&>svg]:opacity-85'}`}
        onClick={() => onChange('stats')}
      >
        <ChartNoAxesColumn size={22} strokeWidth={2} aria-hidden />
        <span>{t('statistics')}</span>
      </button>
      <button
        type="button"
        className={`flex flex-1 flex-col items-center gap-0.5 p-1 text-[0.7rem] ${tab === 'calendar' ? 'font-semibold text-white [&>svg]:opacity-100' : 'text-nav-inactive [&>svg]:opacity-85'}`}
        onClick={() => onChange('calendar')}
      >
        <CalendarDays size={22} strokeWidth={2} aria-hidden />
        <span>{t('calendar')}</span>
      </button>
      <button
        type="button"
        className={`flex flex-1 flex-col items-center gap-0.5 p-1 text-[0.7rem] ${tab === 'settings' ? 'font-semibold text-white [&>svg]:opacity-100' : 'text-nav-inactive [&>svg]:opacity-85'}`}
        onClick={() => onChange('settings')}
      >
        <Settings size={22} strokeWidth={2} aria-hidden />
        <span>{t('settings')}</span>
      </button>
    </nav>
  )
}
