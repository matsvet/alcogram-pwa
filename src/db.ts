import Dexie, { type EntityTable } from 'dexie'
import type { Drink } from './types'

const db = new Dexie('AlcogramDiary') as Dexie & {
  drinks: EntityTable<Drink, 'id'>
}

db.version(1).stores({
  drinks: 'id, date, drinkIndex, alcohol, [date+drinkIndex], updatedAt',
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

export async function putDrink(drink: Drink): Promise<void> {
  await db.drinks.put(drink)
}

export async function deleteDrink(id: string): Promise<void> {
  await db.drinks.delete(id)
}

export async function clearAllDrinks(): Promise<void> {
  await db.drinks.clear()
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
