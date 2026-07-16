import { useCallback, useEffect, useState } from 'react'
import type { Drink, TabId } from './types'
import { BottomNav } from './components/BottomNav'
import { CalendarPage } from './pages/CalendarPage'
import { DayModal } from './pages/DayModal'
import { DrinkForm } from './pages/DrinkForm'
import { StatsPage } from './pages/StatsPage'
import { SettingsPage } from './pages/SettingsPage'
import { ensureSeeded } from './seed'

export default function App() {
  const [tab, setTab] = useState<TabId>('calendar')
  // Default calendar to last month present in real export
  const [year, setYear] = useState(2026)
  const [month, setMonth] = useState(3)
  const [refreshKey, setRefreshKey] = useState(0)
  const [ready, setReady] = useState(false)
  const [seedInfo, setSeedInfo] = useState<string | null>(null)

  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [editingDrink, setEditingDrink] = useState<Drink | null | undefined>(
    undefined,
  )
  // undefined = form closed; null = new drink; Drink = edit

  const bump = useCallback(() => setRefreshKey((k) => k + 1), [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const status = await ensureSeeded()
      if (cancelled) return
      if (status.state === 'done') {
        setSeedInfo(`Импортировано ${status.count} записей из экспорта`)
        // Jump calendar to latest data month
        setYear(2026)
        setMonth(3)
      }
      setReady(true)
      bump()
    })()
    return () => {
      cancelled = true
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

  if (!ready) {
    return (
      <div className="app-shell">
        <div className="boot-screen">
          <div className="boot-card">Загрузка данных…</div>
        </div>
      </div>
    )
  }

  return (
    <div className="app-shell">
      {seedInfo && (
        <div className="seed-toast" role="status">
          <span>{seedInfo}</span>
          <button type="button" onClick={() => setSeedInfo(null)} aria-label="Закрыть">
            ×
          </button>
        </div>
      )}
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
