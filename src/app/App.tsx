import { useCallback, useEffect, useState } from 'react'
import { fullSync, scheduleSync } from '@/features/cloud-sync'
import { CalendarPage, DayModal, DrinkForm } from '@/pages/calendar'
import { SettingsPage } from '@/pages/settings'
import { StatsPage } from '@/pages/statistics'
import type { Drink } from '@/shared/api/diary'
import { isCloudConfigured } from '@/shared/api/supabase'
import { onLocalDataChange } from '@/shared/lib/dataChanges'
import styles from './App.module.css'
import type { TabId } from './model/navigation'
import { BottomNav } from './ui/BottomNav'

export default function App() {
  const [tab, setTab] = useState<TabId>('calendar')
  const [year, setYear] = useState(() => new Date().getFullYear())
  const [month, setMonth] = useState(() => new Date().getMonth() + 1)
  const [refreshKey, setRefreshKey] = useState(0)

  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [editingDrink, setEditingDrink] = useState<Drink | null | undefined>(undefined)

  const bump = useCallback(() => setRefreshKey((k) => k + 1), [])

  // Wire local writes → debounced cloud sync
  useEffect(() => {
    return onLocalDataChange(() => scheduleSync())
  }, [])

  // Sync when app becomes visible / online
  useEffect(() => {
    if (!isCloudConfigured()) return
    const run = () => {
      void fullSync().then((r) => {
        if (r.ok) bump()
      })
    }
    const onVis = () => {
      if (document.visibilityState === 'visible') run()
    }
    window.addEventListener('online', run)
    document.addEventListener('visibilitychange', onVis)
    return () => {
      window.removeEventListener('online', run)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [bump])

  const openDay = (date: string) => {
    setSelectedDate(date)
    setEditingDrink(undefined)
  }

  const closeDay = () => {
    setSelectedDate(null)
    setEditingDrink(undefined)
  }

  const openDrink = (drink: Drink | null) => {
    setEditingDrink(drink)
  }

  const closeDrinkForm = () => {
    setEditingDrink(undefined)
  }

  const onDrinkSaved = () => {
    setEditingDrink(undefined)
    bump()
  }

  return (
    <div className={styles.shell}>
      <main
        className={`${styles.main} ${tab === 'calendar' ? styles.calendarMain : tab === 'stats' ? styles.statsMain : ''}`}
      >
        {tab === 'calendar' && (
          <CalendarPage
            year={year}
            month={month}
            onYearMonth={(y, m) => {
              setYear(y)
              setMonth(m)
            }}
            onSelectDay={openDay}
            refreshKey={refreshKey}
          />
        )}
        {tab === 'stats' && (
          <StatsPage
            year={year}
            month={month}
            onYearMonth={(y, m) => {
              setYear(y)
              setMonth(m)
            }}
            refreshKey={refreshKey}
          />
        )}
        {tab === 'settings' && <SettingsPage refreshKey={refreshKey} onDataChange={bump} />}
      </main>

      <BottomNav tab={tab} onChange={setTab} />

      {selectedDate && editingDrink === undefined && (
        <DayModal
          date={selectedDate}
          onClose={closeDay}
          onOpenDrink={openDrink}
          onChanged={bump}
          refreshKey={refreshKey}
        />
      )}

      {selectedDate && editingDrink !== undefined && (
        <DrinkForm
          date={selectedDate}
          drink={editingDrink}
          onClose={closeDrinkForm}
          onSaved={onDrinkSaved}
        />
      )}
    </div>
  )
}
