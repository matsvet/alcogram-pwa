export type DrinkSource = 'import' | 'manual'

/** Explicit "did not drink" mark for a calendar day */
export interface SoberDay {
  date: string // YYYY-MM-DD
  createdAt: number
  updatedAt: number
  source: 'manual' | 'auto'
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

/** Raw row from Alcogram CSV / JSON export */
export interface ImportRow {
  calendar_date?: string
  year?: number | string
  month?: number | string
  day?: number | string
  month_name?: string
  date_label?: string
  drink_index?: number | string
  alcohol?: string
  amount?: number | string
  unit?: string
  abv?: number | string
  price?: number | string
  currency?: string
  notes?: string
  preview?: string
}

export type ImportMode = 'merge' | 'replace'

export interface ImportResult {
  added: number
  skipped: number
  invalid: number
  total: number
}

export type TabId = 'stats' | 'calendar' | 'settings'

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

export const UNITS = ['ml', 'l', 'oz', 'cl'] as const

export const CURRENCIES = ['₽', '$', '€', '£'] as const
