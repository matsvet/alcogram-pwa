import type { Drink } from './types'
import { bulkPutDrinks, clearAllDrinks, countDrinks } from './db'

const SEED_FLAG = 'alcogram_seed_v1'
/** Respect Vite base (e.g. /alcogram-pwa/ on GitHub Pages) */
const SEED_URL = `${import.meta.env.BASE_URL}seed/alcogram_seed.json`

export type SeedStatus =
  | { state: 'idle' }
  | { state: 'loading' }
  | { state: 'done'; count: number; mode: 'auto' | 'force' }
  | { state: 'skipped'; reason: string }
  | { state: 'error'; message: string }

/** Auto-import bundled real export when IndexedDB is empty. */
export async function ensureSeeded(): Promise<SeedStatus> {
  const count = await countDrinks()
  if (count > 0) {
    return { state: 'skipped', reason: `already ${count} records` }
  }
  return loadSeed('auto')
}

/** Force reload seed (replace all). */
export async function forceReseed(): Promise<SeedStatus> {
  return loadSeed('force')
}

async function loadSeed(mode: 'auto' | 'force'): Promise<SeedStatus> {
  try {
    const res = await fetch(SEED_URL)
    if (!res.ok) {
      return { state: 'error', message: `seed HTTP ${res.status}` }
    }
    const drinks = (await res.json()) as Drink[]
    if (!Array.isArray(drinks) || drinks.length === 0) {
      return { state: 'error', message: 'seed empty or invalid' }
    }
    if (mode === 'force') {
      // Soft-delete so cloud sync can drop old rows on other devices
      await clearAllDrinks()
    }
    const normalized = drinks.map((d) => ({
      ...d,
      deleted: d.deleted ?? false,
    }))
    await bulkPutDrinks(normalized)
    localStorage.setItem(SEED_FLAG, 'done')
    return { state: 'done', count: drinks.length, mode }
  } catch (e) {
    return {
      state: 'error',
      message: e instanceof Error ? e.message : String(e),
    }
  }
}
