import type { SupabaseClient } from '@supabase/supabase-js'
import type { AlcoholType, Drink, SoberDay } from '@/shared/api/diary'
import { getSupabase, isCloudConfigured } from '@/shared/api/supabase'
import {
  bulkPutDrinksSilent,
  bulkPutSoberSilent,
  clearSyncedQueue,
  getAllDrinksRaw,
  getAllSoberDaysRaw,
  getSyncCursor,
  getSyncQueue,
  setSyncCursor,
} from '@/shared/db/diary'
import { type SyncQueueItem, shouldApplyRemoteChange } from '@/shared/db/syncQueue'

export type SyncResult =
  | { ok: true; drinksUp: number; drinksDown: number; soberUp: number; soberDown: number }
  | { ok: false; error: string }

export type SyncStatus = 'savedLocally' | 'syncing' | 'synced' | { type: 'error'; error: string }

type RemoteDrink = {
  id: string
  user_id: string
  date: string
  drink_index: number
  alcohol: AlcoholType
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
const listeners = new Set<(status: SyncStatus) => void>()
const pullPageSize = 500

export function onSyncStatus(cb: (status: SyncStatus) => void): () => void {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

function emit(status: SyncStatus) {
  for (const cb of listeners) cb(status)
}

/** Debounced background sync after local writes. */
export function scheduleSync(delayMs = 1200): void {
  if (!isCloudConfigured()) return
  emit('savedLocally')
  if (syncTimer) clearTimeout(syncTimer)
  syncTimer = setTimeout(() => {
    void fullSync()
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
  emit('syncing')

  const fail = (error: string): SyncResult => {
    if (error !== 'not_signed_in' && error !== 'not_configured') {
      emit({ type: 'error', error })
    }
    return { ok: false, error }
  }

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session?.user) {
      return fail('not_signed_in')
    }
    const userId = session.user.id
    const queue = await getSyncQueue()
    const clearQueue: SyncQueueItem[] = []

    const localDrinks = await getAllDrinksRaw()
    const localMap = new Map(localDrinks.map((d) => [d.id, d]))
    let drinksUp = 0
    const queuedDrinks = queue.flatMap((item) => {
      const drink = item.entity === 'drink' ? localMap.get(item.id) : undefined
      return drink ? [{ row: drinkToRemote(drink, userId), queue: item }] : []
    })
    if (queuedDrinks.length) {
      for (const chunk of chunkArr(queuedDrinks, 200)) {
        const { error } = await supabase.from('drinks').upsert(
          chunk.map((item) => item.row),
          { onConflict: 'id' },
        )
        if (error) return fail(error.message)
        drinksUp += chunk.length
        clearQueue.push(...chunk.flatMap((item) => (item.queue ? [item.queue] : [])))
      }
    }

    const localSober = await getAllSoberDaysRaw()
    const lSober = new Map(localSober.map((s) => [s.date, s]))
    let soberUp = 0
    const queuedSober = queue.flatMap((item) => {
      const soberDay = item.entity === 'soberDay' ? lSober.get(item.id) : undefined
      return soberDay ? [{ row: soberToRemote(soberDay, userId), queue: item }] : []
    })
    if (queuedSober.length) {
      for (const chunk of chunkArr(queuedSober, 200)) {
        const { error } = await supabase.from('sober_days').upsert(
          chunk.map((item) => item.row),
          { onConflict: 'user_id,date' },
        )
        if (error) return fail(error.message)
        soberUp += chunk.length
        clearQueue.push(...chunk.flatMap((item) => (item.queue ? [item.queue] : [])))
      }
    }

    const drinksCursor = await getSyncCursor(userId, 'drinks')
    const remoteDrinks = await pullDrinks(supabase, userId, drinksCursor)
    const changedDrinks = remoteDrinks
      .filter((remote) =>
        shouldApplyRemoteChange(localMap.get(remote.id)?.updatedAt, remote.updated_at),
      )
      .map(remoteToDrink)
    await bulkPutDrinksSilent(changedDrinks)
    if (remoteDrinks.length) {
      await setSyncCursor(userId, 'drinks', remoteDrinks.at(-1)?.updated_at ?? drinksCursor ?? 0)
    }

    const soberCursor = await getSyncCursor(userId, 'soberDays')
    const remoteSober = await pullSoberDays(supabase, userId, soberCursor)
    const changedSober = remoteSober
      .filter((remote) =>
        shouldApplyRemoteChange(lSober.get(remote.date)?.updatedAt, remote.updated_at),
      )
      .map(remoteToSober)
    await bulkPutSoberSilent(changedSober)
    if (remoteSober.length) {
      await setSyncCursor(userId, 'soberDays', remoteSober.at(-1)?.updated_at ?? soberCursor ?? 0)
    }

    await clearSyncedQueue(clearQueue)

    const drinksDown = remoteDrinks.length
    const soberDown = remoteSober.length

    const result: SyncResult = {
      ok: true,
      drinksUp,
      drinksDown,
      soberUp,
      soberDown,
    }
    emit('synced')
    return result
  } catch (e) {
    return fail(e instanceof Error ? e.message : String(e))
  } finally {
    syncing = false
  }
}

async function pullDrinks(
  supabase: SupabaseClient,
  userId: string,
  cursor: number | undefined,
): Promise<RemoteDrink[]> {
  const rows: RemoteDrink[] = []
  let offset = 0

  while (true) {
    const request = supabase
      .from('drinks')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: true })
      .range(offset, offset + pullPageSize - 1)
    const { data, error } =
      cursor === undefined ? await request : await request.gt('updated_at', cursor)
    if (error) throw new Error(error.message)

    const page = data as RemoteDrink[]
    rows.push(...page)
    if (page.length < pullPageSize) return rows
    offset += page.length
  }
}

async function pullSoberDays(
  supabase: SupabaseClient,
  userId: string,
  cursor: number | undefined,
): Promise<RemoteSober[]> {
  const rows: RemoteSober[] = []
  let offset = 0

  while (true) {
    const request = supabase
      .from('sober_days')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: true })
      .range(offset, offset + pullPageSize - 1)
    const { data, error } =
      cursor === undefined ? await request : await request.gt('updated_at', cursor)
    if (error) throw new Error(error.message)

    const page = data as RemoteSober[]
    rows.push(...page)
    if (page.length < pullPageSize) return rows
    offset += page.length
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
    source: 'manual',
    deleted: r.deleted ?? false,
  }
}

function chunkArr<T>(arr: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}
