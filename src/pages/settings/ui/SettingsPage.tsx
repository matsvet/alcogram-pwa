import { useEffect, useRef, useState } from 'react'
import { countDrinks, getAllDrinks } from '@/shared/db/diary'
import {
  drinksToCsv,
  importDrinks,
  parseImportFile,
} from '../lib/importExport'
import type { ImportMode, ImportResult } from '../model/import'
import { CloudAuth } from './CloudAuth'

const APP_VERSION = '1.1.0'

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

  return (
    <div className="page settings-page">
      <div className="settings-card">
        <h1>Settings</h1>

        <CloudAuth onSynced={onDataChange} />

        <section className="settings-block">
          <h2>Данные на устройстве</h2>
          <p>
            Записей в базе: <strong>{count}</strong>
          </p>
          <p className="muted">
            Версия {APP_VERSION} · IndexedDB + опционально Supabase
          </p>
        </section>

        <section className="settings-block">
          <h2>Импорт файла</h2>
          <p className="muted">
            CSV или JSON. После импорта при входе в облако данные уйдут на
            сервер.
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
          <h2>Экспорт</h2>
          <div className="btn-row">
            <button type="button" className="btn-secondary" onClick={() => void exportCsv()}>
              Экспорт CSV
            </button>
          </div>
        </section>

        <section className="settings-block">
          <h2>Установка PWA</h2>
          <p className="muted">
            iPhone: Safari → Поделиться → На экран «Домой». Android: Chrome →
            Установить. Offline shell + облако при сети.
          </p>
        </section>
      </div>
    </div>
  )
}
