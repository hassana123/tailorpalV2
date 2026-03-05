export type CatalogRequestStatus =
  | 'pending'
  | 'contacted'
  | 'accepted'
  | 'converted'
  | 'rejected'
  | 'cancelled'
  | 'unknown'

const STATUS_ALIASES: Record<string, CatalogRequestStatus> = {
  pending: 'pending',
  contacted: 'contacted',
  accepted: 'accepted',
  converted: 'converted',
  rejected: 'rejected',
  cancelled: 'cancelled',
  canceled: 'cancelled',
}

export function normalizeCatalogRequestStatus(
  status: string | null | undefined,
): CatalogRequestStatus {
  if (!status) return 'unknown'

  const normalized = status.toLowerCase().trim()
  return STATUS_ALIASES[normalized] ?? 'unknown'
}

export function isCatalogRequestClosed(
  status: string | null | undefined,
): boolean {
  const normalized = normalizeCatalogRequestStatus(status)
  return (
    normalized === 'converted' ||
    normalized === 'rejected' ||
    normalized === 'cancelled'
  )
}
