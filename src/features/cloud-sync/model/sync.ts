import type { AlcoholType, Drink, SoberDay } from '@/shared/api/diary'
import { getSupabase, isCloudConfigured } from '@/shared/api/supabase'
import {
  bulkPutDrinksSilent,
  bulkPutSoberSilent,
  clearSyncedQueue,
  getAllDrinksRaw,
  getAllSoberDaysRaw,
  getSyncQueue,
} from '@/shared/db/diary'
import { chooseSyncWinner, type SyncQueueItem } from '@/shared/db/syncQueue'

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
    const drinkQueue = new Map(
      queue.filter((item) => item.entity === 'drink').map((item) => [item.id, item]),
    )
    const soberQueue = new Map(
      queue.filter((item) => item.entity === 'soberDay').map((item) => [item.id, item]),
    )
    const clearQueue: SyncQueueItem[] = []

    // --- DRINKS ---
    const { data: remoteDrinks, error: pullDrinksErr } = await supabase
      .from('drinks')
      .select('*')
      .eq('user_id', userId)

    if (pullDrinksErr) {
      return fail(pullDrinksErr.message)
    }

    const localDrinks = await getAllDrinksRaw()
    const remoteMap = new Map((remoteDrinks as RemoteDrink[]).map((r) => [r.id, r]))
    const localMap = new Map(localDrinks.map((d) => [d.id, d]))

    const mergedDrinks: Drink[] = []
    const toPushDrinks: Array<{ row: RemoteDrink; queue?: SyncQueueItem }> = []

    const allIds = new Set([...remoteMap.keys(), ...localMap.keys()])
    for (const id of allIds) {
      const local = localMap.get(id)
      const remote = remoteMap.get(id)
      if (!local && remote) {
        mergedDrinks.push(remoteToDrink(remote))
        continue
      }
      if (!local) continue

      const queueItem = drinkQueue.get(id)
      const decision = chooseSyncWinner(local.updatedAt, remote?.updated_at, Boolean(queueItem))
      if (decision.winner === 'local') {
        mergedDrinks.push(local)
        if (decision.upload) {
          toPushDrinks.push({ row: drinkToRemote(local, userId), queue: queueItem })
        }
      } else if (remote) {
        mergedDrinks.push(remoteToDrink(remote))
      }
      if (decision.clearQueue && queueItem) {
        clearQueue.push(queueItem)
      }
    }

    await bulkPutDrinksSilent(mergedDrinks)

    let drinksUp = 0
    if (toPushDrinks.length) {
      for (const chunk of chunkArr(toPushDrinks, 200)) {
        const { error } = await supabase.from('drinks').upsert(
          chunk.map((item) => item.row),
          { onConflict: 'id' },
        )
        if (error) return fail(error.message)
        drinksUp += chunk.length
        clearQueue.push(...chunk.flatMap((item) => (item.queue ? [item.queue] : [])))
      }
    }

    // --- SOBER DAYS ---
    const { data: remoteSober, error: pullSoberErr } = await supabase
      .from('sober_days')
      .select('*')
      .eq('user_id', userId)

    if (pullSoberErr) {
      return fail(pullSoberErr.message)
    }

    const localSober = await getAllSoberDaysRaw()
    const rSober = new Map((remoteSober as RemoteSober[]).map((r) => [r.date, r]))
    const lSober = new Map(localSober.map((s) => [s.date, s]))

    const mergedSober: SoberDay[] = []
    const toPushSober: Array<{ row: RemoteSober; queue?: SyncQueueItem }> = []
    const allDates = new Set([...rSober.keys(), ...lSober.keys()])

    for (const date of allDates) {
      const local = lSober.get(date)
      const remote = rSober.get(date)
      if (!local && remote) {
        mergedSober.push(remoteToSober(remote))
        continue
      }
      if (!local) continue

      const queueItem = soberQueue.get(date)
      const decision = chooseSyncWinner(local.updatedAt, remote?.updated_at, Boolean(queueItem))
      if (decision.winner === 'local') {
        mergedSober.push(local)
        if (decision.upload) {
          toPushSober.push({ row: soberToRemote(local, userId), queue: queueItem })
        }
      } else if (remote) {
        mergedSober.push(remoteToSober(remote))
      }
      if (decision.clearQueue && queueItem) {
        clearQueue.push(queueItem)
      }
    }

    await bulkPutSoberSilent(mergedSober)

    let soberUp = 0
    if (toPushSober.length) {
      for (const chunk of chunkArr(toPushSober, 200)) {
        const { error } = await supabase.from('sober_days').upsert(
          chunk.map((item) => item.row),
          { onConflict: 'user_id,date' },
        )
        if (error) return fail(error.message)
        soberUp += chunk.length
        clearQueue.push(...chunk.flatMap((item) => (item.queue ? [item.queue] : [])))
      }
    }

    await clearSyncedQueue(clearQueue)

    const drinksDown = (remoteDrinks as RemoteDrink[]).length
    const soberDown = (remoteSober as RemoteSober[]).length

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
