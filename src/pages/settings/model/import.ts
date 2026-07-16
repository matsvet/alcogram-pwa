import type { AlcoholType } from '@/shared/api/diary'

export interface ImportRow {
  calendar_date?: string
  year?: number | string
  month?: number | string
  day?: number | string
  month_name?: string
  date_label?: string
  drink_index?: number | string
  alcohol?: AlcoholType
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
