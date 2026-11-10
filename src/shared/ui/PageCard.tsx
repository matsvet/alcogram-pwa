import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
  className?: string
}

export function PageCard({ children, className = '' }: Props) {
  return (
    <div
      className={`min-h-[calc(100vh-100px)] rounded-card bg-card px-3 pt-4 pb-5 shadow-card ${className}`}
    >
      {children}
    </div>
  )
}
