import type { AlcoholType, Drink } from '@/shared/api/diary'
import { BeerDrinkIcon } from './BeerDrinkIcon'
import styles from './DrinkIcon.module.css'
import { EmptyDrinkIcon } from './EmptyDrinkIcon'
import { SpiritDrinkIcon } from './SpiritDrinkIcon'
import { WineDrinkIcon } from './WineDrinkIcon'

type Size = 'sm' | 'md' | 'lg'

interface Props {
  alcohol?: AlcoholType
  empty?: boolean
  size?: Size
  stack?: Drink[]
}

type IconKind = 'beer' | 'wine' | 'spirit'

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
  const k = empty || !alcohol ? 'empty' : ICON_KIND[alcohol]
  const px = SIZES[size]

  if (k === 'empty') {
    return <EmptyDrinkIcon size={px} />
  }

  if (k === 'beer') {
    return <BeerDrinkIcon size={px} />
  }

  if (k === 'wine') {
    return <WineDrinkIcon size={px} />
  }

  return <SpiritDrinkIcon size={px} />
}
