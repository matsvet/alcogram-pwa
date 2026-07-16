import type { Drink, SoberDay } from '../types'
import {
  bulkPutDrinksSilent,
  bulkPutSoberSilent,
  getAllDrinksRaw,
  getAllSoberDaysRaw,
} from '../db'
import { getSupabase, isCloudConfigured } from '../lib/supabase'

export type SyncResult =
  | { ok: true; drinksUp: number; drinksDown: number; soberUp: number; soberDown: number }
  | { ok: false; error: string }

type RemoteDrink = {
  id: string
  user_id: string
  date: string
  drink_index: number
  alcohol: string
  amount: number
  unit: string
  amount_ml: number
  abv: number | null
  price: number | null
  currency: string
  notes: string
  created_at: number
  updated_at: number
  source: string
  deleted: boolean
}

type RemoteSober = {
  user_id: string
  date: string
  created_at: number
  updated_at: number
  source: string
  deleted: boolean
}

let syncTimer: ReturnType<typeof setTimeout> | null = null
let syncing = false
const listeners = new Set<(msg: string) => void>()

export function onSyncStatus(cb: (msg: string) => void): () => void {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

function emit(msg: string) {
  for (const cb of listeners) cb(msg)
}

/** Debounced background sync after local writes. */
export function scheduleSync(delayMs = 1200): void {
  if (!isCloudConfigured()) return
  if (syncTimer) clearTimeout(syncTimer)
  syncTimer = setTimeout(() => {
    void fullSync().then((r) => {
      if (r.ok) emit(`Синхронизировано · ↑${r.drinksUp + r.soberUp} ↓${r.drinksDown + r.soberDown}`)
      else if (r.error !== 'not_signed_in' && r.error !== 'not_configured') {
        emit(`Синхронизация: ${r.error}`)
      }
    })
  }, delayMs)
}

export async function fullSync(): Promise<SyncResult> {
  if (!isCloudConfigured()) {
    return { ok: false, error: 'not_configured' }
  }
  const supabase = getSupabase()
  if (!supabase) return { ok: false, error: 'not_configured' }

  if (syncing) return { ok: false, error: 'busy' }
  syncing = true
  emit('Синхронизация…')

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session?.user) {
      return { ok: false, error: 'not_signed_in' }
    }
    const userId = session.user.id

    // --- DRINKS ---
    const { data: remoteDrinks, error: pullDrinksErr } = await supabase
      .from('drinks')
      .select('*')
      .eq('user_id', userId)

    if (pullDrinksErr) {
      return { ok: false, error: pullDrinksErr.message }
    }

    const localDrinks = await getAllDrinksRaw()
    const remoteMap = new Map((remoteDrinks as RemoteDrink[]).map((r) => [r.id, r]))
    const localMap = new Map(localDrinks.map((d) => [d.id, d]))

    const mergedDrinks: Drink[] = []
    const toPushDrinks: RemoteDrink[] = []

    const allIds = new Set([...remoteMap.keys(), ...localMap.keys()])
    for (const id of allIds) {
      const local = localMap.get(id)
      const remote = remoteMap.get(id)
      if (local && remote) {
        const winner =
          local.updatedAt >= remote.updated_at
            ? local
            : remoteToDrink(remote)
        mergedDrinks.push(winner)
        if (local.updatedAt >= remote.updated_at) {
          toPushDrinks.push(drinkToRemote(winner, userId))
        }
      } else if (local) {
        mergedDrinks.push(local)
        toPushDrinks.push(drinkToRemote(local, userId))
      } else if (remote) {
        mergedDrinks.push(remoteToDrink(remote))
      }
    }

    await bulkPutDrinksSilent(mergedDrinks)

    let drinksUp = 0
    if (toPushDrinks.length) {
      // upsert in chunks
      for (const chunk of chunkArr(toPushDrinks, 200)) {
        const { error } = await supabase.from('drinks').upsert(chunk, { onConflict: 'id' })
        if (error) return { ok: false, error: error.message }
        drinksUp += chunk.length
      }
    }

    // --- SOBER DAYS ---
    const { data: remoteSober, error: pullSoberErr } = await supabase
      .from('sober_days')
      .select('*')
      .eq('user_id', userId)

    if (pullSoberErr) {
      return { ok: false, error: pullSoberErr.message }
    }

    const localSober = await getAllSoberDaysRaw()
    const rSober = new Map((remoteSober as RemoteSober[]).map((r) => [r.date, r]))
    const lSober = new Map(localSober.map((s) => [s.date, s]))

    const mergedSober: SoberDay[] = []
    const toPushSober: RemoteSober[] = []
    const allDates = new Set([...rSober.keys(), ...lSober.keys()])

    for (const date of allDates) {
      const local = lSober.get(date)
      const remote = rSober.get(date)
      if (local && remote) {
        const winner =
          local.updatedAt >= remote.updated_at
            ? local
            : remoteToSober(remote)
        mergedSober.push(winner)
        if (local.updatedAt >= remote.updated_at) {
          toPushSober.push(soberToRemote(winner, userId))
        }
      } else if (local) {
        mergedSober.push(local)
        toPushSober.push(soberToRemote(local, userId))
      } else if (remote) {
        mergedSober.push(remoteToSober(remote))
      }
    }

    await bulkPutSoberSilent(mergedSober)

    let soberUp = 0
    if (toPushSober.length) {
      for (const chunk of chunkArr(toPushSober, 200)) {
        const { error } = await supabase
          .from('sober_days')
          .upsert(chunk, { onConflict: 'user_id,date' })
        if (error) return { ok: false, error: error.message }
        soberUp += chunk.length
      }
    }

    const drinksDown = (remoteDrinks as RemoteDrink[]).length
    const soberDown = (remoteSober as RemoteSober[]).length

    return {
      ok: true,
      drinksUp,
      drinksDown,
      soberUp,
      soberDown,
    }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  } finally {
    syncing = false
  }
}

function drinkToRemote(d: Drink, userId: string): RemoteDrink {
  return {
    id: d.id,
    user_id: userId,
    date: d.date,
    drink_index: d.drinkIndex,
    alcohol: d.alcohol,
    amount: d.amount,
    unit: d.unit,
    amount_ml: d.amountMl,
    abv: d.abv,
    price: d.price,
    currency: d.currency,
    notes: d.notes,
    created_at: d.createdAt,
    updated_at: d.updatedAt,
    source: d.source,
    deleted: d.deleted ?? false,
  }
}

function remoteToDrink(r: RemoteDrink): Drink {
  return {
    id: r.id,
    date: r.date,
    drinkIndex: r.drink_index,
    alcohol: r.alcohol,
    amount: r.amount,
    unit: r.unit,
    amountMl: r.amount_ml,
    abv: r.abv,
    price: r.price,
    currency: r.currency,
    notes: r.notes ?? '',
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    source: (r.source as Drink['source']) || 'manual',
    deleted: r.deleted ?? false,
  }
}

function soberToRemote(s: SoberDay, userId: string): RemoteSober {
  return {
    user_id: userId,
    date: s.date,
    created_at: s.createdAt,
    updated_at: s.updatedAt,
    source: s.source,
    deleted: s.deleted ?? false,
  }
}

function remoteToSober(r: RemoteSober): SoberDay {
  return {
    date: r.date,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    source: (r.source as SoberDay['source']) || 'manual',
    deleted: r.deleted ?? false,
  }
}

function chunkArr<T>(arr: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}
