'use client'

import { CheckCircle2, Clock, Loader2, MessageCircle } from 'lucide-react'
import { normalizeCatalogRequestStatus } from '@/lib/catalog-request-status'
import type { CatalogRequest } from '@/app/dashboard/customer/my-requests/types'

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string
  value: number
  icon: React.ElementType
  color: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-brand-border p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-[10px] font-bold text-brand-stone uppercase tracking-wider">{label}</p>
        <p className="font-display text-2xl text-brand-ink">{value}</p>
      </div>
    </div>
  )
}

export function RequestsStatsGrid({ requests }: { requests: CatalogRequest[] }) {
  const pending = requests.filter((request) => normalizeCatalogRequestStatus(request.status) === 'pending').length
  const contacted = requests.filter((request) => normalizeCatalogRequestStatus(request.status) === 'contacted').length
  const inProgress = requests.filter((request) => {
    const normalizedStatus = normalizeCatalogRequestStatus(request.status)
    if (normalizedStatus === 'accepted') return true
    if (!request.order) return false
    return ['pending', 'in_progress', 'completed'].includes(request.order.status)
  }).length
  const completed = requests.filter((request) => {
    const normalizedStatus = normalizeCatalogRequestStatus(request.status)
    return normalizedStatus === 'converted' || request.order?.status === 'delivered'
  }).length

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
      <StatCard label="Pending" value={pending} icon={Clock} color="bg-amber-100 text-amber-600" />
      <StatCard label="Contacted" value={contacted} icon={MessageCircle} color="bg-sky-100 text-sky-600" />
      <StatCard label="In Progress" value={inProgress} icon={Loader2} color="bg-blue-100 text-blue-600" />
      <StatCard label="Completed" value={completed} icon={CheckCircle2} color="bg-emerald-100 text-emerald-600" />
    </div>
  )
}
