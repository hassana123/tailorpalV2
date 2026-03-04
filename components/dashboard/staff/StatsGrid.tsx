import { Users, Mail } from 'lucide-react'
import { StatCard } from './StatCard'
import { StaffMember } from '../../../app/dashboard/shop/[shopId]/staff/types'

interface StatsGridProps {
  staff: StaffMember[]
  invitations: { status: string }[]
}

export function StatsGrid({ staff, invitations }: StatsGridProps) {
  const activeStaff = staff.filter((s) => s.status === 'active').length
  const pendingStaff = staff.filter((s) => s.status === 'pending').length
  const pendingInvitations = invitations.filter((i) => i.status === 'pending').length

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
      <StatCard label="Total Staff" value={staff.length} icon={Users} color="bg-sky-100 text-sky-600" />
      <StatCard label="Active" value={activeStaff} icon={Users} color="bg-emerald-100 text-emerald-600" />
      <StatCard label="Pending" value={pendingStaff} icon={Users} color="bg-amber-100 text-amber-600" />
      <StatCard label="Open Invitations" value={pendingInvitations} icon={Mail} color="bg-violet-100 text-violet-600" />
    </div>
  )
}
