import { Beer, BottleWine, GlassWater, type LucideIcon, Martini, Wine } from 'lucide-react'
import type { AlcoholType, Drink } from '@/shared/api/diary'
import styles from './DrinkIcon.module.css'

type Size = 'sm' | 'md' | 'lg'

interface Props {
  alcohol?: AlcoholType
  empty?: boolean
  size?: Size
  stack?: Drink[]
}

interface IconConfig {
  color: string
  Icon: LucideIcon
}

const EMPTY_ICON: IconConfig = { Icon: GlassWater, color: '#9AABB8' }

const ICONS: Record<AlcoholType, IconConfig> = {
  Beer: { Icon: Beer, color: '#C17D11' },
  'Red wine': { Icon: Wine, color: '#9F1239' },
  'White wine': { Icon: Wine, color: '#D4A72C' },
  Wine: { Icon: Wine, color: '#7F1D1D' },
  Champagne: { Icon: BottleWine, color: '#C9A227' },
  Cider: { Icon: Beer, color: '#D97706' },
  Cocktail: { Icon: Martini, color: '#DB2777' },
  Liquor: { Icon: BottleWine, color: '#7C3AED' },
  Sambuca: { Icon: BottleWine, color: '#6D28D9' },
  Cognac: { Icon: GlassWater, color: '#B45309' },
  Whiskey: { Icon: GlassWater, color: '#A16207' },
  Vodka: { Icon: GlassWater, color: '#0284C7' },
  Rum: { Icon: GlassWater, color: '#92400E' },
  Gin: { Icon: Martini, color: '#0F766E' },
  Tequila: { Icon: GlassWater, color: '#65A30D' },
  Brandy: { Icon: GlassWater, color: '#9A3412' },
  Sake: { Icon: GlassWater, color: '#64748B' },
  Other: { Icon: GlassWater, color: '#64748B' },
}

const SIZES: Record<Size, number> = { sm: 28, md: 40, lg: 56 }

export function DrinkIcon({ alcohol, empty, size = 'md', stack }: Props) {
  if (stack) {
    const shown = [...new Map(stack.map((drink) => [drink.alcohol, drink])).values()].slice(0, 3)

    if (shown.length === 1) {
      return <SingleIcon alcohol={shown[0].alcohol} size={size} />
    }

    if (shown.length > 1) {
      return (
        <span className={styles.stack}>
          {shown.map((d, i) => (
            <span key={d.id} className={styles.stackItem} style={{ zIndex: shown.length - i }}>
              <SingleIcon alcohol={d.alcohol} size={size} />
            </span>
          ))}
        </span>
      )
    }
  }

  if (empty || !alcohol) {
    return <SingleIcon empty size={size} />
  }
  return <SingleIcon alcohol={alcohol} size={size} />
}

function SingleIcon({
  alcohol,
  empty,
  size = 'md',
}: {
  alcohol?: AlcoholType
  empty?: boolean
  size?: Size
}) {
  const px = SIZES[size]
  const { Icon, color } = empty || !alcohol ? EMPTY_ICON : ICONS[alcohol]

  return <Icon size={px} color={color} strokeWidth={1.75} aria-hidden />
}
