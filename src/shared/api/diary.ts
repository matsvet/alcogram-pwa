export type DrinkSource = 'import' | 'manual'

/** Explicit "did not drink" mark for a calendar day */
export interface SoberDay {
  date: string // YYYY-MM-DD
  createdAt: number
  updatedAt: number
  source: 'manual'
  deleted: boolean
}

export interface Drink {
  id: string
  date: string // YYYY-MM-DD
  drinkIndex: number
  alcohol: string
  amount: number
  unit: string
  amountMl: number
  abv: number | null
  price: number | null
  currency: string
  notes: string
  createdAt: number
  updatedAt: number
  source: DrinkSource
  deleted: boolean
}
