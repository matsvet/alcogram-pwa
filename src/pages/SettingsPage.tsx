import { useEffect, useRef, useState } from 'react'
import { clearAllDrinks, countDrinks, getAllDrinks } from '../db'
import {
  drinksToCsv,
  importDrinks,
  parseImportFile,
} from '../utils/csv'
import { forceReseed } from '../seed'
import type { ImportMode, ImportResult } from '../types'

const APP_VERSION = '1.0.0'

interface Props {
  refreshKey: number
  onDataChange: () => void
}

export function SettingsPage({ refreshKey, onDataChange }: Props) {
  const [count, setCount] = useState(0)
  const [mode, setMode] = useState<ImportMode>('merge')
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [seedMsg, setSeedMsg] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    countDrinks().then(setCount)
  }, [refreshKey])

  const onFile = async (file: File) => {
    setError(null)
    setResult(null)
    setBusy(true)
    try {
      const text = await file.text()
      const rows = parseImportFile(text, file.name)
      const res = await importDrinks(rows, mode)
      setResult(res)
      onDataChange()
      setCount(await countDrinks())
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const exportCsv = async () => {
    const drinks = await getAllDrinks()
    const csv = drinksToCsv(drinks)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `alcogram-export-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const clearAll = async () => {
    if (!confirm('Удалить ВСЕ записи с устройства? Это необратимо.')) return
    if (!confirm('Точно удалить? Сделайте экспорт, если нужен бэкап.')) return
    await clearAllDrinks()
    localStorage.removeItem('alcogram_seed_v1')
    setCount(0)
    setResult(null)
    setSeedMsg(null)
    onDataChange()
  }

  const reseed = async () => {
    if (
      !confirm(
        'Перезалить встроенный экспорт Alcogram (694 записи, 2023–2026)? Текущие данные будут заменены.',
      )
    ) {
      return
    }
    setBusy(true)
    setSeedMsg(null)
    setError(null)
    try {
      const status = await forceReseed()
      if (status.state === 'done') {
        setSeedMsg(`Загружено ${status.count} записей из seed`)
        setCount(await countDrinks())
        onDataChange()
      } else if (status.state === 'error') {
        setError(status.message)
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page settings-page">
      <div className="settings-card">
        <h1>Settings</h1>

        <section className="settings-block">
          <h2>Данные</h2>
          <p>
            Записей в базе: <strong>{count}</strong>
          </p>
          <p className="muted">
            Версия {APP_VERSION} · только на устройстве (IndexedDB)
          </p>
          <p className="muted">
            Seed: реальный экспорт 2023-01-01 … 2026-03-28 (694 напитка, пустые
            строки календаря отброшены).
          </p>
          <button
            type="button"
            className="btn-secondary"
            style={{ width: '100%', marginTop: 8 }}
            disabled={busy}
            onClick={() => void reseed()}
          >
            Перезалить seed-экспорт
          </button>
          {seedMsg && <div className="import-result">{seedMsg}</div>}
        </section>

        <section className="settings-block">
          <h2>Импорт файла</h2>
          <p className="muted">
            CSV или JSON. Несколько напитков в один день = разные{' '}
            <code>drink_index</code>. Готовый raw:{" "}
            <code>/seed/alcogram_all.csv</code>
          </p>
          <div className="mode-row">
            <label>
              <input
                type="radio"
                name="mode"
                checked={mode === 'merge'}
                onChange={() => setMode('merge')}
              />{' '}
              Merge (пропуск дублей)
            </label>
            <label>
              <input
                type="radio"
                name="mode"
                checked={mode === 'replace'}
                onChange={() => setMode('replace')}
              />{' '}
              Replace all
            </label>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.json,text/csv,application/json"
            className="file-input"
            disabled={busy}
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) void onFile(f)
            }}
          />
          {busy && <p className="muted">Импорт…</p>}
          {result && (
            <div className="import-result">
              Добавлено: {result.added}, пропущено: {result.skipped}, невалидных:{' '}
              {result.invalid} (из {result.total})
            </div>
          )}
          {error && <div className="import-error">{error}</div>}
        </section>

        <section className="settings-block">
          <h2>Экспорт / очистка</h2>
          <div className="btn-row">
            <button type="button" className="btn-secondary" onClick={() => void exportCsv()}>
              Экспорт CSV
            </button>
            <button type="button" className="btn-danger" onClick={() => void clearAll()}>
              Очистить всё
            </button>
          </div>
        </section>

        <section className="settings-block">
          <h2>Установка PWA</h2>
          <p className="muted">
            iPhone: Safari → Поделиться → На экран «Домой». Android: Chrome → меню → Установить
            приложение. Данные offline после первого захода.
          </p>
        </section>
      </div>
    </div>
  )
}
