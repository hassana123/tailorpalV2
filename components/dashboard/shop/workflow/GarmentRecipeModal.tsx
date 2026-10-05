'use client'

import { useState, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  GARMENT_RECIPES,
  GarmentRecipe,
} from '@/lib/constants/garmentRecipes'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import {
  Sparkles,
  Clock,
  ChevronRight,
  X,
  Loader2,
} from 'lucide-react'

interface OrderOption {
  id: string
  order_number: string
  design_description: string | null
  customers: { first_name: string; last_name: string | null } | null
}

interface GarmentRecipeModalProps {
  open: boolean
  onClose: () => void
  shopId: string
  orders: OrderOption[]
  selectedOrderId?: string
  onApplied: () => void
}

export function GarmentRecipeModal({
  open,
  onClose,
  shopId,
  orders,
  selectedOrderId: initialOrderId,
  onApplied,
}: GarmentRecipeModalProps) {
  const [targetOrderId, setTargetOrderId] = useState<string>(
    initialOrderId || orders[0]?.id || ''
  )
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [selectedRecipe, setSelectedRecipe] = useState<GarmentRecipe>(
    GARMENT_RECIPES[0]
  )
  const [isApplying, setIsApplying] = useState(false)

  const filteredRecipes = useMemo(() => {
    if (selectedCategory === 'All') return GARMENT_RECIPES
    return GARMENT_RECIPES.filter((r) => r.category === selectedCategory)
  }, [selectedCategory])

  const effectiveOrderId = targetOrderId || initialOrderId || orders[0]?.id || ''

  const handleApplyRecipe = async () => {
    if (!effectiveOrderId) {
      toast.error('Please select an order to apply this recipe to')
      return
    }

    try {
      setIsApplying(true)
      const supabase = createClient()

      // 1. Fetch available production stages for this shop
      const { data: stages, error: stagesError } = await supabase
        .from('production_stages')
        .select('id, name')
        .eq('shop_id', shopId)
        .order('position')

      if (stagesError) throw stagesError

      const stageMap = new Map<string, string>()
      ;(stages || []).forEach((s) => {
        stageMap.set(s.name.toLowerCase().trim(), s.id)
      })

      const fallbackStageId = stages?.[0]?.id

      // 2. Prepare task payload
      const tasksToInsert = selectedRecipe.steps.map((step, idx) => {
        const lowerStage = step.stageName.toLowerCase().trim()
        const stageId =
          stageMap.get(lowerStage) ||
          stageMap.get(
            lowerStage === 'quality check' ? 'quality check' : lowerStage
          ) ||
          fallbackStageId

        return {
          shop_id: shopId,
          order_id: effectiveOrderId,
          stage_id: stageId,
          title: step.title,
          estimated_minutes: step.estimatedMinutes,
          priority: idx === 0 ? 1 : 0,
        }
      })

      const { error: insertError } = await supabase
        .from('production_tasks')
        .insert(tasksToInsert)

      if (insertError) throw insertError

      toast.success(
        `Applied "${selectedRecipe.name}" recipe! Created ${tasksToInsert.length} workshop steps.`
      )
      onApplied()
      onClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to apply preset'
      toast.error(msg)
    } finally {
      setIsApplying(false)
    }
  }

  const selectedOrder = orders.find((o) => o.id === effectiveOrderId)

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent
        className="w-[calc(100vw-1.5rem)] sm:w-full max-w-4xl max-h-[92vh] flex flex-col p-0 overflow-x-hidden overflow-y-auto bg-white rounded-3xl border border-brand-border shadow-2xl"
      >
        {/* Atelier Header */}
        <div className="relative bg-brand-ink text-white p-6 sm:p-7 border-b border-brand-border/20">
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              background:
                'radial-gradient(circle at 85% 20%, #D97B2B 0%, transparent 45%)',
            }}
          />
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors z-10"
            aria-label="Close dialog"
          >
            <X size={16} />
          </button>

          <div className="relative">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-brand-gold-light text-[10px] font-bold uppercase tracking-[0.2em] mb-2">
              <Sparkles size={12} />
              Smart Garment Recipes
            </div>
            <DialogTitle className="font-display text-2xl sm:text-3xl text-white">
              One-Click Workshop Presets
            </DialogTitle>
            <p className="text-white/70 text-xs sm:text-sm mt-1 max-w-xl">
              Eliminate manual task setup. Pick an outfit style to auto-populate
              every cutting, sewing, and fitting step with proven timeframe estimates.
            </p>
          </div>

          {/* Target Order Selector */}
          <div className="mt-5 pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center gap-3">
            <label className="text-xs font-bold text-brand-gold-light uppercase tracking-wider shrink-0">
              Apply to Outfit:
            </label>
            <select
              value={effectiveOrderId}
              onChange={(e) => setTargetOrderId(e.target.value)}
              className="flex-1 h-10 rounded-xl bg-white/10 text-white border border-white/20 px-3 text-xs font-semibold focus:outline-none focus:bg-brand-charcoal transition-colors"
            >
              {orders.map((ord) => {
                const client = ord.customers
                  ? `${ord.customers.first_name} ${ord.customers.last_name || ''}`.trim()
                  : 'Client'
                return (
                  <option key={ord.id} value={ord.id} className="text-brand-ink bg-white">
                    {ord.order_number} · {client} {ord.design_description ? `(${ord.design_description})` : ''}
                  </option>
                )
              })}
            </select>
          </div>
        </div>

        {/* Recipe Selection Body */}
        <div className="p-5 sm:p-7 space-y-6 flex-1 overflow-y-auto">
          {/* Category Filter Pills */}
          <div className="flex flex-wrap gap-2">
            {['All', 'Traditional / Native', "Women's Fashion", 'Casual / Alterations'].map(
              (cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                    selectedCategory === cat
                      ? 'bg-brand-ink text-white shadow-xs'
                      : 'bg-brand-cream/80 text-brand-charcoal hover:bg-brand-cream border border-brand-border/60'
                  }`}
                >
                  {cat}
                </button>
              )
            )}
          </div>

          {/* Master Detail Grid */}
          <div className="grid md:grid-cols-12 gap-5">
            {/* Recipes List */}
            <div className="md:col-span-5 space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {filteredRecipes.map((recipe) => {
                const isSelected = selectedRecipe.id === recipe.id
                return (
                  <div
                    key={recipe.id}
                    onClick={() => setSelectedRecipe(recipe)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all text-left flex items-start justify-between gap-3 ${
                      isSelected
                        ? 'border-brand-gold bg-brand-cream/50 shadow-sm ring-1 ring-brand-gold/30'
                        : 'border-brand-border bg-white hover:border-brand-border/80 hover:bg-brand-cream/20'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <span className="text-2xl shrink-0 p-1.5 rounded-xl bg-white border border-brand-border/60 shadow-2xs">
                        {recipe.iconEmoji}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-xs sm:text-sm text-brand-ink truncate">
                            {recipe.name}
                          </p>
                        </div>
                        <p className="text-[11px] text-brand-stone mt-0.5 line-clamp-1">
                          {recipe.description}
                        </p>
                        <div className="flex items-center gap-2 mt-2 text-[10px] text-brand-stone">
                          <span className="font-bold text-brand-gold bg-brand-cream px-2 py-0.5 rounded-full border border-brand-border/40">
                            {recipe.badge}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock size={10} />
                            {(recipe.estimatedTotalMinutes / 60).toFixed(1)}h total
                          </span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight
                      size={16}
                      className={`shrink-0 transition-transform ${
                        isSelected ? 'text-brand-gold translate-x-0.5' : 'text-brand-stone/40'
                      }`}
                    />
                  </div>
                )
              })}
            </div>

            {/* Selected Recipe Steps Preview */}
            <div className="md:col-span-7 bg-brand-cream/40 rounded-2xl border border-brand-border p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-brand-border/60">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{selectedRecipe.iconEmoji}</span>
                      <h3 className="font-display text-lg text-brand-ink">
                        {selectedRecipe.name}
                      </h3>
                    </div>
                    <p className="text-xs text-brand-stone mt-1">
                      {selectedRecipe.description}
                    </p>
                  </div>
                  <span className="shrink-0 px-3 py-1 rounded-xl bg-white border border-brand-border text-xs font-bold text-brand-ink flex items-center gap-1.5 shadow-2xs">
                    <Clock size={12} className="text-brand-gold" />
                    {(selectedRecipe.estimatedTotalMinutes / 60).toFixed(1)}h
                  </span>
                </div>

                {/* Steps Timeline */}
                <div className="mt-4 space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
                  {selectedRecipe.steps.map((step, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-white border border-brand-border/70 flex items-start gap-3 shadow-2xs"
                    >
                      <span className="w-5 h-5 rounded-full bg-brand-ink text-white text-[10px] font-bold grid place-items-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-bold text-brand-ink truncate">
                            {step.title}
                          </p>
                          <span className="text-[10px] font-mono font-bold text-brand-stone shrink-0">
                            {step.estimatedMinutes}m
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-brand-stone">
                          <span className="px-2 py-0.5 rounded-md bg-brand-cream font-medium text-brand-charcoal border border-brand-border/40">
                            Stage: {step.stageName}
                          </span>
                          {step.suggestedRole && (
                            <span>Role: {step.suggestedRole}</span>
                          )}
                        </div>
                        {step.notes && (
                          <p className="text-[10px] text-brand-gold italic mt-1">
                            💡 {step.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Bar */}
              <div className="mt-5 pt-4 border-t border-brand-border/80 flex flex-col sm:flex-row items-center justify-between gap-3">
                <p className="text-xs text-brand-stone text-center sm:text-left">
                  Will populate <strong>{selectedRecipe.steps.length} tasks</strong> on{' '}
                  <span className="text-brand-ink font-semibold">
                    {selectedOrder?.order_number || 'the order'}
                  </span>.
                </p>
                <button
                  onClick={handleApplyRecipe}
                  disabled={isApplying || !effectiveOrderId}
                  className="w-full sm:w-auto h-11 px-6 rounded-xl bg-brand-ink hover:bg-brand-charcoal text-white text-xs font-bold flex items-center justify-center gap-2 shadow-brand transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isApplying ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Generating Tasks...
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} className="text-brand-gold" />
                      Apply Recipe ({selectedRecipe.steps.length} Steps)
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
