import { Users, Mail, Phone, User } from 'lucide-react'
import { StatCard } from '@/components/dashboard/staff/StatCard'
import { Customer } from '@/app/dashboard/shop/[shopId]/customers/types'

interface StatsGridProps {
  customers: Customer[]
}

export function StatsGrid({ customers }: StatsGridProps) {
  const now = new Date()
  const thisMonthCount = customers.filter((c) => {
    const date = new Date(c.created_at)
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
  }).length

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
      <StatCard
        label="Total Customers"
        value={customers.length}
        icon={Users}
        color="bg-sky-100 text-sky-600"
      />
      <StatCard
        label="With Email"
        value={customers.filter((c) => c.email).length}
        icon={Mail}
        color="bg-violet-100 text-violet-600"
      />
      <StatCard
        label="With Phone"
        value={customers.filter((c) => c.phone).length}
        icon={Phone}
        color="bg-emerald-100 text-emerald-600"
      />
      <StatCard
        label="This Month"
        value={thisMonthCount}
        icon={User}
        color="bg-amber-100 text-amber-600"
      />
    </div>
  )
}
