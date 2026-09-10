'use client'

import { CheckCircle2, Clock3, ShoppingBag, Sparkles } from 'lucide-react'
import { formatCompactNaira } from '@/lib/utils/format'

interface OrdersStatsGridProps {
  totalOrders: number
  activeOrders: number
  completedOrders: number
  pendingCatalogRequests: number
  totalRevenue?: number
}

export function OrdersStatsGrid({
  totalOrders,
  activeOrders,
  completedOrders,
  pendingCatalogRequests,
  totalRevenue,
}: OrdersStatsGridProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
      {/* Total Orders Card */}
      <div className="bg-white rounded-2xl border border-brand-border p-4 lg:p-5 flex flex-col justify-between hover:shadow-card-hover transition-all duration-200">
        <div className="flex items-start justify-between">
          <span className="text-[10px] font-bold text-brand-stone uppercase tracking-[0.2em]">Total Orders</span>
          <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
            <ShoppingBag size={17} />
          </div>
        </div>
        <div className="mt-2">
          <p className="font-display text-2xl lg:text-3xl text-brand-ink">{totalOrders}</p>
          <p className="text-[11px] text-brand-stone mt-1">Booked in atelier</p>
        </div>
      </div>

      {/* In Production Card */}
      <div className="bg-white rounded-2xl border border-brand-border p-4 lg:p-5 flex flex-col justify-between hover:shadow-card-hover transition-all duration-200">
        <div className="flex items-start justify-between">
          <span className="text-[10px] font-bold text-brand-stone uppercase tracking-[0.2em]">In Production</span>
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock3 size={17} />
          </div>
        </div>
        <div className="mt-2">
          <p className="font-display text-2xl lg:text-3xl text-brand-ink">{activeOrders}</p>
          <p className="text-[11px] text-amber-700 font-medium mt-1">Cutting, sewing & fitting</p>
        </div>
      </div>

      {/* Completed / Ready Card */}
      <div className="bg-white rounded-2xl border border-brand-border p-4 lg:p-5 flex flex-col justify-between hover:shadow-card-hover transition-all duration-200">
        <div className="flex items-start justify-between">
          <span className="text-[10px] font-bold text-brand-stone uppercase tracking-[0.2em]">Completed</span>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 size={17} />
          </div>
        </div>
        <div className="mt-2">
          <p className="font-display text-2xl lg:text-3xl text-brand-ink">{completedOrders}</p>
          <p className="text-[11px] text-emerald-700 font-medium mt-1">Ready or delivered</p>
        </div>
      </div>

      {/* Revenue or Inquiries Card */}
      <div className="bg-white rounded-2xl border border-brand-border p-4 lg:p-5 flex flex-col justify-between hover:shadow-card-hover transition-all duration-200">
        <div className="flex items-start justify-between">
          <span className="text-[10px] font-bold text-brand-stone uppercase tracking-[0.2em]">
            {totalRevenue !== undefined ? 'Order Value' : 'Inquiries'}
          </span>
          <div className="w-9 h-9 rounded-xl bg-orange-50 text-brand-gold flex items-center justify-center">
            <Sparkles size={17} />
          </div>
        </div>
        <div className="mt-2">
          <p className="font-display text-2xl lg:text-3xl text-brand-ink">
            {totalRevenue !== undefined ? formatCompactNaira(totalRevenue) : pendingCatalogRequests}
          </p>
          <p className="text-[11px] text-brand-stone mt-1">
            {totalRevenue !== undefined ? 'Active order pipeline' : 'Pending requests'}
          </p>
        </div>
      </div>
    </div>
  )
}
