import type { AlcoholType, Drink } from '@/shared/api/diary'
import { toMl } from '@/shared/lib/volume'

export const UNITS = ['ml', 'l', 'oz', 'cl'] as const
export const CURRENCIES = ['₽', '$', '€', '£'] as const

export const DEFAULT_ABV_BY_ALCOHOL: Partial<Record<AlcoholType, number>> = {
  Beer: 4.5,
  'Red wine': 11.5,
  'White wine': 11.5,
  Wine: 11.5,
  Champagne: 11.5,
  Cider: 4.5,
  Cocktail: 7,
  Liquor: 25,
  Sambuca: 40,
  Cognac: 40,
  Whiskey: 40,
  Vodka: 40,
  Rum: 40,
  Gin: 40,
  Tequila: 40,
  Brandy: 40,
  Sake: 15,
}

export function createManualDrink(
  partial: Omit<Drink, 'id' | 'amountMl' | 'createdAt' | 'updatedAt' | 'source' | 'deleted'>,
): Drink {
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
