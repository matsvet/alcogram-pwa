import { useEffect, useRef, useState } from 'react'
import { countDrinks, getAllDrinks } from '@/shared/db/diary'
import { useI18n } from '@/shared/lib/i18n'
import { drinksToCsv, importDrinks, parseImportFile } from '../lib/importExport'
import type { ImportMode, ImportResult } from '../model/import'
import { CloudAuth } from './CloudAuth'

const APP_VERSION = '1.1.0'

interface Props {
  refreshKey: number
  onDataChange: () => void
}

export function SettingsPage({ refreshKey, onDataChange }: Props) {
  const { locale, setLocale, t } = useI18n()
  const [count, setCount] = useState(0)
  const [mode, setMode] = useState<ImportMode>('merge')
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // biome-ignore lint/correctness/useExhaustiveDependencies: refreshKey intentionally reloads data after a mutation.
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
    <div className="min-h-full">
      <div className="min-h-[calc(100vh-100px)] rounded-card bg-card px-3 pt-4 pb-5 shadow-card">
        <h1 className="mb-4 text-center text-[1.35rem] text-primary">{t('settings')}</h1>

        <section className="mb-6 border-b border-[#eef1f5] pb-4">
          <label>
            {t('language')}
            <select
              className="mt-0 w-full rounded-[10px] border-[1.5px] border-primary bg-white px-3.5 py-3 outline-none focus:shadow-[0_0_0_3px_rgba(107,127,232,0.2)]"
              value={locale}
              onChange={(event) => setLocale(event.target.value as 'en' | 'ru')}
            >
              <option value="en">{t('english')}</option>
              <option value="ru">{t('russian')}</option>
            </select>
          </label>
        </section>

        <CloudAuth onSynced={onDataChange} />

        <section className="mb-6 border-b border-[#eef1f5] pb-4">
          <h2>{t('deviceData')}</h2>
          <p>
            {t('recordsInDb')} <strong>{count}</strong>
          </p>
          <p className="mb-2 text-[0.9rem] text-text-muted">
            {t('version')} {APP_VERSION} · {t('optionalSupabase')}
          </p>
        </section>

        <section className="mb-6 border-b border-[#eef1f5] pb-4">
          <h2>{t('importFile')}</h2>
          <p className="mb-2 text-[0.9rem] text-text-muted">{t('importDescription')}</p>
          <div className="my-3 flex flex-col gap-2 text-[0.9rem]">
            <label>
              <input
                type="radio"
                name="mode"
                checked={mode === 'merge'}
                onChange={() => setMode('merge')}
              />{' '}
              {t('merge')}
            </label>
            <label>
              <input
                type="radio"
                name="mode"
                checked={mode === 'replace'}
                onChange={() => setMode('replace')}
              />{' '}
              {t('replace')}
            </label>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.json,text/csv,application/json"
            className="my-2 w-full text-[0.85rem]"
            disabled={busy}
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) void onFile(f)
            }}
          />
          {busy && <p className="text-text-muted">{t('importing')}</p>}
          {result && (
            <div className="mt-2 rounded-lg bg-[#e8f8ef] px-3 py-2.5 text-[0.85rem] text-[#1e7a45]">
              {t('added')} {result.added}, {t('skipped')} {result.skipped}, {t('invalid')}{' '}
              {result.invalid} ({t('from')} {result.total})
            </div>
          )}
          {error && (
            <div className="mt-2 rounded-lg bg-[#fdecea] px-3 py-2.5 text-[0.85rem] text-danger">
              {error}
            </div>
          )}
        </section>

        <section className="mb-6 border-b border-[#eef1f5] pb-4">
          <h2>{t('export')}</h2>
          <div className="flex gap-2.5">
            <button
              type="button"
              className="flex-1 rounded-[10px] bg-[#eef1f8] px-4 py-3 font-semibold text-primary"
              onClick={() => void exportCsv()}
            >
              {t('exportCsv')}
            </button>
          </div>
        </section>

        <section className="mb-6 pb-4">
          <h2>{t('installPwa')}</h2>
          <p className="mb-2 text-[0.9rem] text-text-muted">{t('installDescription')}</p>
        </section>
      </div>
    </div>
  )
}
