'use client'

import { CheckCircle2, Loader2, ShoppingCart, Tag } from 'lucide-react'

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

interface OrdersStatsGridProps {
  totalOrders: number
  activeOrders: number
  completedOrders: number
  pendingCatalogRequests: number
}

export function OrdersStatsGrid({
  totalOrders,
  activeOrders,
  completedOrders,
  pendingCatalogRequests,
}: OrdersStatsGridProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
      <StatCard label="Total Orders" value={totalOrders} icon={ShoppingCart} color="bg-sky-100 text-sky-600" />
      <StatCard label="Active" value={activeOrders} icon={Loader2} color="bg-blue-100 text-blue-600" />
      <StatCard label="Completed" value={completedOrders} icon={CheckCircle2} color="bg-emerald-100 text-emerald-600" />
      <StatCard label="Catalog Requests" value={pendingCatalogRequests} icon={Tag} color="bg-amber-100 text-amber-600" />
    </div>
  )
}
