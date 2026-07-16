/** Convert volume to milliliters */
export function toMl(amount: number, unit: string): number {
  const u = unit.trim().toLowerCase()
  if (u === 'ml' || u === 'мл') return amount
  if (u === 'l' || u === 'л' || u === 'liter' || u === 'litre') return amount * 1000
  if (u === 'cl' || u === 'сл') return amount * 10
  if (u === 'oz' || u === 'fl oz' || u === 'floz') return amount * 29.5735
  // Unknown: treat as ml
  return amount
}

/** Pure ethanol volume in ml; null if abv unknown */
export function ethanolMl(amountMl: number, abv: number | null): number | null {
  if (abv == null || Number.isNaN(abv)) return null
  return (amountMl * abv) / 100
}

/** Pretty volume for UI (prefer l if >= 100ml and divisible nicely) */
export function formatVolume(amount: number, unit: string): string {
  const u = unit.trim().toLowerCase()
  if (u === 'l' || u === 'л') {
    return `${trimNum(amount)}l`
  }
  if ((u === 'ml' || u === 'мл') && amount >= 1000) {
    return `${trimNum(amount / 1000)}l`
  }
  if (u === 'ml' || u === 'мл') {
    return `${trimNum(amount)}ml`
  }
  return `${trimNum(amount)}${unit}`
}

export function formatPrice(price: number | null, currency: string): string {
  if (price == null || Number.isNaN(price)) return ''
  return `${trimNum(price)} ${currency}`.trim()
}

function trimNum(n: number): string {
  if (Number.isInteger(n)) return String(n)
  return String(Math.round(n * 1000) / 1000)
}

export function parseNumber(v: unknown): number | null {
  if (v == null || v === '') return null
  if (typeof v === 'number') return Number.isFinite(v) ? v : null
  const s = String(v).replace(',', '.').replace(/\s/g, '').replace('°', '')
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}
