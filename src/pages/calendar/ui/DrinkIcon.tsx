import { Beer, GlassWater, type LucideIcon, Martini, Wine } from 'lucide-react'
import type { AlcoholType, Drink } from '@/shared/api/diary'
import styles from './DrinkIcon.module.css'

type Size = 'sm' | 'md' | 'lg'

interface Props {
  alcohol?: AlcoholType
  empty?: boolean
  size?: Size
  stack?: Drink[]
}

type IconKind = 'beer' | 'empty' | 'spirit' | 'wine'

interface IconConfig {
  color: string
  Icon: LucideIcon
}

const ICONS: Record<IconKind, IconConfig> = {
  beer: { Icon: Beer, color: '#C17D11' },
  empty: { Icon: GlassWater, color: '#9AABB8' },
  spirit: { Icon: Martini, color: '#8B5CF6' },
  wine: { Icon: Wine, color: '#9F1239' },
}

const ICON_KIND: Record<AlcoholType, IconKind> = {
  Beer: 'beer',
  'Red wine': 'wine',
  'White wine': 'wine',
  Wine: 'wine',
  Champagne: 'wine',
  Cider: 'beer',
  Cocktail: 'spirit',
  Liquor: 'spirit',
  Sambuca: 'spirit',
  Cognac: 'spirit',
  Whiskey: 'spirit',
  Vodka: 'spirit',
  Rum: 'spirit',
  Gin: 'spirit',
  Tequila: 'spirit',
  Brandy: 'spirit',
  Sake: 'beer',
  Other: 'beer',
}

const SIZES: Record<Size, number> = { sm: 28, md: 40, lg: 56 }

export function DrinkIcon({ alcohol, empty, size = 'md', stack }: Props) {
  if (stack && stack.length > 1) {
    const shown = stack.slice(0, 3)
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
  const kind = empty || !alcohol ? 'empty' : ICON_KIND[alcohol]
  const px = SIZES[size]
  const { Icon, color } = ICONS[kind]

  return <Icon size={px} color={color} strokeWidth={1.75} aria-hidden />
}
