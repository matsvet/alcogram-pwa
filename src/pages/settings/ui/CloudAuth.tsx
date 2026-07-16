import type { Session, User } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'
import { fullSync, onSyncStatus, type SyncStatus } from '@/features/cloud-sync'
import { getSupabase, isCloudConfigured } from '@/shared/api/supabase'
import { useI18n } from '@/shared/lib/i18n'

interface Props {
  onSynced: () => void
}

export function CloudAuth({ onSynced }: Props) {
  const { t } = useI18n()
  const configured = isCloudConfigured()
  const [session, setSession] = useState<Session | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [syncMsg, setSyncMsg] = useState<SyncStatus | null>(null)

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
        setSyncMsg({ type: 'error', error: r.error })
      }
    })
  }, [session, onSynced])

  if (!configured) {
    return (
      <section className="settings-block">
        <h2>{t('cloud')}</h2>
        <p className="muted">
          {t('cloudNotConfigured')}{' '}
          <a href="https://supabase.com" target="_blank" rel="noreferrer">
            supabase.com
          </a>
          , {t('cloudSetup')} <code>supabase/schema.sql</code>, {t('cloudBuild')}
        </p>
        <pre className="env-pre">
          {`VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...`}
        </pre>
        <p className="muted">
          {t('cloudLocal')} <code>.env.local</code>. {t('cloudPages')}
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
      setErr(t('emailPassword'))
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
        setMsg(t('accountCreated'))
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        })
        if (error) throw error
        setMsg(t('signedIn'))
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
    setMsg(t('signedOut'))
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
      <h2>{t('cloud')}</h2>
      <p className="muted">{t('cloudDescription')}</p>

      {user ? (
        <>
          <p>
            {t('signedInAs')} <strong>{user.email}</strong>
          </p>
          <div className="btn-row" style={{ marginTop: 8 }}>
            <button
              type="button"
              className="btn-secondary"
              disabled={busy}
              onClick={() => void syncNow()}
            >
              {t('sync')}
            </button>
            <button
              type="button"
              className="btn-danger"
              disabled={busy}
              onClick={() => void logout()}
            >
              {t('signOut')}
            </button>
          </div>
          {syncMsg && (
            <div className={typeof syncMsg === 'object' ? 'import-error' : 'import-result'}>
              {typeof syncMsg === 'object' ? `${t('syncError')} ${syncMsg.error}` : t(syncMsg)}
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
              {t('signIn')}
            </button>
            <button
              type="button"
              className={mode === 'signup' ? 'active' : ''}
              onClick={() => setMode('signup')}
            >
              {t('signUp')}
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
            placeholder={t('password')}
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
            {mode === 'login' ? t('signIn') : t('createAccount')}
          </button>
          <button
            type="button"
            className="btn-secondary"
            style={{ marginTop: 8, width: '100%' }}
            disabled={busy}
            onClick={() => void loginWithGoogle()}
          >
            {t('googleSignIn')}
          </button>
        </>
      )}

      {msg && <div className="import-result">{msg}</div>}
      {err && <div className="import-error">{err}</div>}
    </section>
  )
}
