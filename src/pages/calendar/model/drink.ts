import type { Drink } from '@/shared/api/diary'
import { toMl } from '@/shared/lib/volume'

export const UNITS = ['ml', 'l', 'oz', 'cl'] as const
export const CURRENCIES = ['₽', '$', '€', '£'] as const

export function createManualDrink(partial: Omit<Drink, 'id' | 'amountMl' | 'createdAt' | 'updatedAt' | 'source' | 'deleted'>): Drink {
  const now = Date.now()
  return {
    ...partial,
    id: uuid(),
    amountMl: toMl(partial.amount, partial.unit),
    createdAt: now,
    updatedAt: now,
    source: 'manual',
    deleted: false,
  }
}

function uuid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `d-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}
