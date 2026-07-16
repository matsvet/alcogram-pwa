import Dexie, { type EntityTable } from 'dexie'
import type { Drink, SoberDay } from './types'
import { notifyLocalDataChange } from './sync/bus'
import {
  makeSyncQueueItem,
  type SyncEntity,
  type SyncQueueItem,
} from './sync/outbox'

const db = new Dexie('AlcogramDiary') as Dexie & {
  drinks: EntityTable<Drink, 'id'>
  soberDays: EntityTable<SoberDay, 'date'>
  syncQueue: EntityTable<SyncQueueItem, 'key'>
}

db.version(1).stores({
  drinks: 'id, date, drinkIndex, alcohol, [date+drinkIndex], updatedAt',
})

db.version(2).stores({
  drinks: 'id, date, drinkIndex, alcohol, [date+drinkIndex], updatedAt',
  soberDays: 'date, createdAt',
})

db.version(3)
  .stores({
    drinks: 'id, date, drinkIndex, alcohol, [date+drinkIndex], updatedAt, deleted',
    soberDays: 'date, createdAt, updatedAt, deleted',
  })
  .upgrade(async (tx) => {
    await tx
      .table('drinks')
      .toCollection()
      .modify((d: Record<string, unknown>) => {
        if (d.deleted === undefined) d.deleted = false
      })
    await tx
      .table('soberDays')
      .toCollection()
      .modify((s: Record<string, unknown>) => {
        if (s.deleted === undefined) s.deleted = false
        if (s.updatedAt === undefined) s.updatedAt = (s.createdAt as number) || Date.now()
      })
  })

db.version(4)
  .stores({
    drinks: 'id, date, drinkIndex, alcohol, [date+drinkIndex], updatedAt, deleted',
    soberDays: 'date, createdAt, updatedAt, deleted',
    syncQueue: 'key, entity, updatedAt',
  })
  .upgrade(async (tx) => {
    const drinks = (await tx.table('drinks').toArray()) as Drink[]
    const soberDays = (await tx.table('soberDays').toArray()) as SoberDay[]
    await tx
      .table('syncQueue')
      .bulkPut([
        ...drinks.map((d) => makeSyncQueueItem('drink', d.id, d.updatedAt)),
        ...soberDays.map((s) => makeSyncQueueItem('soberDay', s.date, s.updatedAt)),
      ])
  })

export { db }

function aliveDrink(d: Drink): boolean {
  return !d.deleted
}

function aliveSober(s: SoberDay): boolean {
  return !s.deleted
}

export async function getAllDrinks(): Promise<Drink[]> {
  const all = await db.drinks.orderBy('date').reverse().toArray()
  return all.filter(aliveDrink)
}

/** Including soft-deleted (for sync). */
export async function getAllDrinksRaw(): Promise<Drink[]> {
  return db.drinks.toArray()
}

export async function getDrinksByDate(date: string): Promise<Drink[]> {
  const rows = await db.drinks.where('date').equals(date).sortBy('drinkIndex')
  return rows.filter(aliveDrink)
}

export async function getDrinksInRange(
  from: string,
  to: string,
): Promise<Drink[]> {
  const rows = await db.drinks
    .where('date')
    .between(from, to, true, true)
    .toArray()
  return rows.filter(aliveDrink)
}

export async function getDatesWithDrinks(
  year: number,
  month: number,
): Promise<Map<string, Drink[]>> {
  const mm = String(month).padStart(2, '0')
  const prefix = `${year}-${mm}`
  const from = `${prefix}-01`
  const to = `${prefix}-31`
  const rows = await db.drinks.where('date').between(from, to, true, true).toArray()
  const map = new Map<string, Drink[]>()
  for (const d of rows) {
    if (!aliveDrink(d)) continue
    const list = map.get(d.date) ?? []
    list.push(d)
    map.set(d.date, list)
  }
  for (const [, list] of map) {
    list.sort((a, b) => a.drinkIndex - b.drinkIndex)
  }
  return map
}

export async function getSoberDatesInMonth(
  year: number,
  month: number,
): Promise<Set<string>> {
  const mm = String(month).padStart(2, '0')
  const from = `${year}-${mm}-01`
  const to = `${year}-${mm}-31`
  const rows = await db.soberDays
    .where('date')
    .between(from, to, true, true)
    .toArray()
  return new Set(rows.filter(aliveSober).map((r) => r.date))
}

export async function getAllSoberDaysRaw(): Promise<SoberDay[]> {
  return db.soberDays.toArray()
}

export async function isSoberDay(date: string): Promise<boolean> {
  const row = await db.soberDays.get(date)
  return !!row && aliveSober(row)
}

export async function markSoberDay(
  date: string,
  source: SoberDay['source'] = 'manual',
): Promise<void> {
  const now = Date.now()
  const existing = await db.soberDays.get(date)
  const row: SoberDay = {
    date,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    source,
    deleted: false,
  }
  await db.transaction('rw', db.soberDays, db.syncQueue, async () => {
    await db.soberDays.put(row)
    await queueChange('soberDay', date, now)
  })
  notifyLocalDataChange()
}

export async function unmarkSoberDay(date: string): Promise<void> {
  const existing = await db.soberDays.get(date)
  if (!existing) return
  const row: SoberDay = {
    ...existing,
    deleted: true,
    updatedAt: Date.now(),
  }
  await db.transaction('rw', db.soberDays, db.syncQueue, async () => {
    await db.soberDays.put(row)
    await queueChange('soberDay', date, row.updatedAt)
  })
  notifyLocalDataChange()
}

export async function putDrink(drink: Drink): Promise<void> {
  const withFlags: Drink = {
    ...drink,
    deleted: drink.deleted ?? false,
    updatedAt: drink.updatedAt || Date.now(),
  }
  await db.transaction('rw', db.drinks, db.soberDays, db.syncQueue, async () => {
    await db.drinks.put(withFlags)
    await queueChange('drink', withFlags.id, withFlags.updatedAt)
    // Adding/editing a live drink cancels sober mark for that day
    if (!withFlags.deleted) {
      const sober = await db.soberDays.get(withFlags.date)
      if (sober && !sober.deleted) {
        const removedSober: SoberDay = {
          ...sober,
          deleted: true,
          updatedAt: Date.now(),
        }
        await db.soberDays.put(removedSober)
        await queueChange('soberDay', removedSober.date, removedSober.updatedAt)
      }
    }
  })
  notifyLocalDataChange()
}

export async function deleteDrink(id: string): Promise<void> {
  const existing = await db.drinks.get(id)
  if (!existing) return
  const row: Drink = {
    ...existing,
    deleted: true,
    updatedAt: Date.now(),
  }
  await db.transaction('rw', db.drinks, db.syncQueue, async () => {
    await db.drinks.put(row)
    await queueChange('drink', row.id, row.updatedAt)
  })
  notifyLocalDataChange()
}

export async function clearAllDrinks(): Promise<void> {
  const now = Date.now()
  await db.transaction('rw', db.drinks, db.soberDays, db.syncQueue, async () => {
    const drinks = await db.drinks.toArray()
    for (const d of drinks) {
      const row = { ...d, deleted: true, updatedAt: now }
      await db.drinks.put(row)
      await queueChange('drink', row.id, now)
    }
    const sober = await db.soberDays.toArray()
    for (const s of sober) {
      const row = { ...s, deleted: true, updatedAt: now }
      await db.soberDays.put(row)
      await queueChange('soberDay', row.date, now)
    }
  })
  notifyLocalDataChange()
}

/** Hard wipe local only (e.g. before force reseed). Does not soft-delete for sync. */
export async function hardClearLocal(): Promise<void> {
  await db.transaction('rw', db.drinks, db.soberDays, db.syncQueue, async () => {
    await db.drinks.clear()
    await db.soberDays.clear()
    await db.syncQueue.clear()
  })
}

export async function countDrinks(): Promise<number> {
  const all = await db.drinks.toArray()
  return all.filter(aliveDrink).length
}

export async function bulkPutDrinks(drinks: Drink[]): Promise<void> {
  const normalized = drinks.map((d) => ({
    ...d,
    deleted: d.deleted ?? false,
  }))
  await db.transaction('rw', db.drinks, db.syncQueue, async () => {
    await db.drinks.bulkPut(normalized)
    await db.syncQueue.bulkPut(
      normalized.map((d) => makeSyncQueueItem('drink', d.id, d.updatedAt)),
    )
  })
  notifyLocalDataChange()
}

export async function bulkPutDrinksSilent(drinks: Drink[]): Promise<void> {
  const normalized = drinks.map((d) => ({
    ...d,
    deleted: d.deleted ?? false,
  }))
  await db.drinks.bulkPut(normalized)
}

export async function bulkPutSoberSilent(rows: SoberDay[]): Promise<void> {
  await db.soberDays.bulkPut(rows)
}

async function queueChange(entity: SyncEntity, id: string, updatedAt: number): Promise<void> {
  await db.syncQueue.put(makeSyncQueueItem(entity, id, updatedAt))
}

export async function getSyncQueue(): Promise<SyncQueueItem[]> {
  return db.syncQueue.toArray()
}

/** Remove only the queue entries that have not changed during this sync. */
export async function clearSyncedQueue(items: SyncQueueItem[]): Promise<void> {
  if (!items.length) return
  await db.transaction('rw', db.syncQueue, async () => {
    for (const item of items) {
      const current = await db.syncQueue.get(item.key)
      if (current?.updatedAt === item.updatedAt) await db.syncQueue.delete(item.key)
    }
  })
}

/** Stable merge key for import dedup */
export function drinkMergeKey(d: {
  date: string
  drinkIndex: number
  alcohol: string
  amount: number
  abv: number | null
  price: number | null
  notes: string
}): string {
  return [
    d.date,
    d.drinkIndex,
    d.alcohol,
    d.amount,
    d.abv ?? '',
    d.price ?? '',
    d.notes,
  ].join('|')
}
