interface Props {
  size: number
}

export function EmptyDrinkIcon({ size }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 48" aria-hidden>
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
