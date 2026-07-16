import type { ReactNode } from 'react'
import styles from './PageCard.module.css'

interface Props {
  children: ReactNode
}

export function PageCard({ children }: Props) {
  return <div className={styles.root}>{children}</div>
}
