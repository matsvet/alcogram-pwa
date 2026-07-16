interface Props {
  size: number
}

export function WineDrinkIcon({ size }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 48" aria-hidden>
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
