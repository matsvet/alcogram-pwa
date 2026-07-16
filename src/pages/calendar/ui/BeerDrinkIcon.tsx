interface Props {
  size: number
}

export function BeerDrinkIcon({ size }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 48" aria-hidden>
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
