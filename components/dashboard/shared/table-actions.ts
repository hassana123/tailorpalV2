export type TableActionVariant = 'default' | 'destructive' | 'outline'

export interface TableAction {
  label: string
  onClick: () => void
  variant?: TableActionVariant
}

