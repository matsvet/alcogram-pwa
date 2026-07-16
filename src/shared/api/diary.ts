export type DrinkSource = 'import' | 'manual'

export const ALCOHOL_TYPES = [
  'Beer',
  'Red wine',
  'White wine',
  'Wine',
  'Champagne',
  'Cider',
  'Cocktail',
  'Liquor',
  'Sambuca',
  'Cognac',
  'Whiskey',
  'Vodka',
  'Rum',
  'Gin',
  'Tequila',
  'Brandy',
  'Sake',
  'Other',
] as const

export type AlcoholType = (typeof ALCOHOL_TYPES)[number]

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
  alcohol: AlcoholType
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
