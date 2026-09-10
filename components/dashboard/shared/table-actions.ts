import type { ReactNode } from 'react'

export type TableActionVariant = 'default' | 'destructive' | 'outline' | 'success'

export interface TableAction {
  label: string
  onClick: () => void
  variant?: TableActionVariant
  icon?: ReactNode
  divider?: boolean
}

