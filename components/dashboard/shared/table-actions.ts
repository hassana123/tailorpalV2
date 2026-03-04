export type TableActionVariant = 'default' | 'destructive' | 'outline' | 'success'

export interface TableAction {
  label: string
  onClick: () => void
  variant?: TableActionVariant
}

