import type { AlcoholType, Drink } from '@/shared/api/diary'
import styles from './DrinkIcon.module.css'

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
    return (
      <svg width={px} height={px} viewBox="0 0 40 48" aria-hidden>
        <title>Пустой бокал</title>
        <path
          d="M12 6h16l-1.5 28a6 6 0 0 1-6 5.5h-1a6 6 0 0 1-6-5.5L12 6z"
          fill="none"
          stroke="#9AABB8"
          strokeWidth="1.6"
        />
        <path d="M11 6h18" stroke="#9AABB8" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    )
  }

  if (k === 'beer') {
    return (
      <svg width={px} height={px} viewBox="0 0 40 48" aria-hidden>
        <title>Пиво</title>
        <path
          d="M10 8h16l-1 30a7 7 0 0 1-7 6.5h0a7 7 0 0 1-7-6.5L10 8z"
          fill="#F5C842"
          stroke="#5B7C99"
          strokeWidth="1.4"
        />
        <path d="M12 8c1 3 2 4 6 4s5-1 6-4" fill="#FFF8E0" opacity="0.7" />
        <path
          d="M26 14h4a4 4 0 0 1 4 4v8a4 4 0 0 1-4 4h-3.5"
          fill="none"
          stroke="#5B7C99"
          strokeWidth="1.4"
        />
        <path d="M9 8h18" stroke="#5B7C99" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    )
  }

  if (k === 'wine') {
    return (
      <svg width={px} height={px} viewBox="0 0 40 48" aria-hidden>
        <title>Вино</title>
        <path
          d="M12 6h16c0 8-4 14-8 16v12h4v3H16v-3h4V22c-4-2-8-8-8-16z"
          fill="none"
          stroke="#5B7C99"
          strokeWidth="1.5"
        />
        <path d="M14 10h12c-0.5 6-3.5 10-6 11.5C17.5 20 14.5 16 14 10z" fill="#C0392B" />
      </svg>
    )
  }

  // spirit / shot
  return (
    <svg width={px} height={px} viewBox="0 0 40 48" aria-hidden>
      <title>Крепкий алкоголь</title>
      <path
        d="M14 8h12l-2 28a5 5 0 0 1-5 4.5h0a5 5 0 0 1-5-4.5L14 8z"
        fill="#E8E0D0"
        stroke="#5B7C99"
        strokeWidth="1.4"
      />
      <path d="M16 22h8v12a3 3 0 0 1-3 2.5h-2A3 3 0 0 1 16 34V22z" fill="#D4C4A8" opacity="0.8" />
      <path d="M13 8h14" stroke="#5B7C99" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}
