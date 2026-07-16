import { useCallback, useEffect, useState } from 'react'
import type { Drink, TabId } from './types'
import { BottomNav } from './components/BottomNav'
import { CalendarPage } from './pages/CalendarPage'
import { DayModal } from './pages/DayModal'
import { DrinkForm } from './pages/DrinkForm'
import { StatsPage } from './pages/StatsPage'
import { SettingsPage } from './pages/SettingsPage'
import { onLocalDataChange } from './sync/bus'
import { fullSync, scheduleSync } from './sync/sync'
import { isCloudConfigured } from './lib/supabase'

export default function App() {
  const [tab, setTab] = useState<TabId>('calendar')
  const [year, setYear] = useState(2026)
  const [month, setMonth] = useState(3)
  const [refreshKey, setRefreshKey] = useState(0)

  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [editingDrink, setEditingDrink] = useState<Drink | null | undefined>(
    undefined,
  )

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
    <div className="app-shell">
      <main className="app-main">
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
          <StatsPage year={year} month={month} refreshKey={refreshKey} />
        )}
        {tab === 'settings' && (
          <SettingsPage refreshKey={refreshKey} onDataChange={bump} />
        )}
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
