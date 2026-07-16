import { useEffect, useRef, useState } from 'react'
import { countDrinks, getAllDrinks } from '@/shared/db/diary'
import { useI18n } from '@/shared/lib/i18n'
import { PageCard } from '@/shared/ui'
import { drinksToCsv, importDrinks, parseImportFile } from '../lib/importExport'
import type { ImportMode, ImportResult } from '../model/import'
import { CloudAuth } from './CloudAuth'
import styles from './SettingsPage.module.css'

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
    <div className={styles.root}>
      <PageCard>
        <h1 className={styles.title}>{t('settings')}</h1>

        <section className={styles.section}>
          <label>
            {t('language')}
            <select
              className={styles.field}
              value={locale}
              onChange={(event) => setLocale(event.target.value as 'en' | 'ru')}
            >
              <option value="en">{t('english')}</option>
              <option value="ru">{t('russian')}</option>
            </select>
          </label>
        </section>

        <CloudAuth onSynced={onDataChange} />

        <section className={styles.section}>
          <h2>{t('deviceData')}</h2>
          <p>
            {t('recordsInDb')} <strong>{count}</strong>
          </p>
          <p className={styles.muted}>
            {t('version')} {APP_VERSION} · {t('optionalSupabase')}
          </p>
        </section>

        <section className={styles.section}>
          <h2>{t('importFile')}</h2>
          <p className={styles.muted}>{t('importDescription')}</p>
          <div className={styles.modeRow}>
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
            className={styles.fileInput}
            disabled={busy}
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) void onFile(f)
            }}
          />
          {busy && <p className={styles.muted}>{t('importing')}</p>}
          {result && (
            <div className={styles.result}>
              {t('added')} {result.added}, {t('skipped')} {result.skipped}, {t('invalid')}{' '}
              {result.invalid} ({t('from')} {result.total})
            </div>
          )}
          {error && <div className={styles.error}>{error}</div>}
        </section>

        <section className={styles.section}>
          <h2>{t('export')}</h2>
          <div className={styles.buttonRow}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => void exportCsv()}
            >
              {t('exportCsv')}
            </button>
          </div>
        </section>

        <section className={styles.section}>
          <h2>{t('installPwa')}</h2>
          <p className={styles.muted}>{t('installDescription')}</p>
        </section>
      </PageCard>
    </div>
  )
}
