'use client'

import { useEffect, useMemo, useState } from 'react'
import { BrainCircuit, CheckCircle2, TriangleAlert, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Task = { id: string; order_id: string; status: string; estimated_minutes: number | null; stage_id: string; assigned_staff_id: string | null; production_time_entries: { started_at: string; ended_at: string | null }[] }
type Staff = { id: string; email: string; production_role: string | null; skills: string[] | null }
type Stage = { id: string; name: string }
type Order = { id: string; design_description: string | null }

const taskMinutes = (task: Task) => task.production_time_entries.reduce((total, entry) => total + (entry.ended_at ? Math.max(0, (new Date(entry.ended_at).getTime() - new Date(entry.started_at).getTime()) / 60000) : 0), 0)
const garmentType = (description: string | null | undefined) => (description || 'Other bespoke garment').split(/[,-]/)[0].trim() || 'Other bespoke garment'
const finishDate = (hours: number, staffCount: number) => {
  const days = Math.max(1, Math.ceil(hours / Math.max(1, staffCount * 8)))
  const date = new Date(); date.setDate(date.getDate() + days)
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function ProductionIntelligencePanel({ shopId, weeklyCapacity, plannedHours }: { shopId: string; weeklyCapacity: number; plannedHours: number }) {
  const db = createClient()
  const [tasks, setTasks] = useState<Task[]>([])
  const [staff, setStaff] = useState<Staff[]>([])
  const [stages, setStages] = useState<Stage[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [hours, setHours] = useState('6')
  const [days, setDays] = useState('5')
  const [neededSkill, setNeededSkill] = useState('sewing')

  useEffect(() => {
    const load = async () => {
      const [taskResult, staffResult, stageResult, orderResult] = await Promise.all([
        db.from('production_tasks').select('id,order_id,status,estimated_minutes,stage_id,assigned_staff_id,production_time_entries(started_at,ended_at)').eq('shop_id', shopId),
        db.from('shop_staff').select('id,email,production_role,skills').eq('shop_id', shopId).eq('status', 'active'),
        db.from('production_stages').select('id,name').eq('shop_id', shopId),
        db.from('orders').select('id,design_description').eq('shop_id', shopId),
      ])
      setTasks((taskResult.data ?? []) as Task[])
      setStaff((staffResult.data ?? []) as Staff[])
      setStages((stageResult.data ?? []) as Stage[])
      setOrders((orderResult.data ?? []) as Order[])
    }
    void load()
  }, [shopId])

  const insight = useMemo(() => {
    const finished = tasks.filter((task) => task.status === 'done' && taskMinutes(task) > 0)
    const average = finished.length ? finished.reduce((total, task) => total + taskMinutes(task), 0) / finished.length : 0
    const orderById = new Map(orders.map((order) => [order.id, order]))
    const garmentAverages = [...new Set(finished.map((task) => garmentType(orderById.get(task.order_id)?.design_description)))].map((type) => {
      const matching = finished.filter((task) => garmentType(orderById.get(task.order_id)?.design_description) === type)
      return { type, count: matching.length, average: matching.reduce((total, task) => total + taskMinutes(task), 0) / matching.length }
    }).sort((a, b) => b.count - a.count)
    const stageAverages = stages.map((stage) => {
      const matching = finished.filter((task) => task.stage_id === stage.id)
      return { name: stage.name, count: matching.length, average: matching.length ? matching.reduce((total, task) => total + taskMinutes(task), 0) / matching.length : 0 }
    }).filter((stage) => stage.count)
    const normalise = (value: string | null | undefined) => (value || '').toLowerCase()
    const workerRows = staff.map((member) => {
      const assigned = tasks.filter((task) => task.assigned_staff_id === member.id)
      const remaining = assigned.filter((task) => task.status !== 'done').reduce((total, task) => total + (task.estimated_minutes || average || 180), 0)
      const skillMatch = [member.production_role, ...(member.skills || [])].some((value) => normalise(value).includes(normalise(neededSkill)))
      return { ...member, remaining, skillMatch }
    }).sort((a, b) => Number(b.skillMatch) - Number(a.skillMatch) || a.remaining - b.remaining)
    return { average, garmentAverages, stageAverages, workers: workerRows }
  }, [neededSkill, orders, stages, staff, tasks])

  const requestHours = Number(hours) || 0
  const requestDays = Number(days) || 0
  const available = Math.max(0, weeklyCapacity - plannedHours) + (Math.max(0, requestDays - 5) * weeklyCapacity) / 5
  const accepted = requestHours <= available
  const realisticFinish = finishDate(Math.max(0, plannedHours + requestHours), Math.max(1, staff.length + 1))

  return <section className="rounded-2xl border border-brand-border bg-white p-5 lg:p-6">
    <div className="flex items-start gap-3"><span className="p-2.5 rounded-xl bg-violet-50 text-violet-600"><BrainCircuit size={19} /></span><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-brand-gold">Workshop Intelligence</p><h2 className="font-display text-2xl text-brand-ink">Floor Learning & Delivery Forecast</h2><p className="text-xs text-brand-stone mt-1">Predict realistic finish dates and artisan assignments from live workshop timers.</p></div></div>
    <div className="grid lg:grid-cols-3 gap-4 mt-5"><div className="rounded-xl bg-brand-cream p-4"><p className="text-[10px] font-bold uppercase text-brand-stone">Historical task average</p><p className="font-display text-3xl text-brand-ink mt-1">{insight.average ? `${Math.round(insight.average)}m` : '—'}</p><p className="text-xs text-brand-stone mt-1">{tasks.filter((task) => task.status === 'done' && taskMinutes(task) > 0).length} completed timed tasks</p></div><div className="rounded-xl bg-brand-cream p-4 lg:col-span-2"><p className="text-[10px] font-bold uppercase text-brand-stone mb-2">Average time by garment type</p>{insight.garmentAverages.length ? insight.garmentAverages.map((item) => <p key={item.type} className="text-xs text-brand-charcoal flex justify-between py-1 gap-3"><span className="truncate">{item.type}</span><b className="shrink-0">{Math.round(item.average)}m · {item.count} task{item.count === 1 ? '' : 's'}</b></p>) : <p className="text-xs text-brand-stone">Complete tasks with timers to build garment-specific benchmarks.</p>}</div></div>
    <div className="grid lg:grid-cols-2 gap-4 mt-4"><div className="rounded-xl border border-brand-border p-4"><p className="text-xs font-bold text-brand-ink">Average time by production stage</p>{insight.stageAverages.length ? insight.stageAverages.map((item) => <p key={item.name} className="text-xs text-brand-charcoal flex justify-between py-1 mt-2"><span>{item.name}</span><b>{Math.round(item.average)}m · {item.count} tasks</b></p>) : <p className="text-xs text-brand-stone mt-3">No completed timed stage work yet.</p>}</div><div className="rounded-xl border border-brand-border p-4"><p className="text-xs font-bold text-brand-ink flex gap-1.5 items-center"><Users size={14} />Skill-aware staff assignment</p><label className="block text-[10px] font-semibold text-brand-stone mt-3">Required role or skill<input value={neededSkill} onChange={(event) => setNeededSkill(event.target.value)} className="mt-1 w-full h-9 border border-brand-border rounded-lg px-2 text-xs" placeholder="e.g. embroidery" /></label>{insight.workers.length ? <div className="mt-3 space-y-2">{insight.workers.slice(0, 3).map((worker, index) => <div key={worker.id} className="text-xs flex justify-between gap-3"><span className="truncate">{index === 0 ? 'Recommended: ' : ''}{worker.email} <span className="text-brand-stone">{worker.skillMatch ? 'skill match' : worker.production_role || 'general'}</span></span><b className="shrink-0">{Math.round(worker.remaining)}m assigned</b></div>)}</div> : <p className="text-xs text-brand-stone mt-3">Invite staff and add their skills to receive recommendations.</p>}</div></div>
    <div className="rounded-xl border border-brand-border p-4 mt-4"><p className="text-xs font-bold text-brand-ink">Can I accept this order?</p><div className="flex flex-wrap gap-2 mt-3"><input value={hours} onChange={(event) => setHours(event.target.value)} type="number" min="1" className="w-20 h-9 border border-brand-border rounded-lg px-2 text-xs" /><span className="text-xs self-center text-brand-stone">hours needed in</span><input value={days} onChange={(event) => setDays(event.target.value)} type="number" min="1" className="w-16 h-9 border border-brand-border rounded-lg px-2 text-xs" /><span className="text-xs self-center text-brand-stone">days</span></div><div className={`mt-3 flex gap-2 text-xs font-semibold ${accepted ? 'text-emerald-700' : 'text-red-600'}`}>{accepted ? <CheckCircle2 size={15} /> : <TriangleAlert size={15} />}{accepted ? `Yes — about ${Math.round(available - requestHours)}h capacity remains.` : `High risk — ${Math.round(requestHours - available)}h more work is needed than the team has before this deadline.`}</div><p className="text-xs text-brand-stone mt-2">At the current workload, a realistic workshop finish is around <b className="text-brand-ink">{realisticFinish}</b>.</p></div>
  </section>
}
