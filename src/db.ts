import Dexie, { type EntityTable } from 'dexie'
import type { Drink, SoberDay } from './types'

const db = new Dexie('AlcogramDiary') as Dexie & {
  drinks: EntityTable<Drink, 'id'>
  soberDays: EntityTable<SoberDay, 'date'>
}

db.version(1).stores({
  drinks: 'id, date, drinkIndex, alcohol, [date+drinkIndex], updatedAt',
})

db.version(2).stores({
  drinks: 'id, date, drinkIndex, alcohol, [date+drinkIndex], updatedAt',
  soberDays: 'date, createdAt',
})

export { db }

export async function getAllDrinks(): Promise<Drink[]> {
  return db.drinks.orderBy('date').reverse().toArray()
}

export async function getDrinksByDate(date: string): Promise<Drink[]> {
  return db.drinks.where('date').equals(date).sortBy('drinkIndex')
}

export async function getDrinksInRange(
  from: string,
  to: string,
): Promise<Drink[]> {
  return db.drinks
    .where('date')
    .between(from, to, true, true)
    .toArray()
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
  return new Set(rows.map((r) => r.date))
}

export async function isSoberDay(date: string): Promise<boolean> {
  const row = await db.soberDays.get(date)
  return !!row
}

export async function markSoberDay(
  date: string,
  source: SoberDay['source'] = 'manual',
): Promise<void> {
  await db.soberDays.put({
    date,
    createdAt: Date.now(),
    source,
  })
}

export async function unmarkSoberDay(date: string): Promise<void> {
  await db.soberDays.delete(date)
}

export async function putDrink(drink: Drink): Promise<void> {
  // Adding a drink cancels sober mark for that day
  await db.transaction('rw', db.drinks, db.soberDays, async () => {
    await db.drinks.put(drink)
    await db.soberDays.delete(drink.date)
  })
}

export async function deleteDrink(id: string): Promise<void> {
  await db.drinks.delete(id)
}

export async function clearAllDrinks(): Promise<void> {
  await db.transaction('rw', db.drinks, db.soberDays, async () => {
    await db.drinks.clear()
    await db.soberDays.clear()
  })
}

export async function countDrinks(): Promise<number> {
  return db.drinks.count()
}

export async function bulkPutDrinks(drinks: Drink[]): Promise<void> {
  await db.drinks.bulkPut(drinks)
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
