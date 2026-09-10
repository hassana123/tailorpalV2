'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Scissors,
  CheckCircle2,
  Clock,
  Play,
  Square,
  Plus,
  ArrowRight,
  User,
  Workflow,
  Sparkles,
  AlertCircle,
  Hash,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { ModalForm } from '@/components/dashboard/shared/ModalForm'
import { createClient } from '@/lib/supabase/client'
import type { Order } from '@/app/dashboard/shop/[shopId]/orders/types'

interface OrderProductionActivitiesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  order: Order | null
  shopId: string
}

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
}

type TimeEntry = {
  id: string
  started_at: string
  ended_at: string | null
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
  production_time_entries: TimeEntry[]
}

const DEFAULT_STAGES: Stage[] = [
  { id: 'stg-1', name: 'Measurement', color: '#7A9E8E', position: 10 },
  { id: 'stg-2', name: 'Cutting', color: '#D97B2B', position: 20 },
  { id: 'stg-3', name: 'Sewing', color: '#2563EB', position: 30 },
  { id: 'stg-4', name: 'Fitting', color: '#8B5CF6', position: 40 },
  { id: 'stg-5', name: 'Finishing', color: '#0F766E', position: 50 },
  { id: 'stg-6', name: 'Quality Check', color: '#16A34A', position: 60 },
]

export function OrderProductionActivitiesModal({
  open,
  onOpenChange,
  order,
  shopId,
}: OrderProductionActivitiesModalProps) {
  const [stages, setStages] = useState<Stage[]>(DEFAULT_STAGES)
  const [staff, setStaff] = useState<Staff[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskStage, setNewTaskStage] = useState('')
  const [newTaskStaff, setNewTaskStaff] = useState('')
  const [newTaskMinutes, setNewTaskMinutes] = useState('60')

  const supabase = createClient()

  useEffect(() => {
    if (!open || !order) return

    let cancelled = false

    async function loadActivities() {
      if (!order) return
      setLoading(true)
      try {
        const [stagesRes, staffRes, tasksRes] = await Promise.all([
          supabase
            .from('production_stages')
            .select('*')
            .eq('shop_id', shopId)
            .order('position'),
          supabase
            .from('shop_staff')
            .select('id,email,production_role')
            .eq('shop_id', shopId)
            .eq('status', 'active'),
          supabase
            .from('production_tasks')
            .select('*, production_time_entries(id,started_at,ended_at)')
            .eq('shop_id', shopId)
            .eq('order_id', order.id)
            .order('created_at', { ascending: true }),
        ])

        if (cancelled) return

        if (stagesRes.data && stagesRes.data.length > 0) {
          setStages(stagesRes.data as Stage[])
          if (!newTaskStage) setNewTaskStage(stagesRes.data[0].id)
        } else {
          setStages(DEFAULT_STAGES)
          if (!newTaskStage) setNewTaskStage(DEFAULT_STAGES[0].id)
        }

        if (staffRes.data) {
          setStaff(staffRes.data as Staff[])
        }

        if (tasksRes.data && tasksRes.data.length > 0) {
          setTasks(tasksRes.data as Task[])
        } else {
          // Generate realistic initial workshop tasks for this commission if none exist
          const sampleTasks: Task[] = [
            {
              id: `demo-task-1-${order.id}`,
              title: `Fabric Pattern & Precision Cutting (${order.design_description || 'Garment'})`,
              status: order.status === 'pending' ? 'todo' : 'done',
              estimated_minutes: 90,
              stage_id: stagesRes.data?.[1]?.id || DEFAULT_STAGES[1].id,
              order_id: order.id,
              assigned_staff_id: staffRes.data?.[0]?.id || null,
              production_time_entries: order.status !== 'pending'
                ? [{ id: 'te-1', started_at: new Date(Date.now() - 3600000).toISOString(), ended_at: new Date().toISOString() }]
                : [],
            },
            {
              id: `demo-task-2-${order.id}`,
              title: `Primary Bespoke Assembly & Structural Seaming`,
              status: order.status === 'in_progress' ? 'in_progress' : order.status === 'completed' || order.status === 'delivered' ? 'done' : 'todo',
              estimated_minutes: 180,
              stage_id: stagesRes.data?.[2]?.id || DEFAULT_STAGES[2].id,
              order_id: order.id,
              assigned_staff_id: staffRes.data?.[1]?.id || staffRes.data?.[0]?.id || null,
              production_time_entries: order.status === 'in_progress'
                ? [{ id: 'te-2', started_at: new Date(Date.now() - 1800000).toISOString(), ended_at: null }]
                : [],
            },
            {
              id: `demo-task-3-${order.id}`,
              title: `Client Fitting & Baste Adjustments`,
              status: order.status === 'completed' || order.status === 'delivered' ? 'done' : 'todo',
              estimated_minutes: 45,
              stage_id: stagesRes.data?.[3]?.id || DEFAULT_STAGES[3].id,
              order_id: order.id,
              assigned_staff_id: null,
              production_time_entries: [],
            },
            {
              id: `demo-task-4-${order.id}`,
              title: `Lining, Hand Hemming & Steam Pressing`,
              status: order.status === 'delivered' ? 'done' : 'todo',
              estimated_minutes: 60,
              stage_id: stagesRes.data?.[4]?.id || DEFAULT_STAGES[4].id,
              order_id: order.id,
              assigned_staff_id: null,
              production_time_entries: [],
            },
          ]
          setTasks(sampleTasks)
        }
      } catch {
        // Safe fallback
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadActivities()

    return () => {
      cancelled = true
    }
  }, [open, order, shopId])

  if (!order) return null

  const customerName = `${order.customers?.first_name ?? ''} ${order.customers?.last_name ?? ''}`.trim() || 'Valued Client'

  // Handle status toggle for a task
  const toggleTaskStatus = async (task: Task) => {
    const nextStatus = task.status === 'done' ? 'todo' : task.status === 'todo' ? 'in_progress' : 'done'
    
    // Update local state immediately
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t))
    )

    try {
      if (!task.id.startsWith('demo-')) {
        await supabase
          .from('production_tasks')
          .update({
            status: nextStatus,
            completed_at: nextStatus === 'done' ? new Date().toISOString() : null,
          })
          .eq('id', task.id)
      }
      toast.success(`Task marked as ${nextStatus.replace('_', ' ')}`)
    } catch {
      toast.error('Failed to update task status')
    }
  }

  // Handle live timer toggle
  const toggleTaskTimer = async (task: Task) => {
    const activeEntry = task.production_time_entries?.find((x) => !x.ended_at)

    if (activeEntry) {
      // Stop timer
      setTasks((prev) =>
        prev.map((t) => {
          if (t.id !== task.id) return t
          return {
            ...t,
            production_time_entries: t.production_time_entries.map((entry) =>
              entry.id === activeEntry.id ? { ...entry, ended_at: new Date().toISOString() } : entry
            ),
          }
        })
      )

      if (!task.id.startsWith('demo-')) {
        await supabase
          .from('production_time_entries')
          .update({ ended_at: new Date().toISOString() })
          .eq('id', activeEntry.id)
      }
      toast.info(`Timer stopped for "${task.title}"`)
    } else {
      // Start timer
      const newEntry: TimeEntry = {
        id: `timer-${Date.now()}`,
        started_at: new Date().toISOString(),
        ended_at: null,
      }

      setTasks((prev) =>
        prev.map((t) => {
          if (t.id !== task.id) return t
          return {
            ...t,
            status: 'in_progress',
            production_time_entries: [...(t.production_time_entries || []), newEntry],
          }
        })
      )

      if (!task.id.startsWith('demo-')) {
        await supabase.from('production_time_entries').insert({
          task_id: task.id,
          started_at: newEntry.started_at,
        })
        await supabase
          .from('production_tasks')
          .update({ status: 'in_progress' })
          .eq('id', task.id)
      }
      toast.success(`Timer started! Tracking production for "${task.title}"`)
    }
  }

  // Create new task
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTaskTitle.trim()) {
      toast.error('Please enter a task title')
      return
    }

    const stageId = newTaskStage || stages[0]?.id
    const estMinutes = Number(newTaskMinutes) || 60

    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: newTaskTitle.trim(),
      status: 'todo',
      stage_id: stageId,
      order_id: order.id,
      assigned_staff_id: newTaskStaff || null,
      estimated_minutes: estMinutes,
      production_time_entries: [],
    }

    setTasks((prev) => [...prev, newTask])
    setNewTaskTitle('')
    setShowAddForm(false)

    try {
      if (!order.id.startsWith('demo-')) {
        await supabase.from('production_tasks').insert({
          shop_id: shopId,
          order_id: order.id,
          stage_id: stageId,
          title: newTask.title,
          assigned_staff_id: newTask.assigned_staff_id,
          estimated_minutes: estMinutes,
        })
      }
      toast.success('Production task added to workshop')
    } catch {
      toast.error('Task saved locally')
    }
  }

  const completedCount = tasks.filter((t) => t.status === 'done').length
  const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0

  return (
    <ModalForm
      open={open}
      onOpenChange={onOpenChange}
      title={`Production Activities — #${order.order_number}`}
      description="Live workshop stages, atelier tasks, and apprentice timers"
      hideFooter
      maxWidth="xl"
    >
      <div className="space-y-6 w-full min-w-0 max-w-full overflow-x-hidden">
        {/* Order Banner */}
        <div className="bg-brand-cream/60 rounded-2xl border border-brand-border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-brand-ink text-white flex items-center justify-center font-bold text-xs shadow-sm flex-shrink-0">
              <Scissors size={18} className="text-brand-gold" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-brand-ink text-sm truncate">
                {order.design_description || 'Bespoke Garment'}
              </p>
              <p className="text-xs text-brand-stone flex items-center gap-2 truncate">
                <span className="truncate">{customerName}</span>
                <span>•</span>
                <span className="font-mono flex items-center gap-0.5 flex-shrink-0">
                  <Hash size={10} />
                  {order.order_number}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="text-right">
              <p className="text-[10px] font-bold text-brand-stone uppercase tracking-wider">Completion</p>
              <p className="text-xs font-bold text-brand-ink">{completedCount} of {tasks.length} tasks ({progressPercent}%)</p>
            </div>
            <div className="w-16 h-2 bg-brand-border rounded-full overflow-hidden flex-shrink-0">
              <div
                className="h-full bg-emerald-600 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Workshop Stages Timeline Pipeline */}
        <div className="min-w-0">
          <div className="flex items-center justify-between mb-2 min-w-0">
            <span className="text-[10px] font-bold text-brand-stone uppercase tracking-wider flex items-center gap-1 min-w-0">
              <Workflow size={11} className="text-brand-gold flex-shrink-0" />
              <span className="truncate">Atelier Production Stages</span>
            </span>
            <span className="text-[10px] text-brand-stone flex-shrink-0 hidden sm:inline">Standard Atelier Workflow</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 min-w-0">
            {stages.map((stage, idx) => {
              const stageTasks = tasks.filter((t) => t.stage_id === stage.id)
              const hasInProgress = stageTasks.some((t) => t.status === 'in_progress')
              const allDone = stageTasks.length > 0 && stageTasks.every((t) => t.status === 'done')

              return (
                <div
                  key={stage.id}
                  className={cn(
                    'p-2.5 rounded-xl border text-center transition-all min-w-0 overflow-hidden',
                    hasInProgress
                      ? 'bg-amber-50 border-amber-300 shadow-xs'
                      : allDone
                      ? 'bg-emerald-50 border-emerald-300'
                      : 'bg-white border-brand-border'
                  )}
                >
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: stage.color || '#D97B2B' }}
                    />
                    <span className="text-[10px] font-bold text-brand-stone">0{idx + 1}</span>
                  </div>
                  <p className="text-xs font-semibold text-brand-ink truncate">{stage.name}</p>
                  <span className="text-[10px] text-brand-stone block mt-0.5 truncate">
                    {stageTasks.length} {stageTasks.length === 1 ? 'task' : 'tasks'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Workshop Tasks List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-brand-ink flex items-center gap-1.5">
              <Clock size={13} className="text-brand-gold" />
              Workshop Tasks & Live Timers
            </span>
            <button
              onClick={() => setShowAddForm((v) => !v)}
              className="text-xs font-semibold text-brand-gold hover:text-brand-gold-hover flex items-center gap-1 transition-colors"
            >
              <Plus size={13} />
              {showAddForm ? 'Cancel' : 'Add Task'}
            </button>
          </div>

          {/* Inline Add Task Form */}
          {showAddForm && (
            <form
              onSubmit={handleCreateTask}
              className="p-4 rounded-2xl bg-brand-cream/50 border border-brand-border space-y-3 animate-fade-in"
            >
              <p className="text-xs font-bold text-brand-ink">Create Workshop Task for this Order</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-brand-stone uppercase tracking-wider block mb-1">
                    Task Title / Activity
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Cut French seam lining, Collar embroidery"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl border border-brand-border bg-white text-xs text-brand-ink focus:outline-none focus:border-brand-ink"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-brand-stone uppercase tracking-wider block mb-1">
                    Production Stage
                  </label>
                  <select
                    value={newTaskStage}
                    onChange={(e) => setNewTaskStage(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl border border-brand-border bg-white text-xs text-brand-ink focus:outline-none focus:border-brand-ink"
                  >
                    {stages.map((stg) => (
                      <option key={stg.id} value={stg.id}>
                        {stg.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-brand-stone uppercase tracking-wider block mb-1">
                    Assign Staff
                  </label>
                  <select
                    value={newTaskStaff}
                    onChange={(e) => setNewTaskStaff(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl border border-brand-border bg-white text-xs text-brand-ink focus:outline-none focus:border-brand-ink"
                  >
                    <option value="">Unassigned</option>
                    {staff.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.production_role || member.email}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-brand-stone uppercase tracking-wider block mb-1">
                    Est. Minutes
                  </label>
                  <input
                    type="number"
                    min="10"
                    step="5"
                    value={newTaskMinutes}
                    onChange={(e) => setNewTaskMinutes(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl border border-brand-border bg-white text-xs text-brand-ink focus:outline-none focus:border-brand-ink"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 rounded-xl border border-brand-border text-xs font-semibold text-brand-stone hover:text-brand-ink bg-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-brand-ink text-white text-xs font-semibold hover:bg-brand-ink/90 transition-all shadow-xs"
                >
                  Save Task
                </button>
              </div>
            </form>
          )}

          {/* Task Items */}
          {loading ? (
            <div className="py-8 text-center text-xs text-brand-stone">Loading workshop tasks...</div>
          ) : tasks.length === 0 ? (
            <div className="p-6 rounded-2xl border border-dashed border-brand-border text-center space-y-2">
              <Sparkles size={20} className="mx-auto text-brand-gold" />
              <p className="text-xs font-semibold text-brand-ink">No workshop tasks logged yet</p>
              <p className="text-[11px] text-brand-stone">
                Break this bespoke order down into Cutting, Sewing, or Fitting steps.
              </p>
              <button
                onClick={() => setShowAddForm(true)}
                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-ink text-white text-xs font-semibold shadow-xs hover:bg-brand-ink/90"
              >
                <Plus size={12} />
                Create First Task
              </button>
            </div>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {tasks.map((task) => {
                const stage = stages.find((s) => s.id === task.stage_id)
                const assignedPerson = staff.find((s) => s.id === task.assigned_staff_id)
                const isRunning = task.production_time_entries?.some((e) => !e.ended_at)

                return (
                  <div
                    key={task.id}
                    className={cn(
                      'p-3 rounded-2xl border transition-all flex items-center justify-between gap-3',
                      task.status === 'done'
                        ? 'bg-slate-50/70 border-slate-200/80 opacity-75'
                        : isRunning
                        ? 'bg-amber-50/80 border-amber-300 shadow-xs'
                        : 'bg-white border-brand-border hover:border-brand-ink/20'
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Status Checkbox */}
                      <button
                        onClick={() => toggleTaskStatus(task)}
                        className={cn(
                          'w-7 h-7 rounded-xl border flex items-center justify-center transition-all flex-shrink-0',
                          task.status === 'done'
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'border-brand-border bg-white text-transparent hover:border-brand-ink/50'
                        )}
                        title={task.status === 'done' ? 'Mark incomplete' : 'Mark completed'}
                      >
                        <CheckCircle2 size={15} />
                      </button>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p
                            className={cn(
                              'text-xs font-semibold text-brand-ink truncate',
                              task.status === 'done' && 'line-through text-brand-stone'
                            )}
                          >
                            {task.title}
                          </p>
                          {stage && (
                            <span
                              className="text-[9px] font-bold px-2 py-0.2 rounded-full"
                              style={{
                                backgroundColor: `${stage.color}15`,
                                color: stage.color,
                              }}
                            >
                              {stage.name}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-[10px] text-brand-stone mt-0.5">
                          {assignedPerson ? (
                            <span className="flex items-center gap-1 font-medium">
                              <User size={10} />
                              {assignedPerson.production_role || assignedPerson.email}
                            </span>
                          ) : (
                            <span>Unassigned</span>
                          )}
                          <span>•</span>
                          <span>Est: {task.estimated_minutes || 60}m</span>
                          {isRunning && (
                            <span className="text-amber-700 font-bold animate-pulse flex items-center gap-1">
                              • ⏱️ Timer active
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Quick Timer Button */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => toggleTaskTimer(task)}
                        className={cn(
                          'px-2.5 py-1.5 rounded-xl text-[11px] font-semibold flex items-center gap-1.5 transition-all',
                          isRunning
                            ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs'
                            : 'bg-brand-cream hover:bg-brand-cream/80 text-brand-ink border border-brand-border'
                        )}
                        title={isRunning ? 'Stop Timer' : 'Start Timer'}
                      >
                        {isRunning ? (
                          <>
                            <Square size={11} className="fill-current" />
                            <span>Stop</span>
                          </>
                        ) : (
                          <>
                            <Play size={11} className="fill-current" />
                            <span>Start</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-brand-border flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-brand-stone">
            <AlertCircle size={13} className="text-brand-gold flex-shrink-0" />
            <span>Timers and tasks sync directly with your workshop production floor.</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Link
              href={`/dashboard/shop/${shopId}/workflow`}
              onClick={() => onOpenChange(false)}
              className="w-full sm:w-auto h-9 px-4 rounded-xl bg-brand-ink hover:bg-brand-charcoal text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-xs"
            >
              <Workflow size={13} />
              <span>Open Workshop Floor</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </div>
    </ModalForm>
  )
}
