'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Check, Clock3, Loader2, Play, Plus, Square, UsersRound, Workflow, Sparkles, AlertTriangle, ArrowUp, ArrowDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

type Stage = {
  id: string
  name: string
  color: string
  position: number
}

type Staff = {
  id: string
  email: string
  production_role: string | null
  skills?: string[]
}

type Order = {
  id: string
  order_number: string
  design_description: string | null
  customers: { first_name: string; last_name: string | null } | null
}

type Task = {
  id: string
  title: string
  status: 'todo' | 'in_progress' | 'done'
  estimated_minutes: number | null
  stage_id: string
  order_id: string
  assigned_staff_id: string | null
  priority?: number
  due_date?: string | null
  production_time_entries: { id: string; started_at: string; ended_at: string | null }[]
}

export function ProductionWorkflowPage() {
  const { shopId } = useParams<{ shopId: string }>()
  const supabase = createClient()

  const [stages, setStages] = useState<Stage[]>([])
  const [staff, setStaff] = useState<Staff[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [stageName, setStageName] = useState('')
  const [form, setForm] = useState({
    order: '',
    stage: '',
    title: '',
    staff: '',
    minutes: '60',
    priority: '0',
    dueDate: '',
  })

  const load = async () => {
    try {
      setLoading(true)
      const [stagesRes, staffRes, ordersRes, tasksRes] = await Promise.all([
        supabase
          .from('production_stages')
          .select('*')
          .eq('shop_id', shopId)
          .order('position'),
        supabase
          .from('shop_staff')
          .select('id,email,production_role,skills')
          .eq('shop_id', shopId)
          .eq('status', 'active'),
        supabase
          .from('orders')
          .select('id,order_number,design_description,customers(first_name,last_name)')
          .eq('shop_id', shopId)
          .in('status', ['pending', 'in_progress']),
        supabase
          .from('production_tasks')
          .select('*, production_time_entries(id,started_at,ended_at)')
          .eq('shop_id', shopId)
          .order('priority', { ascending: false }).order('created_at', { ascending: false }),
      ])

      const loadError = stagesRes.error || staffRes.error || ordersRes.error || tasksRes.error
      if (loadError) {
        toast.error(`Could not load production workflow: ${loadError.message}`)
        return
      }

      setStages((stagesRes.data ?? []) as Stage[])
      setStaff((staffRes.data ?? []) as Staff[])
      setOrders((ordersRes.data ?? []) as unknown as Order[])
      setTasks((tasksRes.data ?? []) as Task[])
    } catch {
      toast.error('Failed to load workshop data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [shopId])

  const addStage = async (e: FormEvent) => {
    e.preventDefault()
    if (!stageName.trim()) return

    const { error } = await supabase.from('production_stages').insert({
      shop_id: shopId,
      name: stageName.trim(),
      position: (stages.at(-1)?.position ?? 0) + 10,
    })

    if (error) {
      toast.error(error.message)
      return
    }

    setStageName('')
    toast.success('Stage added to workshop')
    void load()
  }

  const addTask = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.order || !form.stage || !form.title.trim()) {
      toast.error('Please select an order, stage, and task name')
      return
    }

    const { error } = await supabase.from('production_tasks').insert({
      shop_id: shopId,
      order_id: form.order,
      stage_id: form.stage,
      title: form.title.trim(),
      assigned_staff_id: form.staff || null,
      estimated_minutes: Number(form.minutes) || null,
      priority: Number(form.priority) || 0,
      due_date: form.dueDate || null,
    })

    if (error) {
      toast.error(error.message)
      return
    }

    setForm({ ...form, title: '' })
    toast.success('Production task created')
    void load()
  }

  const updateTask = async (id: string, patch: Record<string, unknown>) => {
    const { error } = await supabase
      .from('production_tasks')
      .update(patch)
      .eq('id', id)

    if (error) {
      toast.error(error.message)
      return
    }

    void load()
  }

  const toggleTimer = async (task: Task) => {
    const active = task.production_time_entries?.find((x) => !x.ended_at)

    const { error } = active
      ? await supabase
          .from('production_time_entries')
          .update({ ended_at: new Date().toISOString() })
          .eq('id', active.id)
      : await supabase.from('production_time_entries').insert({
          task_id: task.id,
          staff_id: task.assigned_staff_id,
        })

    if (error) {
      toast.error(error.message)
      return
    }

    toast.success(active ? 'Timer stopped' : 'Timer started')
    void load()
  }

  const actualMinutes = (task: Task) => task.production_time_entries.reduce((sum, entry) => sum + (entry.ended_at ? Math.max(0, (new Date(entry.ended_at).getTime() - new Date(entry.started_at).getTime()) / 60000) : 0), 0)
  const today = new Date().toISOString().slice(0, 10)
  const activeTasks = tasks.filter((task) => task.status !== 'done')
  const overdue = activeTasks.filter((task) => task.due_date && task.due_date < today)
  const dueSoon = activeTasks.filter((task) => task.due_date && task.due_date >= today && task.due_date <= new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10))
  const orderProgress = (orderId: string) => { const orderTasks=tasks.filter(t=>t.order_id===orderId); return orderTasks.length ? Math.round(orderTasks.filter(t=>t.status==='done').length/orderTasks.length*100) : 0 }

  if (loading) {
    return (
      <div className="min-h-[60vh] grid place-items-center">
        <Loader2 className="animate-spin text-brand-gold h-8 w-8" />
      </div>
    )
  }

  return (
    <main className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Luxury Atelier Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-brand-ink text-white p-6 lg:p-8 shadow-sm">
        <div
          className="absolute inset-0 opacity-25 pointer-events-none"
          style={{
            background:
              'radial-gradient(circle at 85% 20%, #D97B2B 0%, transparent 40%)',
          }}
        />
        <div className="relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-brand-gold-light text-xs font-bold uppercase tracking-[0.18em] mb-3">
            <Workflow size={13} />
            Workshop Operations
          </div>
          <h1 className="font-display text-3xl lg:text-4xl text-white">
            Run every order, stage by stage.
          </h1>
          <p className="text-white/70 mt-2 max-w-2xl text-sm leading-relaxed">
            Organize your cutting, sewing, fitting, and finishing flow. Assign makers, log active production time, and deliver every garment on schedule.
          </p>
        </div>
      </section>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[["Active tasks", activeTasks.length, 'text-brand-ink'], ["Overdue", overdue.length, 'text-red-600'], ["Due in 3 days", dueSoon.length, 'text-amber-600'], ["High priority", activeTasks.filter(t => (t.priority ?? 0) >= 2).length, 'text-violet-600']].map(([label,value,color]) => <div key={String(label)} className="rounded-2xl bg-white border border-brand-border p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-brand-stone">{label}</p><p className={`font-display text-3xl mt-1 ${color}`}>{value}</p></div>)}
      </section>

      {/* Control Grid: Create Task & Manage Stages */}
      <div className="grid lg:grid-cols-3 gap-5">
        {/* Create Task Form */}
        <section className="lg:col-span-2 rounded-2xl bg-white border border-brand-border p-5 lg:p-6 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={18} className="text-brand-gold" />
            <h2 className="font-display text-xl text-brand-ink">Create Workshop Task</h2>
          </div>

          <form onSubmit={addTask} className="grid sm:grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-brand-stone uppercase tracking-wider">
                Order *
              </label>
              <select
                value={form.order}
                onChange={(e) => setForm({ ...form, order: e.target.value })}
                className="w-full h-10 rounded-xl border border-brand-border px-3 text-xs bg-white focus:outline-none focus:border-brand-gold transition-colors"
              >
                <option value="">Select active order...</option>
                {orders.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.order_number} · {o.customers?.first_name || 'Customer'}{' '}
                    {o.design_description ? `(${o.design_description})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-brand-stone uppercase tracking-wider">Priority</label>
              <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="w-full h-10 rounded-xl border border-brand-border px-3 text-xs bg-white"><option value="0">Normal</option><option value="1">High</option><option value="2">Urgent</option></select>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-brand-stone uppercase tracking-wider">Task due date</label>
              <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className="w-full h-10 rounded-xl border border-brand-border px-3 text-xs bg-white" />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-brand-stone uppercase tracking-wider">
                Production Stage *
              </label>
              <select
                value={form.stage}
                onChange={(e) => setForm({ ...form, stage: e.target.value })}
                className="w-full h-10 rounded-xl border border-brand-border px-3 text-xs bg-white focus:outline-none focus:border-brand-gold transition-colors"
              >
                <option value="">Select stage...</option>
                {stages.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="text-[11px] font-bold text-brand-stone uppercase tracking-wider">
                Task Title *
              </label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Cut bodice pieces, Attach collar & buttons, Hem trouser cuffs"
                className="w-full h-10 rounded-xl border border-brand-border px-3 text-xs bg-white focus:outline-none focus:border-brand-gold transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-brand-stone uppercase tracking-wider">
                Assign Maker / Tailor
              </label>
              <select
                value={form.staff}
                onChange={(e) => setForm({ ...form, staff: e.target.value })}
                className="w-full h-10 rounded-xl border border-brand-border px-3 text-xs bg-white focus:outline-none focus:border-brand-gold transition-colors"
              >
                <option value="">Unassigned</option>
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.email} {s.production_role ? `· ${s.production_role}` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-brand-stone uppercase tracking-wider">
                Estimated Minutes
              </label>
              <input
                type="number"
                min="1"
                value={form.minutes}
                onChange={(e) => setForm({ ...form, minutes: e.target.value })}
                className="w-full h-10 rounded-xl border border-brand-border px-3 text-xs bg-white focus:outline-none focus:border-brand-gold transition-colors"
                placeholder="60"
              />
            </div>

            <div className="sm:col-span-2 pt-2">
              <button
                type="submit"
                className="w-full sm:w-auto px-5 h-10 rounded-xl bg-brand-ink hover:bg-brand-charcoal text-white font-bold text-xs flex items-center justify-center gap-2 shadow-brand transition-all"
              >
                <Plus size={15} /> Add Production Task
              </button>
            </div>
          </form>
        </section>

        {/* Stages Sidebar */}
        <section className="rounded-2xl bg-brand-cream/60 border border-brand-border p-5 lg:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="font-display text-lg text-brand-ink">Workshop Stages</h2>
            <p className="text-xs text-brand-stone mt-0.5">
              Sequence of work from pattern drafting to final handover.
            </p>

            <div className="mt-4 space-y-2">
              {stages.length === 0 ? (
                <p className="text-xs text-brand-stone italic">No stages defined yet.</p>
              ) : (
                stages.map((s, idx) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between p-2 rounded-xl bg-white border border-brand-border/60 text-xs text-brand-charcoal"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: s.color || '#D97B2B' }}
                      />
                      <span className="font-semibold">{s.name}</span>
                    </div>
                    <span className="text-[10px] text-brand-stone font-mono">
                      Step {idx + 1}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <form onSubmit={addStage} className="flex gap-2 mt-5 pt-3 border-t border-brand-border">
            <input
              value={stageName}
              onChange={(e) => setStageName(e.target.value)}
              placeholder="e.g. Quality Check"
              className="min-w-0 flex-1 h-9 rounded-xl border border-brand-border px-3 text-xs bg-white focus:outline-none focus:border-brand-gold"
            />
            <button
              type="submit"
              className="h-9 px-3 grid place-items-center rounded-xl bg-brand-ink text-white hover:bg-brand-charcoal text-xs font-bold transition-colors"
              title="Add stage"
            >
              <Plus size={14} />
            </button>
          </form>
        </section>
      </div>

      {/* Active Task Board */}
      <section className="rounded-2xl border border-brand-border bg-white overflow-hidden shadow-xs">
        <div className="p-5 lg:px-6 border-b border-brand-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <UsersRound size={18} className="text-brand-gold" />
            <h2 className="font-display text-xl text-brand-ink">Workshop Task Board</h2>
          </div>
          <span className="text-xs font-semibold text-brand-stone">
            {tasks.length} active task{tasks.length !== 1 ? 's' : ''}
          </span>
        </div>

        {tasks.length === 0 ? (
          <div className="p-12 text-center bg-brand-cream/20">
            <Clock3 className="mx-auto text-brand-stone mb-2 h-8 w-8" />
            <p className="text-sm font-semibold text-brand-ink">No workshop tasks yet</p>
            <p className="text-xs text-brand-stone mt-1">
              Create a task above to schedule cutting, stitching, or finishing for your active orders.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-brand-border">
            {tasks.map((t) => {
              const order = orders.find((o) => o.id === t.order_id)
              const member = staff.find((s) => s.id === t.assigned_staff_id)
              const stage = stages.find((s) => s.id === t.stage_id)
              const running = t.production_time_entries?.some((x) => !x.ended_at)
              const actual = actualMinutes(t)
              const isOverdue = Boolean(t.due_date && t.due_date < today && t.status !== 'done')

              return (
                <div
                  key={t.id}
                  className="p-4 lg:px-6 flex flex-col md:flex-row md:items-center gap-3.5 hover:bg-brand-cream/30 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full border"
                        style={{
                          backgroundColor: stage?.color ? `${stage.color}15` : '#FAF9F7',
                          color: stage?.color || '#D97B2B',
                          borderColor: stage?.color ? `${stage.color}40` : '#E2DCD5',
                        }}
                      >
                        {stage?.name || 'Stage'}
                      </span>
                      <span className="text-xs font-mono font-semibold text-brand-ink">
                        {order?.order_number || 'Order'}
                      </span>
                      <span className="text-[10px] font-bold text-brand-stone bg-brand-cream px-2 py-0.5 rounded-full">{orderProgress(t.order_id)}% order progress</span>
                      {(t.priority ?? 0) > 0 && <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">{(t.priority ?? 0) >= 2 ? 'Urgent' : 'High priority'}</span>}
                      {isOverdue && <span className="text-[10px] font-bold text-red-600 flex items-center gap-1"><AlertTriangle size={11}/> Overdue</span>}
                      {order?.customers?.first_name && (
                        <span className="text-xs text-brand-stone">
                          · {order.customers.first_name} {order.customers.last_name || ''}
                        </span>
                      )}
                    </div>

                    <p className="font-semibold text-sm text-brand-ink mt-1.5">{t.title}</p>
                    <p className="text-xs text-brand-stone mt-0.5">
                      Assigned: <span className="font-medium text-brand-charcoal">{member?.email || 'Unassigned'}</span>
                      {' · '}
                      <span>{t.estimated_minutes || 60}m est. · {Math.round(actual)}m actual</span>
                      {t.due_date && <span> · due {new Date(`${t.due_date}T00:00:00`).toLocaleDateString()}</span>}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <select
                      value={t.assigned_staff_id || ''}
                      onChange={(e) =>
                        void updateTask(t.id, {
                          assigned_staff_id: e.target.value || null,
                        })
                      }
                      className="h-9 rounded-xl border border-brand-border px-2.5 text-xs bg-white focus:outline-none"
                    >
                      <option value="">Assign maker</option>
                      {staff.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.email}
                        </option>
                      ))}
                    </select>

                    <button onClick={() => void updateTask(t.id,{ priority: Math.max(0,(t.priority ?? 0)-1) })} className="h-9 w-9 rounded-xl border border-brand-border grid place-items-center" title="Lower priority"><ArrowDown size={13}/></button>
                    <button onClick={() => void updateTask(t.id,{ priority: Math.min(2,(t.priority ?? 0)+1) })} className="h-9 w-9 rounded-xl border border-brand-border grid place-items-center" title="Raise priority"><ArrowUp size={13}/></button>

                    <button
                      onClick={() => void toggleTimer(t)}
                      className={cn(
                        'h-9 px-3.5 rounded-xl text-xs font-bold flex gap-1.5 items-center transition-all',
                        running
                          ? 'bg-red-50 text-red-600 border border-red-200 animate-pulse'
                          : 'bg-brand-ink text-white hover:bg-brand-charcoal shadow-xs',
                      )}
                    >
                      {running ? <Square size={12} /> : <Play size={12} />}
                      {running ? 'Stop Timer' : 'Start'}
                    </button>

                    <button
                      onClick={() =>
                        void updateTask(t.id, {
                          status: 'done',
                          completed_at: new Date().toISOString(),
                        })
                      }
                      className="h-9 px-3 rounded-xl border border-brand-border text-xs font-bold text-brand-charcoal hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-colors flex gap-1.5 items-center"
                    >
                      <Check size={13} /> Complete
                    </button>
                    <select value={t.status} onChange={(e)=>void updateTask(t.id,{status:e.target.value, completed_at:e.target.value==='done'?new Date().toISOString():null})} className="h-9 rounded-xl border border-brand-border px-2 text-xs"><option value="todo">Pending</option><option value="in_progress">In progress</option><option value="done">Completed</option></select>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </main>
  )
}
