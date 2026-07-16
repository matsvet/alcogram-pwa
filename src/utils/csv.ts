import type { Drink, ImportMode, ImportResult, ImportRow } from '../types'
import {
  bulkPutDrinks,
  clearAllDrinks,
  drinkMergeKey,
  getAllDrinks,
} from '../db'
import { parseNumber, toMl } from './units'

function uuid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `d-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

/** Minimal CSV parser: handles quotes and commas inside quotes */
export function parseCsv(text: string): Record<string, string>[] {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter((l) => l.trim())
  if (lines.length < 2) return []

  const headers = splitCsvLine(lines[0]).map((h) => h.trim())
  const rows: Record<string, string>[] = []

  for (let i = 1; i < lines.length; i++) {
    const cells = splitCsvLine(lines[i])
    if (cells.every((c) => !c.trim())) continue
    const row: Record<string, string> = {}
    headers.forEach((h, idx) => {
      row[h] = cells[idx] ?? ''
    })
    rows.push(row)
  }
  return rows
}

function splitCsvLine(line: string): string[] {
  const out: string[] = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        cur += ch
      }
    } else if (ch === '"') {
      inQuotes = true
    } else if (ch === ',') {
      out.push(cur)
      cur = ''
    } else {
      cur += ch
    }
  }
  out.push(cur)
  return out
}

export function parseImportFile(text: string, filename: string): ImportRow[] {
  const lower = filename.toLowerCase()
  if (lower.endsWith('.json')) {
    const data = JSON.parse(text) as unknown
    if (Array.isArray(data)) return data as ImportRow[]
    if (data && typeof data === 'object' && Array.isArray((data as { drinks?: unknown }).drinks)) {
      return (data as { drinks: ImportRow[] }).drinks
    }
    throw new Error('JSON must be an array of drink rows')
  }
  // Default: CSV
  return parseCsv(text) as ImportRow[]
}

export function importRowToDrink(row: ImportRow, now: number): Drink | null {
  const date =
    (row.calendar_date && String(row.calendar_date).trim()) ||
    buildDate(row.year, row.month, row.day)
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null

  const alcohol = String(row.alcohol ?? '').trim()
  const amount = parseNumber(row.amount)
  // Skip empty cards
  if (!alcohol && amount == null) return null

  const unit = String(row.unit ?? 'ml').trim() || 'ml'
  const amountVal = amount ?? 0
  const abv = parseNumber(row.abv)
  const price = parseNumber(row.price)
  const drinkIndex = parseNumber(row.drink_index) ?? 1

  return {
    id: uuid(),
    date,
    drinkIndex,
    alcohol: alcohol || (row.preview ? String(row.preview).slice(0, 40) : 'Other'),
    amount: amountVal,
    unit,
    amountMl: toMl(amountVal, unit),
    abv,
    price,
    currency: String(row.currency ?? '₽').trim() || '₽',
    notes: String(row.notes ?? '').trim(),
    createdAt: now,
    updatedAt: now,
    source: 'import',
    deleted: false,
  }
}

function buildDate(
  y: unknown,
  m: unknown,
  d: unknown,
): string | null {
  const year = parseNumber(y)
  const month = parseNumber(m)
  const day = parseNumber(d)
  if (year == null || month == null || day == null) return null
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export async function importDrinks(
  rows: ImportRow[],
  mode: ImportMode,
): Promise<ImportResult> {
  const now = Date.now()
  const parsed: Drink[] = []
  let invalid = 0

  for (const row of rows) {
    const drink = importRowToDrink(row, now)
    if (!drink) {
      invalid++
      continue
    }
    parsed.push(drink)
  }

  if (mode === 'replace') {
    // Soft-delete local so cloud sync can propagate removals
    await clearAllDrinks()
    await bulkPutDrinks(parsed)
    return {
      added: parsed.length,
      skipped: 0,
      invalid,
      total: rows.length,
    }
  }

  // merge
  const existing = await getAllDrinks()
  const keys = new Set(existing.map(drinkMergeKey))
  const toAdd: Drink[] = []
  let skipped = 0
  for (const d of parsed) {
    const k = drinkMergeKey(d)
    if (keys.has(k)) {
      skipped++
      continue
    }
    keys.add(k)
    toAdd.push(d)
  }
  if (toAdd.length) await bulkPutDrinks(toAdd)
  return {
    added: toAdd.length,
    skipped,
    invalid,
    total: rows.length,
  }
}

export function drinksToCsv(drinks: Drink[]): string {
  const headers = [
    'calendar_date',
    'year',
    'month',
    'day',
    'drink_index',
    'alcohol',
    'amount',
    'unit',
    'abv',
    'price',
    'currency',
    'notes',
  ]
  const lines = [headers.join(',')]
  const sorted = [...drinks].sort((a, b) =>
    a.date === b.date ? a.drinkIndex - b.drinkIndex : a.date.localeCompare(b.date),
  )
  for (const d of sorted) {
    const [y, m, day] = d.date.split('-')
    const cells = [
      d.date,
      y,
      m,
      day,
      String(d.drinkIndex),
      csvEscape(d.alcohol),
      String(d.amount),
      csvEscape(d.unit),
      d.abv == null ? '' : String(d.abv),
      d.price == null ? '' : String(d.price),
      csvEscape(d.currency),
      csvEscape(d.notes),
    ]
    lines.push(cells.join(','))
  }
  return lines.join('\n')
}

function csvEscape(s: string): string {
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

export function createManualDrink(partial: {
  date: string
  alcohol: string
  amount: number
  unit: string
  abv: number | null
  price: number | null
  currency: string
  notes: string
  drinkIndex: number
}): Drink {
  const now = Date.now()
  return {
    id: uuid(),
    date: partial.date,
    drinkIndex: partial.drinkIndex,
    alcohol: partial.alcohol,
    amount: partial.amount,
    unit: partial.unit,
    amountMl: toMl(partial.amount, partial.unit),
    abv: partial.abv,
    price: partial.price,
    currency: partial.currency,
    notes: partial.notes,
    createdAt: now,
    updatedAt: now,
    source: 'manual',
    deleted: false,
  }
}
