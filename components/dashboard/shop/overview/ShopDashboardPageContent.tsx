'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { formatCompactNaira, formatNaira, formatRelativeDate } from '@/lib/utils/format'
import {
  Users,
  ShoppingCart,
  Package,
  UserCheck,
  TrendingUp,
  Mic2,
  Ruler,
  ArrowUpRight,
  RefreshCw,
  Loader2,
  AlertCircle,
  BarChart3,
  Settings,
  Sparkles,
  Calendar,
  Plus,
  Workflow,
} from 'lucide-react'

interface Shop {
  id: string
  name: string
  description: string | null
  owner_id: string
}

interface DashboardStats {
  customersCount: number
  ordersCount: number
  activeOrdersCount: number
  staffCount: number
  totalRevenue: number
}

interface QuickAccess {
  customers: boolean
  orders: boolean
  catalog: boolean
  inventory: boolean
  measurements: boolean
  voiceAssistant: boolean
  settings: boolean
}

interface RecentOrder {
  id: string
  order_number: string
  design_description: string | null
  total_price: number | null
  status: string
  estimated_delivery_date: string | null
  customers: { first_name: string; last_name: string | null } | null
}

const NO_ACCESS: QuickAccess = {
  customers: false,
  orders: false,
  catalog: false,
  inventory: false,
  measurements: false,
  voiceAssistant: false,
  settings: false,
}

// ─── Stat Card ─────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  subtext,
  Icon,
  iconColor,
}: {
  label: string
  value: number | string
  subtext?: string
  Icon: React.ElementType
  iconColor: string
}) {
  return (
    <div className="bg-white rounded-3xl border border-brand-border p-5 flex flex-col justify-between hover:shadow-card-hover transition-all duration-200">
      <div className="flex items-start justify-between">
        <span className="text-[10px] font-bold text-brand-stone uppercase tracking-[0.2em]">{label}</span>
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${iconColor}`}>
          <Icon size={18} />
        </div>
      </div>
      <div className="mt-3">
        <p className="font-display text-2xl lg:text-3xl text-brand-ink truncate">{value}</p>
        {subtext && <p className="text-xs text-brand-stone mt-1">{subtext}</p>}
      </div>
    </div>
  )
}

export function ShopDashboardPageContent() {
  const params = useParams()
  const shopId = params.shopId as string
  const [shop, setShop] = useState<Shop | null>(null)
  const [stats, setStats] = useState<DashboardStats>({
    customersCount: 0,
    ordersCount: 0,
    activeOrdersCount: 0,
    staffCount: 0,
    totalRevenue: 0,
  })
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [quickAccess, setQuickAccess] = useState<QuickAccess>(NO_ACCESS)

  const load = async (silent = false) => {
    if (!silent) setIsLoading(true)
    else setRefreshing(true)
    try {
      const supabase = createClient()
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) throw new Error('Please sign in again')

      const { data: shopData, error: shopError } = await supabase
        .from('shops')
        .select('id, name, description, owner_id')
        .eq('id', shopId)
        .single()
      if (shopError || !shopData) throw new Error('Shop not found')
      setShop(shopData as Shop)

      const isOwner = shopData.owner_id === user.id
      if (isOwner) {
        setQuickAccess({
          customers: true,
          orders: true,
          catalog: true,
          inventory: true,
          measurements: true,
          voiceAssistant: true,
          settings: true,
        })
      } else {
        const { data: memberships } = await supabase
          .from('shop_staff')
          .select('id')
          .eq('shop_id', shopId)
          .eq('user_id', user.id)
          .eq('status', 'active')

        const staffIds = (memberships ?? []).map((row) => row.id)
        if (!staffIds.length) {
          setQuickAccess(NO_ACCESS)
        } else {
          const { data: permissionRows } = await supabase
            .from('shop_staff_permissions')
            .select(
              'can_manage_customers, can_manage_orders, can_manage_measurements, can_manage_catalog, can_manage_inventory'
            )
            .in('staff_id', staffIds)

          const merged = (permissionRows ?? []).reduce(
            (acc, row) => ({
              customers: acc.customers || Boolean(row.can_manage_customers),
              orders: acc.orders || Boolean(row.can_manage_orders),
              catalog: acc.catalog || Boolean(row.can_manage_catalog),
              inventory: acc.inventory || Boolean(row.can_manage_inventory),
              measurements: acc.measurements || Boolean(row.can_manage_measurements),
            }),
            {
              customers: false,
              orders: false,
              catalog: false,
              inventory: false,
              measurements: false,
            }
          )

          const hasOperationalAccess =
            merged.customers ||
            merged.orders ||
            merged.catalog ||
            merged.inventory ||
            merged.measurements

          setQuickAccess({
            ...merged,
            voiceAssistant: hasOperationalAccess,
            settings: false,
          })
        }
      }

      // Parallel data fetching including revenue & recent orders
      const [c, o, a, s, orderRows, recentRows] = await Promise.all([
        supabase.from('customers').select('*', { count: 'exact', head: true }).eq('shop_id', shopId),
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('shop_id', shopId),
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('shop_id', shopId).in('status', ['pending', 'in_progress']),
        supabase.from('shop_staff').select('*', { count: 'exact', head: true }).eq('shop_id', shopId).eq('status', 'active'),
        supabase.from('orders').select('total_price').eq('shop_id', shopId),
        supabase
          .from('orders')
          .select('id, order_number, design_description, total_price, status, estimated_delivery_date, customers(first_name, last_name)')
          .eq('shop_id', shopId)
          .order('created_at', { ascending: false })
          .limit(4),
      ])

      const totalRevenue = (orderRows.data ?? []).reduce(
        (sum, row) => sum + (row.total_price || 0),
        0
      )

      setStats({
        customersCount: c.count || 0,
        ordersCount: o.count || 0,
        activeOrdersCount: a.count || 0,
        staffCount: (s.count || 0) + 1, // Include owner
        totalRevenue,
      })

      const normalizedRecent = ((recentRows.data ?? []) as unknown as RecentOrder[]).map((r) => {
        const custRel = r.customers
        const cust = Array.isArray(custRel) ? custRel[0] ?? null : custRel
        return { ...r, customers: cust }
      })
      setRecentOrders(normalizedRecent)
    } catch (err) {
      setQuickAccess(NO_ACCESS)
      setError(err instanceof Error ? err.message : 'Failed to load dashboard')
    } finally {
      setIsLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    load()
  }, [shopId])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <div className="text-center">
          <Loader2 size={32} className="text-brand-gold animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-brand-ink">Loading Atelier Studio...</p>
        </div>
      </div>
    )
  }

  if (error || !shop) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh] p-6">
        <div className="text-center max-w-sm">
          <AlertCircle size={36} className="text-red-400 mx-auto mb-4" />
          <h3 className="font-display text-xl text-brand-ink mb-2">Couldn&apos;t load dashboard</h3>
          <p className="text-sm text-brand-stone mb-5">{error || 'Shop not found'}</p>
          <button
            onClick={() => load()}
            className="h-10 px-6 rounded-xl bg-brand-ink text-white text-sm font-semibold hover:bg-brand-charcoal transition-all"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  const completionRate =
    stats.ordersCount > 0
      ? Math.round(((stats.ordersCount - stats.activeOrdersCount) / stats.ordersCount) * 100)
      : 0

  return (
    <div className="p-4 lg:p-6 xl:p-8 space-y-6">
      {/* ── Luxury Atelier Banner ─────────────────────────────────────────────── */}
      <div className="relative rounded-3xl overflow-hidden bg-brand-ink px-6 lg:px-9 py-6 lg:py-8 shadow-brand">
        <div
          className="absolute inset-0 opacity-25"
          style={{
            background: 'radial-gradient(ellipse 65% 85% at 85% 40%, #D97B2B 0%, transparent 60%)',
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-brand-gold-light text-xs font-bold uppercase tracking-wider mb-2 border border-white/10">
              <Sparkles size={11} />
              <span>Bespoke Fashion Studio</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl text-white truncate">
              {shop.name}
            </h1>
            <p className="text-white/65 text-xs sm:text-sm mt-1 max-w-xl">
              {shop.description || 'Welcome back. Manage your bespoke commissions, measurements, and production flow.'}
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-shrink-0">
            <button
              onClick={() => load(true)}
              disabled={refreshing}
              className="h-10 px-4 rounded-xl bg-white/10 text-white text-xs font-semibold border border-white/15 hover:bg-white/20 transition-all flex items-center gap-2"
            >
              <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            {quickAccess.settings && (
              <Link href={`/dashboard/shop/${shopId}/settings`}>
                <button className="h-10 px-4 rounded-xl bg-brand-gold text-white text-xs font-bold hover:bg-[#c06d22] transition-all shadow-gold flex items-center gap-2">
                  <Settings size={13} />
                  <span>Settings</span>
                </button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ── Quick Action Dock for Busy Tailors ────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-brand-border p-4 shadow-sm">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-[11px] font-bold uppercase tracking-wider text-brand-stone pl-2 pr-1 hidden md:inline">
            Quick Actions:
          </span>

          <Link
            href={`/dashboard/shop/${shopId}/orders`}
            className="h-10 px-4 rounded-2xl bg-brand-ink text-white text-xs font-bold hover:bg-brand-charcoal transition-all flex items-center gap-2 shadow-sm whitespace-nowrap flex-shrink-0"
          >
            <Plus size={14} className="text-brand-gold-light" />
            <span>New Order</span>
          </Link>

          <Link
            href={`/dashboard/shop/${shopId}/customers`}
            className="h-10 px-4 rounded-2xl bg-brand-cream border border-brand-border text-brand-ink hover:bg-white text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap flex-shrink-0"
          >
            <Users size={14} className="text-brand-gold" />
            <span>Add Client</span>
          </Link>

          <Link
            href={`/dashboard/shop/${shopId}/measurements`}
            className="h-10 px-4 rounded-2xl bg-brand-cream border border-brand-border text-brand-ink hover:bg-white text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap flex-shrink-0"
          >
            <Ruler size={14} className="text-brand-gold" />
            <span>Take Measurements</span>
          </Link>

          <Link
            href={`/dashboard/shop/${shopId}/planner`}
            className="h-10 px-4 rounded-2xl bg-brand-cream border border-brand-border text-brand-ink hover:bg-white text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap flex-shrink-0"
          >
            <Workflow size={14} className="text-brand-gold" />
            <span>Floor Board</span>
          </Link>

          <Link
            href={`/dashboard/shop/${shopId}/voice-assistant`}
            className="h-10 px-4 rounded-2xl bg-orange-50 border border-orange-200 text-brand-gold hover:bg-orange-100 text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap flex-shrink-0 ml-auto"
          >
            <Mic2 size={14} />
            <span>Voice Assistant</span>
          </Link>
        </div>
      </div>

      {/* ── Stat Cards ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 lg:gap-4">
        <StatCard
          label="Total Clients"
          value={stats.customersCount}
          subtext={`${stats.customersCount} recorded in studio`}
          Icon={Users}
          iconColor="bg-sky-50 text-sky-600"
        />
        <StatCard
          label="In Production"
          value={stats.activeOrdersCount}
          subtext={`${completionRate}% completion rate`}
          Icon={Package}
          iconColor="bg-amber-50 text-amber-600"
        />
        <StatCard
          label="Order Value (₦)"
          value={formatCompactNaira(stats.totalRevenue)}
          subtext="Total booked revenue"
          Icon={ShoppingCart}
          iconColor="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          label="Atelier Team"
          value={stats.staffCount}
          subtext={`${stats.staffCount} active production ${stats.staffCount === 1 ? 'maker' : 'makers'}`}
          Icon={UserCheck}
          iconColor="bg-violet-50 text-violet-600"
        />
      </div>

      {/* ── Middle: Recent Orders & Pipeline ─────────────────────────────────── */}
      <div className="grid lg:grid-cols-3 gap-5">
        {/* Recent Commissions — 2 Cols */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-brand-border p-5 lg:p-7 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-brand-border mb-4">
            <div>
              <p className="text-[10px] font-bold text-brand-gold uppercase tracking-[0.2em]">Recent Commissions</p>
              <h3 className="font-display text-xl text-brand-ink mt-0.5">Active Bespoke Orders</h3>
            </div>
            <Link
              href={`/dashboard/shop/${shopId}/orders`}
              className="text-xs font-bold text-brand-gold hover:underline flex items-center gap-1"
            >
              View All <ArrowUpRight size={13} />
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="py-12 text-center">
              <Package size={28} className="text-brand-border mx-auto mb-2" />
              <p className="text-sm font-semibold text-brand-ink">No orders booked yet</p>
              <p className="text-xs text-brand-stone mt-1">Create your first commission to start tracking.</p>
            </div>
          ) : (
            <div className="divide-y divide-brand-border">
              {recentOrders.map((order) => {
                const customerName = [order.customers?.first_name, order.customers?.last_name]
                  .filter(Boolean)
                  .join(' ') || 'Client'
                const relativeDue = formatRelativeDate(order.estimated_delivery_date)

                return (
                  <div key={order.id} className="py-3.5 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-brand-ink truncate">{customerName}</span>
                        <span className="text-xs text-brand-stone font-mono">#{order.order_number}</span>
                      </div>
                      <p className="text-xs text-brand-charcoal truncate mt-0.5">
                        {order.design_description || 'Custom Garment'}
                      </p>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-sm text-brand-ink">{formatNaira(order.total_price)}</p>
                      <p
                        className={`text-[10px] font-semibold mt-0.5 ${
                          relativeDue.isUrgent ? 'text-brand-gold' : 'text-brand-stone'
                        }`}
                      >
                        {order.estimated_delivery_date ? relativeDue.text : 'No due date'}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Studio Pipeline & Capacity — 1 Col */}
        <div className="bg-white rounded-3xl border border-brand-border p-5 lg:p-7 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 size={18} className="text-brand-gold" />
              <h3 className="font-display text-xl text-brand-ink">Production Stage Pulse</h3>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-medium text-brand-stone">Sewing & In Progress</span>
                  <span className="font-bold text-brand-ink">{stats.activeOrdersCount}</span>
                </div>
                <div className="h-2.5 rounded-full bg-brand-cream overflow-hidden">
                  <div
                    className="h-full bg-brand-gold rounded-full transition-all duration-700"
                    style={{
                      width: `${stats.ordersCount > 0 ? (stats.activeOrdersCount / stats.ordersCount) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-medium text-brand-stone">Completed & Ready</span>
                  <span className="font-bold text-emerald-700">
                    {stats.ordersCount - stats.activeOrdersCount}
                  </span>
                </div>
                <div className="h-2.5 rounded-full bg-brand-cream overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                    style={{
                      width: `${
                        stats.ordersCount > 0
                          ? ((stats.ordersCount - stats.activeOrdersCount) / stats.ordersCount) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 rounded-2xl bg-brand-cream border border-brand-border">
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-stone flex items-center gap-1 mb-1">
                <Calendar size={11} className="text-brand-gold" />
                Production Velocity
              </span>
              <p className="text-xs text-brand-charcoal leading-relaxed">
                Your workshop is currently operating at{' '}
                <strong className="text-brand-ink">{completionRate}%</strong> completed output across all orders.
              </p>
            </div>
          </div>

          <div className="pt-5 border-t border-brand-border mt-5 flex items-center justify-between text-xs text-brand-stone">
            <span className="flex items-center gap-1.5 font-medium">
              <TrendingUp size={12} className="text-emerald-600" />
              Live atelier stats
            </span>
            <Link href={`/dashboard/shop/${shopId}/planner`} className="font-bold text-brand-ink hover:underline">
              Open Floor Board →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
