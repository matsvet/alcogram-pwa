interface Props {
  size: number
}

export function SpiritDrinkIcon({ size }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 48" aria-hidden>
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
