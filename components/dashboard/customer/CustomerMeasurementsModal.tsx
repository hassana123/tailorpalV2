'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ModalForm } from '@/components/dashboard/shared/ModalForm'
import { toast } from 'sonner'
import {
  Plus,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Customer {
  id: string
  first_name: string
  last_name: string
}

interface CustomerMeasurementsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customer: Customer
  shopId: string
}

export const STANDARD_MEASUREMENTS: { key: string; label: string; category: string }[] = [
  { key: 'chest', label: 'Chest / Bust', category: 'Upper Body' },
  { key: 'under_bust', label: 'Under Bust', category: 'Upper Body' },
  { key: 'waist', label: 'Waist', category: 'Upper Body' },
  { key: 'hip', label: 'Hip', category: 'Lower Body' },
  { key: 'neck', label: 'Neck', category: 'Upper Body' },
  { key: 'shoulder_width', label: 'Shoulder Width', category: 'Upper Body' },
  { key: 'across_back', label: 'Across Back', category: 'Upper Body' },
  { key: 'across_chest', label: 'Across Chest', category: 'Upper Body' },
  { key: 'back_length', label: 'Back Length', category: 'Upper Body' },
  { key: 'front_length', label: 'Front Length', category: 'Upper Body' },
  { key: 'sleeve_length', label: 'Sleeve Length', category: 'Arms' },
  { key: 'upper_arm', label: 'Upper Arm / Bicep', category: 'Arms' },
  { key: 'elbow', label: 'Elbow', category: 'Arms' },
  { key: 'wrist', label: 'Wrist', category: 'Arms' },
  { key: 'armhole_depth', label: 'Armhole Depth', category: 'Arms' },
  { key: 'inseam', label: 'Inseam', category: 'Lower Body' },
  { key: 'outseam', label: 'Outseam', category: 'Lower Body' },
  { key: 'thigh', label: 'Thigh', category: 'Lower Body' },
  { key: 'knee', label: 'Knee', category: 'Lower Body' },
  { key: 'calf', label: 'Calf', category: 'Lower Body' },
  { key: 'ankle', label: 'Ankle', category: 'Lower Body' },
  { key: 'rise', label: 'Rise (Crotch Depth)', category: 'Lower Body' },
  { key: 'trouser_length', label: 'Trouser Length', category: 'Lower Body' },
  { key: 'skirt_length', label: 'Skirt Length', category: 'Lower Body' },
  { key: 'dress_length', label: 'Dress Length', category: 'Lower Body' },
  { key: 'height', label: 'Height', category: 'Full Body' },
  { key: 'full_length', label: 'Full Length', category: 'Full Body' },
  { key: 'waist_to_floor', label: 'Waist to Floor', category: 'Full Body' },
  { key: 'waist_to_knee', label: 'Waist to Knee', category: 'Full Body' },
  { key: 'nape_to_waist', label: 'Nape to Waist', category: 'Full Body' },
  { key: 'shoulder_to_waist', label: 'Shoulder to Waist', category: 'Full Body' },
]

const MEASUREMENT_CATEGORIES = Array.from(new Set(STANDARD_MEASUREMENTS.map((m) => m.category)))

export function CustomerMeasurementsModal({
  open,
  onOpenChange,
  customer,
  shopId,
}: CustomerMeasurementsModalProps) {
  const [selectedMeasurements, setSelectedMeasurements] = useState<Record<string, string>>({})
  const [customMeasurements, setCustomMeasurements] = useState<{ name: string; value: string }[]>([])
  const [newCustomName, setNewCustomName] = useState('')
  const [measurementNotes, setMeasurementNotes] = useState('')
  const [showPicker, setShowPicker] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const toggleMeasurementField = (key: string) => {
    setSelectedMeasurements((prev) => {
      const next = { ...prev }
      if (key in next) {
        delete next[key]
      } else {
        next[key] = ''
      }
      return next
    })
  }

  const addCustomMeasurement = () => {
    const name = newCustomName.trim()
    if (!name) return
    if (customMeasurements.some((m) => m.name.toLowerCase() === name.toLowerCase())) {
      toast.error('A custom measurement with that name already exists')
      return
    }
    setCustomMeasurements((prev) => [...prev, { name, value: '' }])
    setNewCustomName('')
  }

  const handleSave = async () => {
    const standardObj: Record<string, number> = {}
    for (const [key, val] of Object.entries(selectedMeasurements)) {
      const n = parseFloat(val)
      if (!isNaN(n) && n > 0) standardObj[key] = n
    }

    const customObj: Record<string, number> = {}
    for (const { name, value } of customMeasurements) {
      const n = parseFloat(value)
      if (!isNaN(n) && n > 0) customObj[name] = n
    }

    if (Object.keys(standardObj).length === 0 && Object.keys(customObj).length === 0) {
      toast.error('Please enter at least one measurement value')
      return
    }

    try {
      setIsSubmitting(true)

      // Use API to create/update measurements
      const response = await fetch('/api/measurements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopId,
          customerId: customer.id,
          standardMeasurements: standardObj,
          customMeasurements: customObj,
          notes: measurementNotes || undefined,
        }),
      })

      if (!response.ok) {
        const payload = await response.json()
        throw new Error(payload.error || 'Failed to save measurements')
      }

      toast.success('Measurements saved successfully!')
      onOpenChange(false)
      
      // Reset form
      setSelectedMeasurements({})
      setCustomMeasurements([])
      setMeasurementNotes('')
      setShowPicker(false)
    } catch (err) {
      console.error('Error saving measurement:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to save measurements')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <ModalForm
      open={open}
      onOpenChange={onOpenChange}
      title={`Add Measurements - ${customer.first_name} ${customer.last_name}`}
      description="Select measurements from the standard list or add custom ones."
      onSubmit={handleSave}
      isSubmitting={isSubmitting}
      submitLabel="Save Measurements"
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {/* Standard Measurements Picker */}
        <div>
          <Button
            type="button"
            variant="outline"
            className="w-full justify-between"
            onClick={() => setShowPicker((p) => !p)}
          >
            <span className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Choose from standard measurements
              {Object.keys(selectedMeasurements).length > 0 && (
                <Badge variant="secondary">{Object.keys(selectedMeasurements).length} selected</Badge>
              )}
            </span>
            {showPicker ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>

          {showPicker && (
            <div className="border rounded-lg p-4 mt-2 space-y-3 bg-brand-cream/20">
              {MEASUREMENT_CATEGORIES.map((category) => {
                const items = STANDARD_MEASUREMENTS.filter((m) => m.category === category)
                const isExpanded = expandedCategories[category] !== false
                return (
                  <div key={category}>
                    <button
                      type="button"
                      className="flex items-center justify-between w-full text-sm font-semibold py-1 hover:text-brand-gold transition-colors"
                      onClick={() =>
                        setExpandedCategories((prev) => ({ ...prev, [category]: !isExpanded }))
                      }
                    >
                      {category}
                      {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    </button>
                    {isExpanded && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                        {items.map((m) => {
                          const isSelected = m.key in selectedMeasurements
                          return (
                            <button
                              key={m.key}
                              type="button"
                              onClick={() => toggleMeasurementField(m.key)}
                              className={cn(
                                'text-xs px-3 py-2 rounded-lg border text-left transition-all',
                                isSelected
                                  ? 'bg-brand-ink text-white border-brand-ink'
                                  : 'bg-white hover:bg-brand-cream border-brand-border'
                              )}
                            >
                              {m.label}
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Selected Standard Measurements */}
        {Object.keys(selectedMeasurements).length > 0 && (
          <div>
            <p className="text-sm font-medium text-brand-ink mb-3">Standard Measurements (cm)</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Object.keys(selectedMeasurements).map((key) => {
                const def = STANDARD_MEASUREMENTS.find((m) => m.key === key)
                return (
                  <div key={key} className="relative">
                    <Label className="text-xs text-brand-stone">{def?.label || key}</Label>
                    <div className="flex items-center gap-1 mt-1">
                      <Input
                        type="number"
                        placeholder="0"
                        value={selectedMeasurements[key]}
                        onChange={(e) =>
                          setSelectedMeasurements((prev) => ({ ...prev, [key]: e.target.value }))
                        }
                        className="pr-8"
                      />
                      <button
                        type="button"
                        onClick={() => toggleMeasurementField(key)}
                        className="absolute right-2 top-7 text-brand-stone hover:text-red-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Custom Measurements */}
        <div>
          <p className="text-sm font-medium text-brand-ink mb-2">Custom Measurements</p>
          <p className="text-xs text-brand-stone mb-3">
            Add any measurement not in the standard list above.
          </p>
          <div className="flex gap-2 mb-3">
            <Input
              placeholder="e.g. Torso Length..."
              value={newCustomName}
              onChange={(e) => setNewCustomName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addCustomMeasurement()}
            />
            <Button
              type="button"
              variant="outline"
              onClick={addCustomMeasurement}
              disabled={!newCustomName.trim()}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {customMeasurements.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {customMeasurements.map((cm, idx) => (
                <div key={idx} className="relative">
                  <Label className="text-xs text-brand-stone">{cm.name}</Label>
                  <div className="flex items-center gap-1 mt-1">
                    <Input
                      type="number"
                      placeholder="0"
                      value={cm.value}
                      onChange={(e) =>
                        setCustomMeasurements((prev) =>
                          prev.map((item, i) => (i === idx ? { ...item, value: e.target.value } : item))
                        )
                      }
                      className="pr-8"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setCustomMeasurements((prev) => prev.filter((_, i) => i !== idx))
                      }
                      className="absolute right-2 top-7 text-brand-stone hover:text-red-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notes */}
        <div>
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            placeholder="Any additional notes about these measurements..."
            value={measurementNotes}
            onChange={(e) => setMeasurementNotes(e.target.value)}
            rows={3}
            className="mt-1"
          />
        </div>
      </div>
    </ModalForm>
  )
}