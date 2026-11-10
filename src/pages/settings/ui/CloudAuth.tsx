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
      <section className="mb-6 border-b border-[#eef1f5] pb-4">
        <h2>{t('cloud')}</h2>
        <p className="mb-2 text-[0.9rem] text-text-muted">
          {t('cloudNotConfigured')}{' '}
          <a className="text-primary" href="https://supabase.com" target="_blank" rel="noreferrer">
            supabase.com
          </a>
          , {t('cloudSetup')} <code>supabase/schema.sql</code>, {t('cloudBuild')}
        </p>
        <pre className="my-2 overflow-x-auto break-all rounded-lg bg-[#eef1f8] px-3 py-2.5 text-[0.72rem] whitespace-pre-wrap text-text">
          {`VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...`}
        </pre>
        <p className="mb-2 text-[0.9rem] text-text-muted">
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
    <section className="mb-6 border-b border-[#eef1f5] pb-4">
      <h2>{t('cloud')}</h2>
      <p className="mb-2 text-[0.9rem] text-text-muted">{t('cloudDescription')}</p>

      {user ? (
        <>
          <p>
            {t('signedInAs')} <strong>{user.email}</strong>
          </p>
          <div className="mt-2 flex gap-2.5">
            <button
              type="button"
              className="flex-1 rounded-[10px] bg-[#eef1f8] px-4 py-3 font-semibold text-primary disabled:opacity-60"
              disabled={busy}
              onClick={() => void syncNow()}
            >
              {t('sync')}
            </button>
            <button
              type="button"
              className="flex-1 rounded-[10px] bg-[#fdecea] px-4 py-3 font-semibold text-danger disabled:opacity-60"
              disabled={busy}
              onClick={() => void logout()}
            >
              {t('signOut')}
            </button>
          </div>
          {syncMsg && (
            <div
              className={
                typeof syncMsg === 'object'
                  ? 'mt-2 rounded-lg bg-[#fdecea] px-3 py-2.5 text-[0.85rem] text-danger'
                  : 'mt-2 rounded-lg bg-[#e8f8ef] px-3 py-2.5 text-[0.85rem] text-[#1e7a45]'
              }
            >
              {typeof syncMsg === 'object' ? `${t('syncError')} ${syncMsg.error}` : t(syncMsg)}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="mb-3 flex rounded-[10px] bg-[#eef1f8] p-0.75">
            <button
              type="button"
              className={`flex-1 rounded-lg p-2 text-[0.9rem] text-text-muted ${mode === 'login' ? 'bg-white font-semibold text-primary shadow-[0_1px_4px_rgba(0,0,0,0.06)]' : ''}`}
              onClick={() => setMode('login')}
            >
              {t('signIn')}
            </button>
            <button
              type="button"
              className={`flex-1 rounded-lg p-2 text-[0.9rem] text-text-muted ${mode === 'signup' ? 'bg-white font-semibold text-primary shadow-[0_1px_4px_rgba(0,0,0,0.06)]' : ''}`}
              onClick={() => setMode('signup')}
            >
              {t('signUp')}
            </button>
          </div>
          <input
            className="w-full rounded-[10px] border-[1.5px] border-primary bg-white px-3.5 py-3 outline-none focus:shadow-[0_0_0_3px_rgba(107,127,232,0.2)]"
            type="email"
            autoComplete="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="mt-2 w-full rounded-[10px] border-[1.5px] border-primary bg-white px-3.5 py-3 outline-none focus:shadow-[0_0_0_3px_rgba(107,127,232,0.2)]"
            type="password"
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            placeholder={t('password')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            className="mt-3 w-full rounded-[10px] bg-primary p-3.5 font-semibold tracking-[0.04em] text-white active:bg-primary-dark disabled:opacity-60"
            disabled={busy}
            onClick={() => void submit()}
          >
            {mode === 'login' ? t('signIn') : t('createAccount')}
          </button>
          <button
            type="button"
            className="mt-2 w-full rounded-[10px] bg-[#eef1f8] px-4 py-3 font-semibold text-primary disabled:opacity-60"
            disabled={busy}
            onClick={() => void loginWithGoogle()}
          >
            {t('googleSignIn')}
          </button>
        </>
      )}

      {msg && (
        <div className="mt-2 rounded-lg bg-[#e8f8ef] px-3 py-2.5 text-[0.85rem] text-[#1e7a45]">
          {msg}
        </div>
      )}
      {err && (
        <div className="mt-2 rounded-lg bg-[#fdecea] px-3 py-2.5 text-[0.85rem] text-danger">
          {err}
        </div>
      )}
    </section>
  )
}
