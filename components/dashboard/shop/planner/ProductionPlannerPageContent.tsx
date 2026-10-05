'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Eye,
  Loader2,
  Phone,
  Printer,
  Ruler,
  Scissors,
  Shirt,
  Sparkles,
  TrendingUp,
  UserCheck,
  Workflow,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { ProductionIntelligencePanel } from '@/components/dashboard/shop/planner/ProductionIntelligencePanel'
import {
  PrintableJobTagModal,
  PrintableJobTagOrder,
} from '@/components/dashboard/shop/planner/PrintableJobTagModal'
import { GarmentRecipeModal } from '@/components/dashboard/shop/workflow/GarmentRecipeModal'
import { formatNaira } from '@/lib/utils/format'
import {
  createWhatsAppUrl,
  getFittingReminderMessage,
  getReadyForPickupMessage,
} from '@/lib/utils/whatsapp'

type WorkshopStageKey = 'cut' | 'sew' | 'fitting' | 'ready'

interface DesignReference {
  image_url: string
  label?: string | null
}

interface ProgressPhoto {
  image_url: string
}

interface OrderGarment {
  name: string
  quantity: number
}

interface CustomerInfo {
  first_name: string
  last_name: string | null
  phone: string | null
  email: string | null
  city?: string | null
}

interface TaskInfo {
  id: string
  order_id: string
  title: string
  status: 'todo' | 'in_progress' | 'done'
  estimated_minutes: number | null
  priority: number | null
  production_stages: { name: string } | null
}

interface RawOrder {
  id: string
  order_number: string
  design_description: string | null
  status: 'pending' | 'in_progress' | 'completed' | 'delivered' | 'cancelled'
  estimated_delivery_date: string | null
  fitting_date: string | null
  total_price: number | null
  deposit_amount: number | null
  priority: string | number | null
  customers: CustomerInfo | null
  order_design_references?: DesignReference[] | null
  order_progress_photos?: ProgressPhoto[] | null
  order_garments?: OrderGarment[] | null
}

interface ProcessedOrder extends RawOrder {
  taskList: TaskInfo[]
  remainingHours: number
  progressPct: number
  daysUntilDelivery: number | null
  currentStage: WorkshopStageKey
  humanTag: string
  thumbnailUrl: string | null
  balanceDue: number
  isStuck: boolean
}

type FilterTab =
  | 'all'
  | 'fitting_today'
  | 'needs_cutting'
  | 'express'
  | 'stuck'

type ViewMode = 'manager' | 'artisan'
type PlannerSettings = { planner_mode: 'quick' | 'pro'; work_days_per_week: number; hours_per_day: number; team_capacity: number; planner_active: boolean }

const daysUntil = (date: string | null): number | null => {
  if (!date) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.ceil(
    (new Date(`${date}T00:00:00`).getTime() - today.getTime()) / 86400000
  )
}

function determineStage(order: RawOrder, tasks: TaskInfo[]): WorkshopStageKey {
  if (order.status === 'completed' || order.status === 'delivered') {
    return 'ready'
  }

  const orderTasks = tasks.filter((t) => t.order_id === order.id)
  if (orderTasks.length > 0) {
    const activeTask =
      orderTasks.find((t) => t.status === 'in_progress') ||
      orderTasks.find((t) => t.status === 'todo')

    if (activeTask && activeTask.production_stages?.name) {
      const stageName = activeTask.production_stages.name.toLowerCase()
      if (stageName.includes('cut') || stageName.includes('pattern')) return 'cut'
      if (
        stageName.includes('sew') ||
        stageName.includes('stitch') ||
        stageName.includes('assembl') ||
        stageName.includes('embroid')
      )
        return 'sew'
      if (stageName.includes('fit')) return 'fitting'
      if (stageName.includes('finish') || stageName.includes('qual') || stageName.includes('ready'))
        return 'ready'
    }

    const doneCount = orderTasks.filter((t) => t.status === 'done').length
    if (doneCount === orderTasks.length) return 'ready'
    if (doneCount >= Math.floor(orderTasks.length * 0.75)) return 'fitting'
    if (doneCount >= 1) return 'sew'
  }

  if (order.fitting_date) {
    const days = daysUntil(order.fitting_date)
    if (days !== null && days <= 1) return 'fitting'
  }

  if (order.status === 'in_progress') return 'sew'
  return 'cut'
}

export function ProductionPlannerPageContent() {
  const { shopId } = useParams<{ shopId: string }>()
  const searchParams = useSearchParams()
  const highlightOrderId = searchParams.get('orderId') || searchParams.get('tag')

  const [orders, setOrders] = useState<RawOrder[]>([])
  const [tasks, setTasks] = useState<TaskInfo[]>([])
  const [staffCount, setStaffCount] = useState(1)
  const [shopName, setShopName] = useState('Our Atelier')
  const [loading, setLoading] = useState(true)
  const [plannerSettings, setPlannerSettings] = useState<PlannerSettings | null>(null)
  const [plannerSetup, setPlannerSetup] = useState<PlannerSettings>({ planner_mode: 'quick', work_days_per_week: 6, hours_per_day: 8, team_capacity: 1, planner_active: true })
  const [savingPlannerSetup, setSavingPlannerSetup] = useState(false)

  // Filters & Views
  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  const [viewMode, setViewMode] = useState<ViewMode>('manager')

  // Modals
  const [tagModalOrder, setTagModalOrder] = useState<PrintableJobTagOrder | null>(null)
  const [recipeModalOpen, setRecipeModalOpen] = useState(false)
  const [recipeTargetOrderId, setRecipeTargetOrderId] = useState<string | undefined>()

  const loadData = async () => {
    try {
      setLoading(true)
      const supabase = createClient()

      const [orderRes, taskRes, staffRes, shopRes, plannerRes] = await Promise.all([
        supabase
          .from('orders')
          .select(
            `id, order_number, design_description, status, estimated_delivery_date, 
             fitting_date, total_price, deposit_amount, priority,
             customers(first_name, last_name, phone, email, city),
             order_design_references(image_url, label),
             order_progress_photos(image_url),
             order_garments(name, quantity)`
          )
          .eq('shop_id', shopId)
          .in('status', ['pending', 'in_progress', 'completed'])
          .order('estimated_delivery_date', { ascending: true, nullsFirst: false }),
        supabase
          .from('production_tasks')
          .select(
            'id, order_id, title, status, estimated_minutes, priority, production_stages(name)'
          )
          .eq('shop_id', shopId)
          .order('priority', { ascending: false }),
        supabase
          .from('shop_staff')
          .select('id', { count: 'exact', head: true })
          .eq('shop_id', shopId)
          .eq('status', 'active'),
        supabase
          .from('shops')
          .select('name')
          .eq('id', shopId)
          .maybeSingle(),
        supabase.from('shop_planner_settings').select('*').eq('shop_id', shopId).maybeSingle(),
      ])

      setOrders((orderRes.data ?? []) as unknown as RawOrder[])
      setTasks((taskRes.data ?? []) as unknown as TaskInfo[])
      setStaffCount(Math.max(1, (staffRes.count ?? 0) + 1))
      if (shopRes.data?.name) {
        setShopName(shopRes.data.name)
      }
      setPlannerSettings(plannerRes.data as PlannerSettings | null)
    } catch {
      toast.error('Could not load workshop floor data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [shopId])

  // Scroll to highlighted tag if scanned from phone
  useEffect(() => {
    if (highlightOrderId && !loading) {
      setTimeout(() => {
        const el = document.getElementById(`order-card-${highlightOrderId}`)
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' })
          el.classList.add('ring-4', 'ring-brand-gold', 'animate-pulse')
          setTimeout(() => el.classList.remove('animate-pulse'), 3000)
        }
      }, 400)
    }
  }, [highlightOrderId, loading])

  // Processed orders
  const processedOrders = useMemo<ProcessedOrder[]>(() => {
    return orders.map((o) => {
      const orderTasks = tasks.filter((t) => t.order_id === o.id)
      const remainingMinutes = orderTasks
        .filter((t) => t.status !== 'done')
        .reduce((sum, t) => sum + (t.estimated_minutes || 60), 0)
      const remainingHours = Number((remainingMinutes / 60).toFixed(1))

      const doneTasks = orderTasks.filter((t) => t.status === 'done').length
      const progressPct = orderTasks.length
        ? Math.round((doneTasks / orderTasks.length) * 100)
        : o.status === 'completed'
        ? 100
        : o.status === 'in_progress'
        ? 40
        : 10

      const days = daysUntil(o.estimated_delivery_date)
      const stage = determineStage(o, tasks)

      // Human Tag: #042 — Red Lace Asoebi (Amara Okafor)
      const client = [o.customers?.first_name, o.customers?.last_name]
        .filter(Boolean)
        .join(' ') || 'Customer'
      const outfit =
        o.design_description ||
        o.order_garments?.[0]?.name ||
        'Bespoke Outfit'
      const shortNum = o.order_number.replace(/^[^\d]*/, '').slice(-3) || '001'
      const humanTag = `#${shortNum.padStart(3, '0')} — ${outfit} (${client})`

      const thumbnail =
        o.order_design_references?.[0]?.image_url ||
        o.order_progress_photos?.[0]?.image_url ||
        null

      const balanceDue =
        o.total_price !== null && o.total_price !== undefined
          ? Math.max(0, (o.total_price || 0) - (o.deposit_amount || 0))
          : 0

      const isStuck =
        (days !== null && days < 0 && stage !== 'ready') ||
        (remainingHours > Math.max(0, (days ?? 0) + 1) * staffCount * 8)

      return {
        ...o,
        taskList: orderTasks,
        remainingHours,
        progressPct,
        daysUntilDelivery: days,
        currentStage: stage,
        humanTag,
        thumbnailUrl: thumbnail,
        balanceDue,
        isStuck,
      }
    })
  }, [orders, tasks, staffCount])

  // Filtered list
  const filteredOrders = useMemo(() => {
    return processedOrders.filter((order) => {
      if (viewMode === 'artisan') {
        // Artisan view: only show orders needing physical cutting or sewing
        if (order.currentStage !== 'cut' && order.currentStage !== 'sew') {
          return false
        }
      }

      if (activeTab === 'all') return true
      if (activeTab === 'fitting_today') {
        if (order.currentStage === 'fitting') return true
        const fDays = daysUntil(order.fitting_date)
        return fDays !== null && fDays <= 0
      }
      if (activeTab === 'needs_cutting') {
        return order.currentStage === 'cut'
      }
      if (activeTab === 'express') {
        return (
          String(order.priority).toLowerCase().includes('urgent') ||
          String(order.priority).toLowerCase().includes('high') ||
          Number(order.priority) >= 1
        )
      }
      if (activeTab === 'stuck') {
        return order.isStuck
      }
      return true
    })
  }, [processedOrders, activeTab, viewMode])

  // Atelier Floor Metrics
  const floorMetrics = useMemo(() => {
    const totalOrders = processedOrders.length
    const totalRemainingHours = processedOrders
      .filter((o) => o.currentStage !== 'ready')
      .reduce((sum, o) => sum + o.remainingHours, 0)
    const weekCapacity = (plannerSettings?.team_capacity || staffCount) * Number(plannerSettings?.hours_per_day || 8) * (plannerSettings?.work_days_per_week || 6)

    // Workload Gauge: Light, Balanced, Heavy / Peak
    const loadRatio = weekCapacity > 0 ? totalRemainingHours / weekCapacity : 0
    let workloadStatus: 'Light' | 'Balanced' | 'Heavy / Peak' = 'Balanced'
    let workloadTone = 'text-amber-700 bg-amber-50 border-amber-200'
    let workloadBarColor = 'bg-brand-gold'

    if (loadRatio < 0.45) {
      workloadStatus = 'Light'
      workloadTone = 'text-emerald-700 bg-emerald-50 border-emerald-200'
      workloadBarColor = 'bg-emerald-500'
    } else if (loadRatio > 0.85) {
      workloadStatus = 'Heavy / Peak'
      workloadTone = 'text-red-700 bg-red-50 border-red-200'
      workloadBarColor = 'bg-red-500'
    }

    const todayFittings = processedOrders.filter((o) => {
      const fDays = daysUntil(o.fitting_date)
      return (fDays !== null && fDays <= 0) || o.currentStage === 'fitting'
    }).length

    const urgentDeadlines = processedOrders.filter(
      (o) => o.daysUntilDelivery !== null && o.daysUntilDelivery <= 2 && o.currentStage !== 'ready'
    ).length

    const totalUnpaidBalances = processedOrders
      .filter((o) => o.currentStage !== 'ready')
      .reduce((sum, o) => sum + o.balanceDue, 0)

    const stuckCount = processedOrders.filter((o) => o.isStuck).length

    return {
      totalOrders,
      totalRemainingHours: Math.round(totalRemainingHours),
      weekCapacity,
      workloadStatus,
      workloadTone,
      workloadBarColor,
      loadPercent: Math.min(100, Math.round(loadRatio * 100)),
      todayFittings,
      urgentDeadlines,
      totalUnpaidBalances,
      stuckCount,
    }
  }, [processedOrders, staffCount, plannerSettings])

  const activatePlanner = async () => {
    setSavingPlannerSetup(true)
    const supabase = createClient()
    const { data, error } = await supabase.from('shop_planner_settings').upsert({ shop_id: shopId, ...plannerSetup, updated_at: new Date().toISOString() }).select().single()
    setSavingPlannerSetup(false)
    if (error) { toast.error(`Could not start planner: ${error.message}`); return }
    setPlannerSettings(data as PlannerSettings)
    toast.success('Planner started. Your workshop plan now uses your working hours.')
  }

  // One-Tap Stage Advancement
  const advanceStage = async (order: ProcessedOrder, targetStage: WorkshopStageKey) => {
    try {
      const supabase = createClient()
      const stageLabels: Record<WorkshopStageKey, string> = {
        cut: '✂️ Cutting',
        sew: '🪡 Sewing',
        fitting: '👗 Fitting',
        ready: '✅ Ready for Pickup',
      }

      // 1. Update order record in Supabase
      const updatePayload: Record<string, unknown> = {}
      if (targetStage === 'cut') {
        updatePayload.status = 'pending'
      } else if (targetStage === 'sew') {
        updatePayload.status = 'in_progress'
      } else if (targetStage === 'fitting') {
        updatePayload.fitting_status = 'scheduled'
        updatePayload.status = 'in_progress'
      } else if (targetStage === 'ready') {
        updatePayload.status = 'completed'
        updatePayload.delivery_status = 'ready'
      }

      const { error: orderError } = await supabase
        .from('orders')
        .update(updatePayload)
        .eq('id', order.id)

      if (orderError) throw orderError

      // 2. Complete tasks if advancing to ready
      if (targetStage === 'ready' && order.taskList.length > 0) {
        await supabase
          .from('production_tasks')
          .update({ status: 'done', completed_at: new Date().toISOString() })
          .eq('order_id', order.id)
      }

      toast.success(`Advanced outfit to ${stageLabels[targetStage]}!`)
      void loadData()

      // Prompt for instant WhatsApp alert if entering fitting or ready
      if (targetStage === 'fitting' && order.customers?.phone) {
        promptWhatsAppFitting(order)
      } else if (targetStage === 'ready' && order.customers?.phone) {
        promptWhatsAppPickup(order)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update stage'
      toast.error(msg)
    }
  }

  // Next Stage Helper
  const handlePrimaryAction = (order: ProcessedOrder) => {
    if (order.currentStage === 'cut') {
      void advanceStage(order, 'sew')
    } else if (order.currentStage === 'sew') {
      void advanceStage(order, 'fitting')
    } else if (order.currentStage === 'fitting') {
      void advanceStage(order, 'ready')
    } else {
      toast.info('Outfit is already marked Ready for Pickup!')
    }
  }

  // WhatsApp fitting alert launcher
  const promptWhatsAppFitting = (order: ProcessedOrder) => {
    const clientName = order.customers?.first_name || 'Client'
    const msg = getFittingReminderMessage({
      customerName: clientName,
      shopName,
      orderNumber: order.order_number,
      garmentDescription: order.design_description || 'your bespoke piece',
      fittingDate: order.fitting_date || order.estimated_delivery_date,
    })
    const url = createWhatsAppUrl(order.customers?.phone, msg)
    window.open(url, '_blank')
  }

  // WhatsApp ready for pickup launcher
  const promptWhatsAppPickup = (order: ProcessedOrder) => {
    const clientName = order.customers?.first_name || 'Client'
    const msg = getReadyForPickupMessage({
      customerName: clientName,
      shopName,
      orderNumber: order.order_number,
      garmentDescription: order.design_description || 'your bespoke outfit',
      totalPrice: order.total_price,
      depositAmount: order.deposit_amount,
    })
    const url = createWhatsAppUrl(order.customers?.phone, msg)
    window.open(url, '_blank')
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] grid place-items-center">
        <Loader2 className="animate-spin text-brand-gold h-9 w-9" />
      </div>
    )
  }

  if (!plannerSettings?.planner_active) return (
    <div className="p-4 lg:p-8 max-w-2xl mx-auto">
      <section className="rounded-3xl bg-brand-ink text-white p-6 lg:p-9"><p className="text-xs font-bold uppercase tracking-widest text-brand-gold-light">Optional tool</p><h1 className="font-display text-3xl mt-2">Set up your work planner</h1><p className="text-white/70 mt-3 text-sm leading-relaxed">This is for planning what to sew next. Answer three simple questions so TailorPal uses your real workshop capacity—not generic estimates.</p></section>
      <section className="mt-5 rounded-2xl border border-brand-border bg-white p-5 space-y-5"><label className="block text-sm font-bold text-brand-ink">What kind of workshop are you?<select value={plannerSetup.planner_mode} onChange={event => setPlannerSetup({ ...plannerSetup, planner_mode: event.target.value as 'quick' | 'pro' })} className="mt-2 w-full h-11 rounded-xl border border-brand-border px-3 text-sm"><option value="quick">Solo tailor / small team — simple steps</option><option value="pro">Large workshop — detailed task planning</option></select></label><div className="grid sm:grid-cols-3 gap-3"><label className="text-sm font-bold text-brand-ink">Work days each week<input type="number" min="1" max="7" value={plannerSetup.work_days_per_week} onChange={event => setPlannerSetup({ ...plannerSetup, work_days_per_week: Number(event.target.value) })} className="mt-2 w-full h-11 rounded-xl border border-brand-border px-3" /></label><label className="text-sm font-bold text-brand-ink">Hours each day<input type="number" min="1" max="24" value={plannerSetup.hours_per_day} onChange={event => setPlannerSetup({ ...plannerSetup, hours_per_day: Number(event.target.value) })} className="mt-2 w-full h-11 rounded-xl border border-brand-border px-3" /></label><label className="text-sm font-bold text-brand-ink">People who make outfits<input type="number" min="1" value={plannerSetup.team_capacity} onChange={event => setPlannerSetup({ ...plannerSetup, team_capacity: Number(event.target.value) })} className="mt-2 w-full h-11 rounded-xl border border-brand-border px-3" /></label></div><button disabled={savingPlannerSetup} onClick={() => void activatePlanner()} className="h-11 rounded-xl bg-brand-ink px-5 text-sm font-bold text-white">{savingPlannerSetup ? 'Starting planner…' : 'Activate my planner'}</button></section>
    </div>
  )

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6 lg:space-y-8">
      {/* Atelier Floor Board Header */}
      <section className="relative overflow-hidden rounded-3xl bg-brand-ink p-6 lg:p-9 text-white shadow-sm">
        <div
          className="absolute inset-0 opacity-25 pointer-events-none"
          style={{
            background:
              'radial-gradient(circle at 85% 20%, #D97B2B 0%, transparent 42%)',
          }}
        />
        <div className="relative flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-brand-gold-light text-xs font-bold uppercase tracking-[0.2em] mb-3">
              <Sparkles size={13} />
              Floor Board · Live Job Tracker
            </div>
            <h1 className="font-display text-3xl lg:text-5xl text-white">
              The Workshop Floor
            </h1>
            <p className="text-white/70 mt-2 max-w-xl text-sm leading-relaxed">
              Every active outfit in real workshop language. Tap stages to advance cutting,
              sewing, and fitting without technical forms or complex spreadsheets.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Role-based toggle */}
            <div className="inline-flex p-1 rounded-2xl bg-white/10 border border-white/15 text-xs font-bold">
              <button
                onClick={() => setViewMode('manager')}
                className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                  viewMode === 'manager'
                    ? 'bg-white text-brand-ink shadow-xs'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                <Eye size={13} />
                Creative Director
              </button>
              <button
                onClick={() => setViewMode('artisan')}
                className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                  viewMode === 'artisan'
                    ? 'bg-white text-brand-ink shadow-xs'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                <Scissors size={13} />
                Cutter & Maker
              </button>
            </div>

            <button
              onClick={() => {
                setRecipeTargetOrderId(undefined)
                setRecipeModalOpen(true)
              }}
              className="h-11 px-4 rounded-xl bg-brand-gold hover:bg-brand-gold/90 text-white text-xs font-bold flex items-center gap-2 shadow-brand transition-all cursor-pointer"
            >
              <Sparkles size={14} />
              Apply Garment Recipe
            </button>

            <Link
              href={`/dashboard/shop/${shopId}/orders`}
              className="h-11 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              All Orders <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </section>

      {/* Creative Director / Manager Overview Metrics */}
      {viewMode === 'manager' && (
        <section className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* Shop Workload Gauge */}
          <div className="rounded-2xl border border-brand-border bg-white p-5 shadow-xs flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-stone">
                  Shop Workload
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold border ${floorMetrics.workloadTone}`}
                  >
                    {floorMetrics.workloadStatus}
                  </span>
                </div>
              </div>
              <span className="p-2.5 rounded-xl bg-orange-50 text-brand-gold">
                <Workflow size={18} />
              </span>
            </div>

            <div className="mt-4">
              <div className="flex justify-between text-xs text-brand-stone mb-1.5">
                <span>Floor Pace</span>
                <span className="font-bold text-brand-ink">
                  {floorMetrics.loadPercent}% active
                </span>
              </div>
              <div className="h-2 rounded-full bg-brand-cream overflow-hidden border border-brand-border/40">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${floorMetrics.workloadBarColor}`}
                  style={{ width: `${floorMetrics.loadPercent}%` }}
                />
              </div>
              <p className="text-[11px] text-brand-stone mt-2">
                Across {staffCount} active tailor{staffCount === 1 ? '' : 's'} on the floor
              </p>
            </div>
          </div>

          {/* Active Commissions */}
          <div className="rounded-2xl border border-brand-border bg-white p-5 shadow-xs flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-stone">
                  Active Outfits
                </p>
                <p className="font-display text-3xl text-brand-ink mt-1.5">
                  {floorMetrics.totalOrders}
                </p>
              </div>
              <span className="p-2.5 rounded-xl bg-sky-50 text-sky-600">
                <Shirt size={18} />
              </span>
            </div>
            <p className="text-xs text-brand-stone mt-3">
              {floorMetrics.urgentDeadlines > 0
                ? `${floorMetrics.urgentDeadlines} outfit${
                    floorMetrics.urgentDeadlines === 1 ? '' : 's'
                  } promised within 48 hours`
                : 'All event delivery dates in comfortable order'}
            </p>
          </div>

          {/* Today's Fittings & Deadlines */}
          <div className="rounded-2xl border border-brand-border bg-white p-5 shadow-xs flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-stone">
                  Fitting Sessions
                </p>
                <p className="font-display text-3xl text-brand-ink mt-1.5">
                  {floorMetrics.todayFittings}
                </p>
              </div>
              <span className="p-2.5 rounded-xl bg-violet-50 text-violet-600">
                <Calendar size={18} />
              </span>
            </div>
            <p className="text-xs text-brand-stone mt-3">
              {floorMetrics.todayFittings > 0
                ? 'Clients scheduled for atelier fitting'
                : 'No client appointments scheduled for today'}
            </p>
          </div>

          {/* Revenue Balances Due */}
          <div className="rounded-2xl border border-brand-border bg-white p-5 shadow-xs flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-stone">
                  Unpaid Balances Due
                </p>
                <p className="font-display text-3xl text-brand-ink mt-1.5">
                  {formatNaira(floorMetrics.totalUnpaidBalances)}
                </p>
              </div>
              <span className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
                <TrendingUp size={18} />
              </span>
            </div>
            <p className="text-xs text-brand-stone mt-3">
              Pending collection upon final garment handover
            </p>
          </div>
        </section>
      )}

      {/* Cutter / Artisan Notice */}
      {viewMode === 'artisan' && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 font-medium">
            <Scissors size={16} className="text-brand-gold shrink-0" />
            <span>
              <strong>Master Cutter & Maker View:</strong> Showing only outfits needing
              pattern cutting or sewing today. All pricing and admin settings hidden.
            </span>
          </div>
          <button
            onClick={() => setViewMode('manager')}
            className="font-bold underline hover:text-brand-ink shrink-0 ml-4"
          >
            Switch to Creative Director
          </button>
        </div>
      )}

      {/* Quick Filter Tabs */}
      <section className="flex items-center justify-between gap-3 flex-wrap border-b border-brand-border pb-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
          {[
            { key: 'all', label: 'All Outfits', count: processedOrders.length },
            {
              key: 'fitting_today',
              label: "Today's Fittings",
              count: floorMetrics.todayFittings,
            },
            {
              key: 'needs_cutting',
              label: 'Needs Cutting',
              count: processedOrders.filter((o) => o.currentStage === 'cut').length,
            },
            {
              key: 'express',
              label: 'Express Orders',
              count: processedOrders.filter(
                (o) =>
                  String(o.priority).toLowerCase().includes('urgent') ||
                  Number(o.priority) >= 1
              ).length,
            },
            {
              key: 'stuck',
              label: 'Stuck / Delayed',
              count: floorMetrics.stuckCount,
              alert: floorMetrics.stuckCount > 0,
            },
          ].map((tab) => {
            const isActive = activeTab === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as FilterTab)}
                className={`h-9 px-4 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                  isActive
                    ? 'bg-brand-ink text-white shadow-xs'
                    : 'bg-white text-brand-charcoal hover:bg-brand-cream border border-brand-border/70'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : tab.alert
                      ? 'bg-red-100 text-red-700 font-extrabold'
                      : 'bg-brand-cream text-brand-stone'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            )
          })}
        </div>

        <span className="text-xs text-brand-stone font-medium hidden sm:inline">
          Showing {filteredOrders.length} of {processedOrders.length} outfits
        </span>
      </section>

      {/* Visual Job Cards Grid */}
      {filteredOrders.length === 0 ? (
        <div className="p-12 text-center bg-brand-cream/20 rounded-3xl border border-brand-border">
          <CheckCircle2 className="mx-auto text-emerald-500 mb-3 h-9 w-9" />
          <h3 className="font-display text-xl text-brand-ink">
            No Outfits in this Queue
          </h3>
          <p className="text-xs text-brand-stone mt-1 max-w-sm mx-auto">
            {activeTab === 'stuck'
              ? 'Great news! No outfits are currently stuck or past their deadline.'
              : 'Switch filter tabs or create new client orders to populate the workshop floor.'}
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredOrders.map((order) => {
            const clientName = [order.customers?.first_name, order.customers?.last_name]
              .filter(Boolean)
              .join(' ') || 'Bespoke Client'
            const phone = order.customers?.phone

            const isUrgent =
              String(order.priority).toLowerCase().includes('urgent') ||
              Number(order.priority) >= 2

            return (
              <div
                key={order.id}
                id={`order-card-${order.id}`}
                className={`bg-white rounded-3xl border transition-all duration-300 shadow-xs flex flex-col justify-between overflow-hidden ${
                  order.isStuck
                    ? 'border-red-300 ring-1 ring-red-200'
                    : 'border-brand-border hover:border-brand-gold/60 hover:shadow-md'
                }`}
              >
                {/* Card Top & Thumbnail */}
                <div className="p-5">
                  <div className="flex items-start gap-3.5">
                    {/* Visual Thumbnail Preview */}
                    <div className="w-16 h-16 rounded-2xl bg-brand-cream/60 border border-brand-border/80 overflow-hidden shrink-0 grid place-items-center relative shadow-2xs">
                      {order.thumbnailUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={order.thumbnailUrl}
                          alt={order.humanTag}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-center p-1">
                          <Shirt size={22} className="text-brand-stone mx-auto" />
                          <span className="text-[9px] font-mono font-bold text-brand-stone uppercase mt-0.5 block">
                            Swatch
                          </span>
                        </div>
                      )}

                      {isUrgent && (
                        <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-white animate-ping" />
                      )}
                    </div>

                    {/* Header Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-mono text-[11px] font-bold text-brand-gold uppercase tracking-wider">
                          #{order.order_number.replace(/^[^\d]*/, '').slice(-3) || '001'}
                        </span>
                        {isUrgent && (
                          <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-700 text-[10px] font-bold border border-red-200">
                            Express
                          </span>
                        )}
                        {order.isStuck && (
                          <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-600 text-[10px] font-bold flex items-center gap-1">
                            <AlertTriangle size={10} /> Stuck
                          </span>
                        )}
                      </div>

                      <h3 className="font-bold text-sm text-brand-ink truncate mt-0.5">
                        {order.design_description ||
                          order.order_garments?.[0]?.name ||
                          'Bespoke Garment'}
                      </h3>

                      <p className="text-xs text-brand-charcoal font-medium truncate mt-0.5">
                        {clientName}
                      </p>

                      {/* Event / Promised Date */}
                      <p className="text-[11px] text-brand-stone flex items-center gap-1.5 mt-1">
                        <Calendar size={11} className="text-brand-gold shrink-0" />
                        <span>
                          {order.estimated_delivery_date
                            ? new Date(
                                `${order.estimated_delivery_date}T00:00:00`
                              ).toLocaleDateString('en-GB', {
                                day: 'numeric',
                                month: 'short',
                              })
                            : 'No date set'}
                        </span>
                        {order.daysUntilDelivery !== null && (
                          <span
                            className={`font-semibold ${
                              order.daysUntilDelivery < 0
                                ? 'text-red-600'
                                : order.daysUntilDelivery <= 2
                                ? 'text-amber-700'
                                : 'text-brand-stone'
                            }`}
                          >
                            ·{' '}
                            {order.daysUntilDelivery < 0
                              ? `Overdue by ${Math.abs(order.daysUntilDelivery)}d`
                              : order.daysUntilDelivery === 0
                              ? 'Due today!'
                              : `In ${order.daysUntilDelivery}d`}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Financial Mini Pill (Manager View Only) */}
                  {viewMode === 'manager' && (
                    <div className="mt-4 pt-3 border-t border-brand-border/60 flex items-center justify-between text-xs">
                      <span className="text-brand-stone font-medium">
                        Total: <strong>{order.total_price ? formatNaira(order.total_price) : '₦0'}</strong>
                      </span>
                      <span
                        className={`text-[11px] font-bold ${
                          order.balanceDue > 0 ? 'text-amber-700' : 'text-emerald-700'
                        }`}
                      >
                        {order.balanceDue > 0
                          ? `₦${formatNaira(order.balanceDue).replace('₦', '')} due`
                          : 'Paid in Full'}
                      </span>
                    </div>
                  )}

                  {/* The 4 Clear Visual Stages: Cut -> Sew -> Fitting -> Ready */}
                  <div className="mt-4 pt-3 border-t border-brand-border/60">
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-stone mb-2">
                      Stage Progression
                    </p>
                    <div className="grid grid-cols-4 gap-1.5 bg-brand-cream/40 p-1.5 rounded-2xl border border-brand-border/60">
                      {[
                        { key: 'cut', label: 'Cut', icon: Scissors },
                        { key: 'sew', label: 'Sew', icon: Shirt },
                        { key: 'fitting', label: 'Fitting', icon: UserCheck },
                        { key: 'ready', label: 'Ready', icon: CheckCircle2 },
                      ].map((stg) => {
                        const Icon = stg.icon
                        const isCurrent = order.currentStage === stg.key
                        return (
                          <button
                            key={stg.key}
                            onClick={() =>
                              void advanceStage(order, stg.key as WorkshopStageKey)
                            }
                            className={`py-2 px-1 rounded-xl text-center flex flex-col items-center justify-center transition-all cursor-pointer ${
                              isCurrent
                                ? 'bg-brand-ink text-white font-extrabold shadow-sm ring-2 ring-brand-gold/50'
                                : 'text-brand-charcoal hover:bg-white'
                            }`}
                            title={`Tap to move to ${stg.label}`}
                          >
                            <Icon
                              size={14}
                              className={isCurrent ? 'text-brand-gold' : 'text-brand-stone'}
                            />
                            <span className="text-[10px] mt-1 font-bold">
                              {stg.label}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="p-4 bg-brand-cream/30 border-t border-brand-border/80 space-y-2.5">
                  {/* Single Primary Action Button */}
                  <button
                    onClick={() => handlePrimaryAction(order)}
                    className="w-full h-10 rounded-xl bg-brand-ink hover:bg-brand-charcoal text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                  >
                    {order.currentStage === 'cut' && (
                      <>
                        <Scissors size={14} className="text-brand-gold" />
                        Mark Cut & Start Sewing
                      </>
                    )}
                    {order.currentStage === 'sew' && (
                      <>
                        <UserCheck size={14} className="text-brand-gold" />
                        Sewing Complete → Call for Fitting
                      </>
                    )}
                    {order.currentStage === 'fitting' && (
                      <>
                        <CheckCircle2 size={14} className="text-brand-gold" />
                        Fitting Approved → Mark Ready
                      </>
                    )}
                    {order.currentStage === 'ready' && (
                      <>
                        <CheckCircle2 size={14} className="text-emerald-400" />
                        Ready for Pickup (Complete)
                      </>
                    )}
                  </button>

                  {/* 1-Tap WhatsApp Alerts (If in Fitting or Ready) */}
                  {order.currentStage === 'fitting' && phone && (
                    <button
                      onClick={() => promptWhatsAppFitting(order)}
                      className="w-full h-9 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-2xs transition-all cursor-pointer"
                    >
                      <Phone size={13} />
                      Send WhatsApp Fitting Reminder
                    </button>
                  )}

                  {order.currentStage === 'ready' && phone && (
                    <button
                      onClick={() => promptWhatsAppPickup(order)}
                      className="w-full h-9 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-2xs transition-all cursor-pointer"
                    >
                      <Phone size={13} />
                      Send WhatsApp Ready for Pickup
                    </button>
                  )}

                  {/* Secondary Atelier Utilities */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <button
                      onClick={() => setTagModalOrder(order)}
                      className="h-8 px-3 rounded-lg bg-white border border-brand-border text-brand-charcoal hover:bg-brand-cream text-[11px] font-bold flex items-center gap-1.5 transition-colors"
                      title="Print Hanger Tag with QR code"
                    >
                      <Printer size={12} className="text-brand-stone" />
                      Job Tag
                    </button>

                    {order.taskList.length === 0 && (
                      <button
                        onClick={() => {
                          setRecipeTargetOrderId(order.id)
                          setRecipeModalOpen(true)
                        }}
                        className="h-8 px-3 rounded-lg bg-white border border-brand-border text-brand-gold hover:bg-brand-cream text-[11px] font-bold flex items-center gap-1.5 transition-colors"
                        title="Auto-populate standard tailoring steps"
                      >
                        <Sparkles size={12} />
                        Add Recipe
                      </button>
                    )}

                    <Link
                      href={`/dashboard/shop/${shopId}/measurements`}
                      className="h-8 px-2.5 rounded-lg bg-white border border-brand-border text-brand-stone hover:text-brand-ink text-[11px] font-medium flex items-center gap-1 transition-colors ml-auto"
                      title="View measurements"
                    >
                      <Ruler size={12} />
                      Inches
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Workshop Intelligence & Forecast Panel */}
      <ProductionIntelligencePanel
        shopId={shopId}
        weeklyCapacity={floorMetrics.weekCapacity}
        plannedHours={floorMetrics.totalRemainingHours}
      />

      {/* Printable QR Job Tag Modal */}
      <PrintableJobTagModal
        open={Boolean(tagModalOrder)}
        onClose={() => setTagModalOrder(null)}
        order={tagModalOrder}
        shopName={shopName}
        shopId={shopId}
      />

      {/* Garment Recipe Presets Modal */}
      <GarmentRecipeModal
        open={recipeModalOpen}
        onClose={() => setRecipeModalOpen(false)}
        shopId={shopId}
        orders={orders}
        selectedOrderId={recipeTargetOrderId}
        onApplied={() => void loadData()}
      />
    </div>
  )
}
