'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  Users,
  ShoppingCart,
  Package,
  Boxes,
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
} from 'lucide-react'

interface Shop {
  id: string
  name: string
  description: string | null
  owner_id: string
}

interface DashboardStats {
  customersCount:   number
  ordersCount:      number
  activeOrdersCount: number
  staffCount:       number
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

const NO_ACCESS: QuickAccess = {
  customers: false,
  orders: false,
  catalog: false,
  inventory: false,
  measurements: false,
  voiceAssistant: false,
  settings: false,
}

// ─── Stat Card (top row — matches reference "overview cards") ──────────────
function StatCard({
  label,
  value,
  Icon,
  bullets,
  iconColor,
}: {
  label: string
  value: number | string
  Icon: React.ElementType
  bullets?: { color: string; text: string }[]
  iconColor: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-brand-border p-4 lg:p-5 flex flex-col gap-3 hover:shadow-card-hover transition-all duration-200">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-[10px] font-bold text-brand-stone uppercase tracking-[0.2em] mb-1 lg:mb-2">{label}</p>
          <p className="font-display text-2xl lg:text-4xl text-brand-ink truncate">{value}</p>
        </div>
        <div className={`w-9 h-9 lg:w-10 lg:h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconColor}`}>
          <Icon size={16} className="lg:w-[18px] lg:h-[18px]" />
        </div>
      </div>
      {bullets && (
        <div className="flex flex-wrap gap-x-3 lg:gap-x-4 gap-y-1">
          {bullets.map((b) => (
            <span key={b.text} className="flex items-center gap-1.5 text-[10px] lg:text-xs text-brand-stone">
              <span className={`w-1.5 h-1.5 rounded-full ${b.color}`} />
              {b.text}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Service row item ─────────────────────────────────────────────────────
function ServiceItem({
  Icon,
  label,
  total,
  rate,
  rateLabel,
  rateColor,
  href,
}: {
  Icon: React.ElementType
  label: string
  total: number
  rate: string
  rateLabel: string
  rateColor: string
  href: string
}) {
  return (
    <Link
      href={href}
      className="flex-1 flex items-center gap-3 lg:gap-4 px-4 lg:px-5 py-3 lg:py-3.5 hover:bg-brand-cream transition-colors group min-w-0"
    >
      <div className="w-7 h-7 lg:w-8 lg:h-8 rounded-lg bg-brand-cream border border-brand-border flex items-center justify-center text-brand-stone group-hover:bg-brand-ink group-hover:text-white group-hover:border-brand-ink transition-all flex-shrink-0">
        <Icon size={14} className="lg:w-[15px] lg:h-[15px]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs lg:text-sm font-semibold text-brand-ink truncate">{label}</p>
        <p className="text-[10px] lg:text-xs text-brand-stone">{total} Total</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className={`text-xs lg:text-sm font-bold ${rateColor}`}>{rate}</p>
        <p className="text-[9px] lg:text-[10px] text-brand-stone uppercase tracking-wider">{rateLabel}</p>
      </div>
    </Link>
  )
}

// ─── Quick action button ──────────────────────────────────────────────────
function QuickAction({
  Icon,
  label,
  href,
  variant = 'default',
}: {
  Icon: React.ElementType
  label: string
  href: string
  variant?: 'default' | 'outline'
}) {
  return (
    <Link href={href}>
      <button
        className={`w-full h-10 lg:h-11 px-4 lg:px-5 rounded-xl text-xs lg:text-sm font-semibold flex items-center gap-2 mb-2 transition-all duration-200 ${
          variant === 'outline'
            ? 'border border-brand-border text-brand-charcoal hover:bg-white hover:border-brand-ink/20 hover:text-brand-ink'
            : 'bg-brand-ink text-white hover:bg-brand-charcoal shadow-brand'
        }`}
      >
        <Icon size={14} className="lg:w-[15px] lg:h-[15px]" />
        <span className="truncate">{label}</span>
        <ArrowUpRight size={12} className="ml-auto opacity-60 flex-shrink-0" />
      </button>
    </Link>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────
export function ShopDashboardPageContent() {
  const params = useParams()
  const shopId = params.shopId as string
  const [shop, setShop]     = useState<Shop | null>(null)
  const [stats, setStats]   = useState<DashboardStats>({ customersCount: 0, ordersCount: 0, activeOrdersCount: 0, staffCount: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError]   = useState<string | null>(null)
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
        .from('shops').select('id, name, description, owner_id').eq('id', shopId).single()
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
              'can_manage_customers, can_manage_orders, can_manage_measurements, can_manage_catalog, can_manage_inventory',
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
            },
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

      const [c, o, a, s] = await Promise.all([
        supabase.from('customers').select('*', { count: 'exact', head: true }).eq('shop_id', shopId),
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('shop_id', shopId),
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('shop_id', shopId).in('status', ['pending', 'in_progress']),
        supabase.from('shop_staff').select('*', { count: 'exact', head: true }).eq('shop_id', shopId).eq('status', 'active'),
      ])
      setStats({ customersCount: c.count || 0, ordersCount: o.count || 0, activeOrdersCount: a.count || 0, staffCount: s.count || 0 })
    } catch (err) {
      setQuickAccess(NO_ACCESS)
      setError(err instanceof Error ? err.message : 'Failed to load dashboard')
    } finally {
      setIsLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { load() }, [shopId])

  // ── Loading ──
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <div className="text-center">
          <Loader2 size={32} className="text-brand-stone animate-spin mx-auto mb-3" />
          <p className="text-sm text-brand-stone">Loading dashboard…</p>
        </div>
      </div>
    )
  }

  // ── Error ──
  if (error || !shop) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh] p-6">
        <div className="text-center max-w-sm">
          <AlertCircle size={36} className="text-red-400 mx-auto mb-4" />
          <h3 className="font-display text-xl text-brand-ink mb-2">Couldn't load dashboard</h3>
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

  const completionRate = stats.ordersCount > 0
    ? Math.round(((stats.ordersCount - stats.activeOrdersCount) / stats.ordersCount) * 100)
    : 0

  return (
    <div className="p-4 lg:p-6 xl:p-8 space-y-4 lg:space-y-6">

      {/* ── Hero banner ─────────────────────────────────────────────── */}
      <div className="relative rounded-2xl overflow-hidden bg-brand-ink px-5 lg:px-8 py-5 lg:py-7 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Background warmth */}
        <div className="absolute inset-0 opacity-20"
          style={{ background: 'radial-gradient(ellipse 60% 80% at 80% 50%, rgba(217,123,43,0.35) 0%, transparent 70%)' }} />
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }} />

        <div className="relative min-w-0">
          <h1 className="font-display text-xl lg:text-3xl text-white mb-1 truncate">{shop.name}</h1>
          <p className="text-white/55 text-xs lg:text-sm">
            {shop.description || 'Shop workspace overview and performance.'}
          </p>
        </div>

        <div className="relative flex items-center gap-2 lg:gap-3 flex-shrink-0">
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            className="h-8 lg:h-9 px-3 lg:px-4 rounded-xl bg-white/10 text-white text-xs lg:text-sm font-medium border border-white/15 hover:bg-white/18 transition-all flex items-center gap-2"
          >
            <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          {quickAccess.settings && (
            <Link href={`/dashboard/shop/${shopId}/settings`}>
              <button className="h-8 lg:h-9 px-3 lg:px-4 rounded-xl bg-brand-gold text-white text-xs lg:text-sm font-semibold hover:bg-[#c06d22] transition-all shadow-gold flex items-center gap-2">
                <Settings size={12} />
                <span className="hidden sm:inline">Settings</span>
              </button>
            </Link>
          )}
        </div>
      </div>

      {/* ── Stat cards ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <StatCard
          label="Customers"
          value={stats.customersCount}
          Icon={Users}
          iconColor="bg-sky-100 text-sky-600"
          bullets={[
            { color: 'bg-emerald-400', text: `${stats.customersCount} Total` },
            { color: 'bg-brand-gold',  text: 'Active'                       },
          ]}
        />
        <StatCard
          label="Total Orders"
          value={stats.ordersCount}
          Icon={ShoppingCart}
          iconColor="bg-violet-100 text-violet-600"
          bullets={[
            { color: 'bg-emerald-400', text: `${stats.ordersCount - stats.activeOrdersCount} Complete` },
            { color: 'bg-amber-400',   text: `${stats.activeOrdersCount} In Progress`                 },
          ]}
        />
        <StatCard
          label="Active Orders"
          value={stats.activeOrdersCount}
          Icon={Package}
          iconColor="bg-amber-100 text-amber-600"
          bullets={[
            { color: 'bg-amber-400', text: `${completionRate}% Completion Rate` },
          ]}
        />
        <StatCard
          label="Staff Members"
          value={stats.staffCount}
          Icon={UserCheck}
          iconColor="bg-emerald-100 text-emerald-600"
          bullets={[
            { color: 'bg-emerald-400', text: `${stats.staffCount} Active` },
          ]}
        />
      </div>

      {/* ── Service overview strip ───────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-brand-border overflow-hidden">
        <div className="divide-y divide-brand-border">
          <div className="flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x divide-brand-border">
            {quickAccess.customers && (
              <ServiceItem
                Icon={Users}
                label="Customer Service"
                total={stats.customersCount}
                rate={`${stats.customersCount}`}
                rateLabel="Total Customers"
                rateColor="text-sky-600"
                href={`/dashboard/shop/${shopId}/customers`}
              />
            )}
            {quickAccess.orders && (
              <ServiceItem
                Icon={ShoppingCart}
                label="Order Service"
                total={stats.ordersCount}
                rate={`${completionRate}%`}
                rateLabel="Completion Rate"
                rateColor={completionRate >= 80 ? 'text-emerald-600' : 'text-amber-600'}
                href={`/dashboard/shop/${shopId}/orders`}
              />
            )}
            {quickAccess.voiceAssistant && (
              <ServiceItem
                Icon={Mic2}
                label="Voice Assistant"
                total={0}
                rate="Active"
                rateLabel="Status"
                rateColor="text-brand-gold"
                href={`/dashboard/shop/${shopId}/voice-assistant`}
              />
            )}
            {!quickAccess.customers && !quickAccess.orders && !quickAccess.voiceAssistant && (
              <div className="px-5 py-4 text-xs text-brand-stone">
                Service shortcuts are hidden until access is granted by the shop owner.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Bottom: Chart placeholder + Quick actions ─────────────── */}
      <div className="grid lg:grid-cols-3 gap-4 lg:gap-5">

        {/* Chart / activity area — 2 cols */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-brand-border p-4 lg:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 lg:mb-5 gap-3">
            <div>
              <p className="text-[10px] font-bold text-brand-stone uppercase tracking-[0.2em] mb-1">Overview</p>
              <h3 className="font-display text-lg lg:text-xl text-brand-ink">Order Analysis</h3>
              <p className="text-xs text-brand-stone">Volume and status distribution</p>
            </div>
            <div className="flex items-center gap-2">
              <select className="h-8 pl-3 pr-8 rounded-lg border border-brand-border text-xs font-medium text-brand-charcoal bg-brand-cream focus:outline-none appearance-none">
                <option>This Month</option>
                <option>Last Month</option>
                <option>This Year</option>
              </select>
            </div>
          </div>

          {/* Simple visual bars */}
          {stats.ordersCount === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 lg:h-40 text-center">
              <BarChart3 size={28} className="lg:w-[32px] lg:h-[32px] text-brand-border mb-3" />
              <p className="text-sm text-brand-stone">No order data yet.</p>
              <p className="text-xs text-brand-stone/70 mt-1">Start taking orders to see analytics here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {[
                { label: 'Completed',    count: stats.ordersCount - stats.activeOrdersCount, color: 'bg-emerald-400' },
                { label: 'In Progress',  count: stats.activeOrdersCount,                     color: 'bg-amber-400'   },
                { label: 'Total Orders', count: stats.ordersCount,                            color: 'bg-brand-ink'   },
              ].map((row) => (
                <div key={row.label}>
                  <div className="flex justify-between text-xs text-brand-stone mb-1.5">
                    <span className="font-medium">{row.label}</span>
                    <span className="font-bold text-brand-ink">{row.count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-brand-cream overflow-hidden">
                    <div
                      className={`h-full rounded-full ${row.color} transition-all duration-700`}
                      style={{ width: `${stats.ordersCount > 0 ? (row.count / stats.ordersCount) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          <p className="text-[10px] text-brand-stone/55 mt-4 lg:mt-5 flex items-center gap-1.5">
            <TrendingUp size={10} />
            Data synchronised with live orders
          </p>
        </div>

        {/* Quick actions — 1 col */}
        <div className="bg-white rounded-2xl border border-brand-border p-4 lg:p-6">
          <div className="mb-4 lg:mb-5">
            <p className="text-[10px] font-bold text-brand-stone uppercase tracking-[0.2em] mb-1">Shortcuts</p>
            <h3 className="font-display text-lg lg:text-xl text-brand-ink">Quick Actions</h3>
          </div>
          <div className="">
            {quickAccess.customers && (
              <QuickAction Icon={Users} label="Manage Customers" href={`/dashboard/shop/${shopId}/customers`} />
            )}
            {quickAccess.orders && (
              <QuickAction Icon={ShoppingCart} label="View Orders" href={`/dashboard/shop/${shopId}/orders`} />
            )}
            {quickAccess.catalog && (
              <QuickAction Icon={Package} label="Manage Catalog" href={`/dashboard/shop/${shopId}/catalog`} />
            )}
            {quickAccess.inventory && (
              <QuickAction Icon={Boxes} label="Manage Inventory" href={`/dashboard/shop/${shopId}/inventory`} />
            )}
            {quickAccess.measurements && (
              <QuickAction Icon={Ruler} label="Measurements" href={`/dashboard/shop/${shopId}/measurements`} />
            )}
            {quickAccess.voiceAssistant && (
              <QuickAction Icon={Mic2} label="Voice Assistant" href={`/dashboard/shop/${shopId}/voice-assistant`} />
            )}
            {quickAccess.settings && (
              <QuickAction Icon={Settings} label="Shop Settings" href={`/dashboard/shop/${shopId}/settings`} variant="outline" />
            )}
            {!Object.values(quickAccess).some(Boolean) && (
              <p className="text-xs text-brand-stone">No shortcuts available for your current access.</p>
            )}
          </div>
        </div>
      </div>

    </div>
  )
}
