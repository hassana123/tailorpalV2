'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Loader2,
  Sparkles,
  Users,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { ProductionIntelligencePanel } from '@/components/dashboard/shop/planner/ProductionIntelligencePanel'

type Order = {
  id: string
  order_number: string
  design_description: string | null
  status: 'pending' | 'in_progress' | 'completed' | 'delivered' | 'cancelled'
  estimated_delivery_date: string | null
  customers: { first_name: string; last_name: string | null } | null
}
type Task = { id:string; order_id:string; title:string; status:'todo'|'in_progress'|'done'; estimated_minutes:number|null; due_date:string|null; priority:number|null; production_stages:{name:string}|null }

const daysUntil = (date: string | null) => {
  if (!date) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.ceil(
    (new Date(`${date}T00:00:00`).getTime() - today.getTime()) / 86400000,
  )
}

const customerName = (order: Order) =>
  [order.customers?.first_name, order.customers?.last_name]
    .filter(Boolean)
    .join(' ') || 'Customer'

export function ProductionPlannerPageContent() {
  const { shopId } = useParams<{ shopId: string }>()
  const [orders, setOrders] = useState<Order[]>([])
  const [staffCount, setStaffCount] = useState(1)
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const supabase = createClient()
        const [orderResult, staffResult, taskResult] = await Promise.all([
          supabase
            .from('orders')
            .select(
              'id, order_number, design_description, status, estimated_delivery_date, customers(first_name, last_name)',
            )
            .eq('shop_id', shopId)
            .in('status', ['pending', 'in_progress'])
            .order('estimated_delivery_date', { ascending: true, nullsFirst: false }),
          supabase
            .from('shop_staff')
            .select('*', { count: 'exact', head: true })
            .eq('shop_id', shopId)
            .eq('status', 'active'),
          supabase.from('production_tasks').select('id,order_id,title,status,estimated_minutes,due_date,priority,production_stages(name)').eq('shop_id',shopId).order('priority',{ascending:false}),
        ])

        setOrders((orderResult.data ?? []) as unknown as Order[])
        setStaffCount(Math.max(1, (staffResult.count ?? 0) + 1))
        setTasks((taskResult.data ?? []) as unknown as Task[])
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [shopId])

  const plan = useMemo(() => {
    const scheduled = orders
      .filter((o) => o.estimated_delivery_date)
      .map((o) => ({
        ...o,
        taskList: tasks.filter((task) => task.order_id === o.id),
        remaining: tasks.filter((task) => task.order_id === o.id && task.status !== 'done').reduce((sum, task) => sum + (task.estimated_minutes || 60), 0) / 60,
        progress: (() => { const list=tasks.filter((task)=>task.order_id===o.id); return list.length ? Math.round((list.filter((task)=>task.status==='done').length/list.length)*100) : 0 })(),
        days: daysUntil(o.estimated_delivery_date) ?? 99,
      }))
      .sort((a, b) => a.days - b.days)

    const unplanned = orders.filter((o) => !o.estimated_delivery_date)
    const workHours = scheduled.reduce((total, o) => total + o.remaining, 0)
    const weekCapacity = staffCount * 8 * 5
    const risky = scheduled.filter(
      (o) =>
        o.days < 0 ||
        o.remaining > Math.max(0, o.days + 1) * staffCount * 8,
    )

    return { scheduled, unplanned, workHours, weekCapacity, risky }
  }, [orders, staffCount, tasks])

  if (loading) {
    return (
      <div className="min-h-[60vh] grid place-items-center">
        <Loader2 className="animate-spin text-brand-gold h-8 w-8" />
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6 lg:space-y-8">
      {/* Atelier Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-brand-ink p-6 lg:p-9 text-white shadow-sm">
        <div
          className="absolute inset-0 opacity-25 pointer-events-none"
          style={{
            background:
              'radial-gradient(circle at 85% 20%, #D97B2B 0%, transparent 40%)',
          }}
        />
        <div className="relative flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-brand-gold-light text-xs font-bold uppercase tracking-[0.2em] mb-3">
              <Sparkles size={13} />
              TailorPal Intelligence
            </div>
            <h1 className="font-display text-3xl lg:text-5xl text-white">
              Your production plan, made clear.
            </h1>
            <p className="text-white/70 mt-2 max-w-xl text-sm leading-relaxed">
              This page tells you which customer order to work on next. It follows the tasks you create in Production Workflow—when a task is completed there, its progress updates here.
            </p>
          </div>
          <Link
            href={`/dashboard/shop/${shopId}/orders`}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-white text-brand-ink px-5 text-xs font-bold hover:bg-brand-cream transition-colors shadow-sm self-start lg:self-auto"
          >
            Manage Orders <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      {/* Production Velocity Metrics */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          Icon={Clock3}
          label="Work still to do"
          value={`${plan.workHours}h`}
          detail="Hours remaining from workshop tasks"
          tone="text-brand-gold bg-orange-50"
        />
        <MetricCard
          Icon={Users}
          label="Weekly Capacity"
          value={`${plan.weekCapacity}h`}
          detail={`${staffCount} tailor${staffCount === 1 ? '' : 's'} × 40h standard week`}
          tone="text-sky-600 bg-sky-50"
        />
        <MetricCard
          Icon={AlertTriangle}
          label="Deadline Risk"
          value={String(plan.risky.length)}
          detail={
            plan.risky.length
              ? `${plan.risky.length} order${plan.risky.length === 1 ? '' : 's'} require urgent cutting/sewing`
              : 'All commissions on track for delivery'
          }
          tone={
            plan.risky.length
              ? 'text-red-600 bg-red-50'
              : 'text-emerald-600 bg-emerald-50'
          }
        />
        <MetricCard
          Icon={CalendarDays}
          label="Needs Fitting / Date"
          value={String(plan.unplanned.length)}
          detail="Set target delivery dates to plan"
          tone="text-violet-600 bg-violet-50"
        />
      </div>

      {/* Main Schedule & Capacity Insight */}
      <div className="grid xl:grid-cols-3 gap-6">
        {/* Scheduled Focus List */}
        <section className="xl:col-span-2 rounded-2xl border border-brand-border bg-white overflow-hidden shadow-xs">
          <div className="p-5 lg:p-6 border-b border-brand-border flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold text-brand-gold uppercase tracking-[0.2em]">
                Today&apos;s Priority Queue
              </p>
              <h2 className="font-display text-2xl text-brand-ink mt-1">
                Work in Deadline Order
              </h2>
            </div>
            <Sparkles size={20} className="text-brand-gold flex-shrink-0" />
          </div>

          {plan.scheduled.length ? (
            <div className="divide-y divide-brand-border">
              {plan.scheduled.map((order, index) => {
                const risk = plan.risky.some((item) => item.id === order.id)
                return (
                  <div
                    key={order.id}
                    className="p-4 lg:px-6 flex items-center gap-4 hover:bg-brand-cream/20 transition-colors"
                  >
                    <span className="w-8 h-8 rounded-xl bg-brand-cream border border-brand-border/60 text-brand-ink grid place-items-center text-xs font-bold flex-shrink-0">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm text-brand-ink truncate">
                        {customerName(order)} · {order.design_description || order.order_number}
                      </p>
                      <p className="text-xs text-brand-stone mt-0.5">
                        <span className="font-mono text-brand-charcoal">{order.order_number}</span>
                        {' · '}
                        <span>{order.remaining.toFixed(1)}h left · {order.progress}% complete</span>
                        {' · '}
                        <span>{order.taskList.find((task) => task.status === 'in_progress')?.production_stages?.name || order.taskList.find((task) => task.status !== 'done')?.production_stages?.name || 'Set up workflow tasks'}</span>
                      </p>
                    </div>
                    <RiskBadge days={order.days} risk={risk} />
                  </div>
                )
              })}
            </div>
          ) : (
            <EmptyState shopId={shopId} />
          )}
        </section>

        {/* Capacity Insight Aside */}
        <aside className="rounded-2xl border border-brand-border bg-brand-cream/60 p-5 lg:p-6 flex flex-col justify-between shadow-xs">
          <div>
            <p className="text-[10px] font-bold text-brand-gold uppercase tracking-[0.2em]">
              Capacity Insight
            </p>
            <h2 className="font-display text-2xl text-brand-ink mt-1">
              {plan.risky.length ? 'Deadlines Need Attention' : 'Atelier On Schedule'}
            </h2>
            <p className="text-xs text-brand-stone mt-2 leading-relaxed">
              {plan.risky.length
                ? `You have ${plan.risky.length} order${plan.risky.length === 1 ? '' : 's'} where the remaining task time does not fit before the promised date.`
                : 'All dated active commissions fit comfortably within your weekly atelier production capacity.'}
            </p>

            {/* Load bar */}
            <div className="mt-5 p-4 rounded-xl bg-white border border-brand-border shadow-xs">
              <div className="flex justify-between text-xs mb-2">
                <span className="text-brand-stone font-medium">Weekly Workshop Load</span>
                <span className="font-bold text-brand-ink">
                  {plan.workHours}h / {plan.weekCapacity}h
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-brand-cream overflow-hidden border border-brand-border/40">
                <div
                  className="h-full bg-brand-gold rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(
                      100,
                      plan.weekCapacity
                        ? (plan.workHours / plan.weekCapacity) * 100
                        : 0,
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-brand-border/60">
            <p className="text-[11px] leading-relaxed text-brand-stone">
              How it works: create and assign tasks in Production Workflow, then start/complete them as work happens. This page groups those tasks by customer deadline so you know what to do first.
            </p>
          </div>
        </aside>
      </div>

      <ProductionIntelligencePanel shopId={shopId} weeklyCapacity={plan.weekCapacity} plannedHours={plan.workHours} />
    </div>
  )
}

function MetricCard({
  Icon,
  label,
  value,
  detail,
  tone,
}: {
  Icon: typeof Clock3
  label: string
  value: string
  detail: string
  tone: string
}) {
  return (
    <div className="rounded-2xl border border-brand-border bg-white p-5 shadow-xs">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-stone">
            {label}
          </p>
          <p className="font-display text-3xl text-brand-ink mt-1.5">{value}</p>
        </div>
        <span className={`p-2.5 rounded-xl ${tone}`}>
          <Icon size={18} />
        </span>
      </div>
      <p className="text-xs text-brand-stone mt-3">{detail}</p>
    </div>
  )
}

function RiskBadge({ days, risk }: { days: number; risk: boolean }) {
  const text =
    days < 0
      ? `Overdue by ${Math.abs(days)}d`
      : days === 0
        ? 'Due today'
        : `${days}d left`

  return (
    <span
      className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold border ${
        risk
          ? 'bg-red-50 text-red-600 border-red-200'
          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
      }`}
    >
      {text}
    </span>
  )
}

function EmptyState({ shopId }: { shopId: string }) {
  return (
    <div className="p-12 text-center bg-brand-cream/10">
      <CheckCircle2 className="mx-auto text-emerald-500 mb-3 h-8 w-8" />
      <p className="font-semibold text-brand-ink">No scheduled production items</p>
      <p className="text-xs text-brand-stone mt-1 max-w-sm mx-auto">
        When you set expected completion or fitting dates on customer orders, they appear here in priority sequence.
      </p>
      <Link
        href={`/dashboard/shop/${shopId}/orders`}
        className="inline-flex items-center gap-1.5 mt-5 text-xs font-bold text-brand-gold hover:text-brand-ink transition-colors"
      >
        View Orders <ArrowRight size={13} />
      </Link>
    </div>
  )
}
