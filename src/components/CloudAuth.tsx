import { useEffect, useRef, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { getSupabase, isCloudConfigured } from '../lib/supabase'
import { fullSync, onSyncStatus } from '../sync/sync'

interface Props {
  onSynced: () => void
}

const PERSONAL_MIGRATION_HASH = '#sober-days-5c4a75a0'
const PERSONAL_MIGRATION_EMAIL = 'misvetozarov@gmail.com'

function getPersonalSoberDates(): string[] {
  const dates: string[] = []
  const cursor = new Date('2023-01-01T00:00:00Z')
  const end = new Date('2026-03-31T00:00:00Z')
  while (cursor <= end) {
    dates.push(cursor.toISOString().slice(0, 10))
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }
  return dates
}

export function CloudAuth({ onSynced }: Props) {
  const configured = isCloudConfigured()
  const [session, setSession] = useState<Session | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [syncMsg, setSyncMsg] = useState<string | null>(null)
  const [personalMigrationMsg, setPersonalMigrationMsg] = useState<string | null>(null)
  const personalMigrationStarted = useRef(false)

  useEffect(() => {
    if (!configured) return
    const supabase = getSupabase()
    if (!supabase) return

    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s)
    })
    return () => sub.subscription.unsubscribe()
  }, [configured])

  useEffect(() => onSyncStatus(setSyncMsg), [])

  // Auto-sync when signed in
  useEffect(() => {
    if (!session) return
    void fullSync().then((r) => {
      if (r.ok) {
        onSynced()
      } else if (r.error !== 'busy') {
        setSyncMsg(`Ошибка синхронизации: ${r.error}`)
      }
    })
  }, [session?.user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (
      personalMigrationStarted.current ||
      window.location.hash !== PERSONAL_MIGRATION_HASH ||
      session?.user.email !== PERSONAL_MIGRATION_EMAIL
    ) {
      return
    }
    const supabase = getSupabase()
    if (!supabase) return

    personalMigrationStarted.current = true
    setPersonalMigrationMsg('Перенос отметок «не пил»…')
    void (async () => {
      const userId = session.user.id
      const [drinksResult, soberResult] = await Promise.all([
        supabase
          .from('drinks')
          .select('date')
          .eq('user_id', userId)
          .eq('deleted', false)
          .gte('date', '2023-01-01')
          .lte('date', '2026-03-31'),
        supabase
          .from('sober_days')
          .select('date, deleted')
          .eq('user_id', userId)
          .gte('date', '2023-01-01')
          .lte('date', '2026-03-31'),
      ])
      if (drinksResult.error) throw drinksResult.error
      if (soberResult.error) throw soberResult.error

      const drinkDates = new Set(drinksResult.data.map((row) => row.date))
      const soberDays = new Map(
        soberResult.data.map((row) => [row.date, row.deleted]),
      )
      const now = Date.now()
      const rows = getPersonalSoberDates()
        .filter((date) => !drinkDates.has(date) && soberDays.get(date) !== false)
        .map((date) => ({
          user_id: userId,
          date,
          created_at: now,
          updated_at: now,
          source: 'manual',
          deleted: false,
        }))

      for (let i = 0; i < rows.length; i += 200) {
        const { error } = await supabase
          .from('sober_days')
          .upsert(rows.slice(i, i + 200), { onConflict: 'user_id,date' })
        if (error) throw error
      }

      const { count, error } = await supabase
        .from('sober_days')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('deleted', false)
        .gte('date', '2023-01-01')
        .lte('date', '2026-03-31')
      if (error) throw error
      setPersonalMigrationMsg(`Добавлено: ${rows.length}. Всего отметок: ${count ?? 0}`)
      onSynced()
    })().catch((e) => {
      setPersonalMigrationMsg(`Ошибка переноса: ${e instanceof Error ? e.message : String(e)}`)
    })
  }, [session, onSynced])

  if (!configured) {
    return (
      <section className="settings-block">
        <h2>Облако (Supabase)</h2>
        <p className="muted">
          Не настроено. Создай бесплатный проект на{' '}
          <a href="https://supabase.com" target="_blank" rel="noreferrer">
            supabase.com
          </a>
          , выполни SQL из <code>supabase/schema.sql</code>, добавь в сборку:
        </p>
        <pre className="env-pre">
{`VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...`}
        </pre>
        <p className="muted">
          Локально: файл <code>.env.local</code>. На GitHub Pages: Secrets + Actions.
          Пока облако выкл. – всё только в IndexedDB.
        </p>
      </section>
    )
  }

  const user: User | undefined = session?.user

  const submit = async () => {
    setErr(null)
    setMsg(null)
    const supabase = getSupabase()
    if (!supabase) return
    if (!email.trim() || password.length < 6) {
      setErr('Email и пароль (мин. 6 символов)')
      return
    }
    setBusy(true)
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        })
        if (error) throw error
        setMsg('Аккаунт создан. Если включено подтверждение email – проверь почту, иначе можно сразу войти.')
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        })
        if (error) throw error
        setMsg('Вход выполнен')
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  const logout = async () => {
    const supabase = getSupabase()
    if (!supabase) return
    await supabase.auth.signOut()
    setSession(null)
    setMsg('Выход')
  }

  const loginWithGoogle = async () => {
    setBusy(true)
    setErr(null)
    const supabase = getSupabase()
    if (!supabase) {
      setBusy(false)
      return
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}${import.meta.env.BASE_URL}`,
      },
    })
    if (error) {
      setErr(error.message)
      setBusy(false)
    }
  }

  const syncNow = async () => {
    setBusy(true)
    setErr(null)
    try {
      const r = await fullSync()
      if (r.ok) {
        onSynced()
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="settings-block">
      <h2>Облако (Supabase)</h2>
      <p className="muted">
        Offline-first + синхронизация. Один аккаунт на iPhone и Android.
      </p>

      {user ? (
        <>
          <p>
            Вошёл: <strong>{user.email}</strong>
          </p>
          <div className="btn-row" style={{ marginTop: 8 }}>
            <button
              type="button"
              className="btn-secondary"
              disabled={busy}
              onClick={() => void syncNow()}
            >
              Синхронизировать
            </button>
            <button
              type="button"
              className="btn-danger"
              disabled={busy}
              onClick={() => void logout()}
            >
              Выйти
            </button>
          </div>
          {syncMsg && (
            <div className={syncMsg.startsWith('Ошибка') ? 'import-error' : 'import-result'}>
              {syncMsg}
            </div>
          )}
          {personalMigrationMsg && (
            <div className={personalMigrationMsg.startsWith('Ошибка') ? 'import-error' : 'import-result'}>
              {personalMigrationMsg}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="period-tabs" style={{ marginBottom: 12 }}>
            <button
              type="button"
              className={mode === 'login' ? 'active' : ''}
              onClick={() => setMode('login')}
            >
              Вход
            </button>
            <button
              type="button"
              className={mode === 'signup' ? 'active' : ''}
              onClick={() => setMode('signup')}
            >
              Регистрация
            </button>
          </div>
          <input
            className="field"
            type="email"
            autoComplete="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="field"
            style={{ marginTop: 8 }}
            type="password"
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            placeholder="Пароль (мин. 6)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            className="btn-primary"
            style={{ marginTop: 12 }}
            disabled={busy}
            onClick={() => void submit()}
          >
            {mode === 'login' ? 'Войти' : 'Создать аккаунт'}
          </button>
          <button
            type="button"
            className="btn-secondary"
            style={{ marginTop: 8, width: '100%' }}
            disabled={busy}
            onClick={() => void loginWithGoogle()}
          >
            Войти через Google
          </button>
        </>
      )}

      {msg && <div className="import-result">{msg}</div>}
      {err && <div className="import-error">{err}</div>}
    </section>
  )
}
