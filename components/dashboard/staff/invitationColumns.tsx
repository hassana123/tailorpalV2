import { Mail } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PendingInvitation } from '../../../app/dashboard/shop/[shopId]/staff/types'

// ─── Invitation Table Columns ─────────────────────────────────────────────

interface UseInvitationColumnsProps {
  sharingInviteId: string | null
  deletingInviteId: string | null
  onRefreshInvitation: (invitationId: string, mode: 'supabase_email' | 'manual_link') => void
  onDeleteInvitation: (invitationId: string) => void
}

export function useInvitationColumns({
  sharingInviteId,
  deletingInviteId,
  onRefreshInvitation,
  onDeleteInvitation,
}: UseInvitationColumnsProps) {
  const columns = [
    {
      key: 'email',
      header: 'Email',
      cell: (inv: PendingInvitation) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-brand-gold/10 flex items-center justify-center flex-shrink-0">
            <Mail size={16} className="text-brand-gold" />
          </div>
          <div>
            <p className="font-semibold text-brand-ink">{inv.email}</p>
            <p className="text-xs text-brand-stone">{new Date(inv.created_at).toLocaleDateString()}</p>
          </div>
        </div>
      ),
      sortable: true,
      accessor: (inv: PendingInvitation) => inv.email,
    },
    {
      key: 'status',
      header: 'Status',
      cell: (inv: PendingInvitation) => (
        <span className={cn(
          'text-xs font-semibold px-2.5 py-1 rounded-full',
          inv.status === 'accepted' ? 'bg-emerald-100 text-emerald-700' :
          inv.status === 'pending'  ? 'bg-amber-100 text-amber-700'     :
          inv.status === 'expired'  ? 'bg-red-100 text-red-700'         :
                                      'bg-gray-100 text-gray-700'
        )}>
          {inv.status}
        </span>
      ),
    },
    {
      key: 'expires',
      header: 'Expires',
      cell: (inv: PendingInvitation) => (
        <span className="text-xs text-brand-stone">
          {inv.expires_at ? new Date(inv.expires_at).toLocaleDateString() : 'N/A'}
        </span>
      ),
      hiddenOnMobile: true,
    },
    {
      key: 'code',
      header: 'Code',
      cell: (inv: PendingInvitation) => (
        inv.invite_code
          ? <span className="font-mono text-xs font-bold text-brand-charcoal tracking-wider">{inv.invite_code}</span>
          : <span className="text-xs text-brand-stone/50">—</span>
      ),
      hiddenOnMobile: true,
    },
  ]

  const actions = (inv: PendingInvitation) => [
    ...(inv.status === 'pending'
      ? [
          {
            label: sharingInviteId === inv.id ? 'Refreshing...' : 'Refresh Link',
            onClick: () => onRefreshInvitation(inv.id, 'manual_link'),
            variant: 'default' as const,
          },
          {
            label: sharingInviteId === inv.id ? 'Sending...' : 'Resend Email',
            onClick: () => onRefreshInvitation(inv.id, 'supabase_email'),
            variant: 'outline' as const,
          },
        ]
      : []),
    {
      label: deletingInviteId === inv.id ? 'Deleting...' : 'Delete Invite',
      onClick: () => onDeleteInvitation(inv.id),
      variant: 'destructive' as const,
    },
  ]

  return { columns, actions }
}
