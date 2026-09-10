'use client'

import { useEffect, useState } from 'react'
import {
  Users,
  CheckCircle2,
  Clock,
  Plus,
  X,
  Scissors,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

type Staff = {
  id: string
  email: string
  production_role: string | null
  skills: string[] | null
}

type Task = {
  id: string
  assigned_staff_id: string | null
  status: string
  estimated_minutes: number | null
  production_time_entries: { started_at: string; ended_at: string | null }[]
}

const COMMON_SKILL_PRESETS = [
  'Cutting',
  'Sewing',
  'Embroidery',
  'Beading',
  'Ironing / Pressing',
  'Pattern Drafting',
  'Finishing',
]

export function StaffWorkloadPanel({ shopId }: { shopId: string }) {
  const db = createClient()
  const [staff, setStaff] = useState<Staff[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [newSkillInputs, setNewSkillInputs] = useState<Record<string, string>>({})
  const [savingId, setSavingId] = useState<string | null>(null)

  const loadData = async () => {
    try {
      const [staffRes, taskRes] = await Promise.all([
        db
          .from('shop_staff')
          .select('id,email,production_role,skills')
          .eq('shop_id', shopId)
          .eq('status', 'active'),
        db
          .from('production_tasks')
          .select('id,assigned_staff_id,status,estimated_minutes,production_time_entries(started_at,ended_at)')
          .eq('shop_id', shopId),
      ])
      setStaff((staffRes.data ?? []) as Staff[])
      setTasks((taskRes.data ?? []) as unknown as Task[])
    } catch {
      // Ignore initial load errors
    }
  }

  useEffect(() => {
    void loadData()
  }, [shopId])

  const handleAddSkill = async (memberId: string, skillToAdd: string) => {
    const trimmed = skillToAdd.trim()
    if (!trimmed) return

    const member = staff.find((s) => s.id === memberId)
    if (!member) return

    const currentSkills = member.skills ?? []
    if (currentSkills.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      toast.info('Skill already exists on this artisan')
      return
    }

    const updatedSkills = [...currentSkills, trimmed]
    setSavingId(memberId)
    const { error } = await db.from('shop_staff').update({ skills: updatedSkills }).eq('id', memberId)
    setSavingId(null)

    if (error) {
      toast.error(error.message)
      return
    }

    toast.success(`Added "${trimmed}" to ${member.email}`)
    setNewSkillInputs((prev) => ({ ...prev, [memberId]: '' }))
    void loadData()
  }

  const handleRemoveSkill = async (memberId: string, skillToRemove: string) => {
    const member = staff.find((s) => s.id === memberId)
    if (!member) return

    const updatedSkills = (member.skills ?? []).filter((s) => s !== skillToRemove)
    setSavingId(memberId)
    const { error } = await db.from('shop_staff').update({ skills: updatedSkills }).eq('id', memberId)
    setSavingId(null)

    if (error) {
      toast.error(error.message)
      return
    }

    toast.success(`Removed "${skillToRemove}"`)
    void loadData()
  }

  // Summary Metrics
  const totalAssignedTasks = tasks.filter((t) => t.assigned_staff_id).length
  const totalCompletedTasks = tasks.filter((t) => t.status === 'done').length
  const totalLoggedMinutes = Math.round(
    tasks.reduce(
      (sum, t) =>
        sum +
        t.production_time_entries.reduce(
          (s, e) =>
            s +
            (e.ended_at
              ? (new Date(e.ended_at).getTime() - new Date(e.started_at).getTime()) / 60000
              : 0),
          0
        ),
      0
    )
  )

  return (
    <section className="rounded-3xl border border-brand-border bg-white p-5 lg:p-7 shadow-sm space-y-6">
      
      {/* Header with Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-brand-border">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Users size={18} className="text-brand-gold" />
            <h2 className="font-display text-xl text-brand-ink">Artisan Workload & Production Skills</h2>
          </div>
          <p className="text-xs text-brand-stone">
            Monitor real-time task ownership, apprentice time tracking, and skill qualifications.
          </p>
        </div>

        {/* Mini stats */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="px-3 py-1.5 rounded-xl bg-brand-cream border border-brand-border text-center">
            <span className="text-[10px] text-brand-stone block uppercase font-bold">Active Staff</span>
            <span className="text-sm font-bold text-brand-ink">{staff.length}</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-brand-cream border border-brand-border text-center">
            <span className="text-[10px] text-brand-stone block uppercase font-bold">Assigned</span>
            <span className="text-sm font-bold text-brand-ink">{totalAssignedTasks}</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
            <span className="text-[10px] text-emerald-800 block uppercase font-bold">Done</span>
            <span className="text-sm font-bold text-emerald-700">{totalCompletedTasks}</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-brand-cream border border-brand-border text-center">
            <span className="text-[10px] text-brand-stone block uppercase font-bold">Time Logged</span>
            <span className="text-sm font-bold text-[#D97B2B] flex items-center gap-1">
              <Clock size={11} />
              {Math.floor(totalLoggedMinutes / 60)}h {totalLoggedMinutes % 60}m
            </span>
          </div>
        </div>
      </div>

      {/* Staff Workload Cards List */}
      {staff.length === 0 ? (
        <div className="p-8 text-center bg-brand-cream/60 rounded-2xl border border-brand-border space-y-2">
          <Users size={24} className="mx-auto text-brand-stone" />
          <p className="text-sm font-semibold text-brand-ink">No active staff members yet</p>
          <p className="text-xs text-brand-stone max-w-sm mx-auto">
            Invite apprentices, cutters, and seamstresses above to track workloads and assign tasks.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {staff.map((member) => {
            const memberTasks = tasks.filter((t) => t.assigned_staff_id === member.id)
            const completed = memberTasks.filter((t) => t.status === 'done').length
            const estimated = memberTasks.reduce((sum, t) => sum + (t.estimated_minutes || 0), 0)
            const actual = memberTasks.reduce(
              (sum, t) =>
                sum +
                t.production_time_entries.reduce(
                  (s, e) =>
                    s +
                    (e.ended_at
                      ? (new Date(e.ended_at).getTime() - new Date(e.started_at).getTime()) / 60000
                      : 0),
                  0
                ),
              0
            )

            const completionRate =
              memberTasks.length > 0 ? Math.round((completed / memberTasks.length) * 100) : 0
            const skillsList = member.skills ?? []

            return (
              <div
                key={member.id}
                className="rounded-2xl border border-brand-border bg-brand-cream/40 p-4 sm:p-5 transition-all hover:border-brand-gold/40 hover:bg-brand-cream/60 space-y-4"
              >
                {/* Member Identity & Workload Stats */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-ink text-white font-display font-bold text-sm flex items-center justify-center flex-shrink-0 shadow-sm">
                      {member.email[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-brand-ink">{member.email}</span>
                        <span className="px-2 py-0.5 rounded-full bg-brand-cream border border-brand-border text-[10px] font-bold text-brand-charcoal">
                          {member.production_role || 'Workshop Staff'}
                        </span>
                      </div>
                      <p className="text-xs text-brand-stone mt-0.5 flex items-center gap-2">
                        <span>{memberTasks.length} active tasks</span>
                        <span>·</span>
                        <span className="text-emerald-700 font-semibold">{completed} completed</span>
                        <span>·</span>
                        <span className="font-mono text-[#D97B2B] font-bold">
                          {Math.round(actual)}m logged ({estimated}m est.)
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Completion Progress Bar */}
                  <div className="sm:text-right min-w-[140px]">
                    <div className="flex sm:justify-end items-center gap-1.5 text-xs text-brand-stone mb-1 font-semibold">
                      <CheckCircle2 size={12} className="text-emerald-600" />
                      <span>{completionRate}% Completion</span>
                    </div>
                    <div className="w-full bg-white h-2 rounded-full overflow-hidden border border-brand-border">
                      <div
                        className="bg-brand-gold h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, completionRate)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Skills Management */}
                <div className="pt-3 border-t border-brand-border/60">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold text-brand-stone uppercase tracking-wider flex items-center gap-1">
                      <Scissors size={10} className="text-brand-gold" />
                      Tailoring Skills & Qualifications:
                    </span>
                    <span className="text-[10px] text-brand-stone">Click preset or enter custom skill</span>
                  </div>

                  {/* Active Skill Badges */}
                  <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
                    {skillsList.length === 0 ? (
                      <span className="text-xs text-brand-stone italic">No skills tagged yet.</span>
                    ) : (
                      skillsList.map((skill) => (
                        <span
                          key={skill}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-brand-border text-xs font-semibold text-brand-ink shadow-2xs"
                        >
                          <span>{skill}</span>
                          <button
                            type="button"
                            onClick={() => void handleRemoveSkill(member.id, skill)}
                            disabled={savingId === member.id}
                            className="text-brand-stone hover:text-red-600 ml-0.5 p-0.5 rounded transition-colors"
                            title={`Remove ${skill}`}
                          >
                            <X size={11} />
                          </button>
                        </span>
                      ))
                    )}
                  </div>

                  {/* Preset Suggestions & Custom Input */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {COMMON_SKILL_PRESETS.filter((p) => !skillsList.includes(p)).slice(0, 5).map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => void handleAddSkill(member.id, preset)}
                        disabled={savingId === member.id}
                        className="text-[10px] px-2 py-1 rounded-lg bg-white/70 border border-brand-border hover:border-brand-gold text-brand-charcoal transition-colors flex items-center gap-1"
                      >
                        <Plus size={10} className="text-brand-gold" />
                        <span>{preset}</span>
                      </button>
                    ))}

                    {/* Custom input */}
                    <div className="flex items-center gap-1 ml-auto">
                      <input
                        value={newSkillInputs[member.id] || ''}
                        onChange={(e) =>
                          setNewSkillInputs((prev) => ({ ...prev, [member.id]: e.target.value }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            void handleAddSkill(member.id, newSkillInputs[member.id] || '')
                          }
                        }}
                        placeholder="Add skill..."
                        className="h-7 w-28 sm:w-36 rounded-lg border border-brand-border bg-white px-2 text-xs text-brand-ink placeholder:text-brand-stone/60 focus:outline-none focus:border-brand-gold"
                      />
                      <button
                        type="button"
                        onClick={() => void handleAddSkill(member.id, newSkillInputs[member.id] || '')}
                        disabled={savingId === member.id || !(newSkillInputs[member.id] || '').trim()}
                        className="h-7 px-2 bg-brand-ink hover:bg-brand-charcoal text-white rounded-lg text-xs font-bold transition-all disabled:opacity-40"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            )
          })}
        </div>
      )}

    </section>
  )
}
