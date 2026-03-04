import { Clock, UserCheck, UserX } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PERMISSION_KEYS, StaffMember, StaffPermissions } from '../../../app/dashboard/shop/[shopId]/staff/types'

// ─── Staff Table Columns ──────────────────────────────────────────────────

interface UseStaffColumnsProps {
  getPermissionState: (staffId: string) => StaffPermissions
  deletingStaffId: string | null
  onManagePermissions: (staff: StaffMember) => void
  onRemoveStaff: (staffId: string) => void
  onDeleteStaffRecord: (staffId: string) => void
}

export function useStaffColumns({
  getPermissionState,
  deletingStaffId,
  onManagePermissions,
  onRemoveStaff,
  onDeleteStaffRecord,
}: UseStaffColumnsProps) {
  const columns = [
    {
      key: 'member',
      header: 'Staff Member',
      cell: (m: StaffMember) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-brand-ink/10 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-brand-ink">{m.email[0].toUpperCase()}</span>
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-brand-ink truncate">{m.email}</p>
            <p className="text-xs text-brand-stone">
              Invited {new Date(m.invited_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      ),
      sortable: true,
      accessor: (m: StaffMember) => m.email,
    },
    {
      key: 'status',
      header: 'Status',
      cell: (m: StaffMember) => (
        <span className={cn(
          'inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full',
          m.status === 'active'  ? 'bg-emerald-100 text-emerald-700' :
          m.status === 'pending' ? 'bg-amber-100 text-amber-700'    :
                                   'bg-red-100 text-red-700'
        )}>
          {m.status === 'active'  ? <UserCheck size={11} /> :
           m.status === 'pending' ? <Clock size={11} />     :
                                    <UserX size={11} />      }
          {m.status}
        </span>
      ),
      hiddenOnMobile: true,
    },
    {
      key: 'permissions',
      header: 'Permissions',
      cell: (m: StaffMember) => {
        const perms = getPermissionState(m.id)
        const count = PERMISSION_KEYS.filter(({ key }) => perms[key]).length
        return (
          <span className="text-xs text-brand-stone font-medium">
            {count === 0 ? 'None set' : `${count} of ${PERMISSION_KEYS.length} enabled`}
          </span>
        )
      },
      hiddenOnMobile: true,
    },
  ]

  const actions = (m: StaffMember) => [
    {
      label: 'Manage Permissions',
      onClick: () => onManagePermissions(m),
      variant: 'default' as const,
    },
    {
      label: deletingStaffId === m.id ? 'Working...' : 'Remove Access',
      onClick: () => onRemoveStaff(m.id),
      variant: 'destructive' as const,
    },
    ...(m.status === 'revoked'
      ? [
          {
            label: deletingStaffId === m.id ? 'Deleting...' : 'Delete Record',
            onClick: () => onDeleteStaffRecord(m.id),
            variant: 'destructive' as const,
          },
        ]
      : []),
  ]

  return { columns, actions }
}
