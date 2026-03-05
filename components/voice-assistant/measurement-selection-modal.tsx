'use client'

import { useEffect, useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { ModalForm } from '@/components/dashboard/shared/ModalForm'
import { cn } from '@/lib/utils'
import { VoiceStandardMeasurementOption } from '@/components/voice-assistant/types'

interface MeasurementSelectionModalProps {
  open: boolean
  options: VoiceStandardMeasurementOption[]
  onOpenChange: (open: boolean) => void
  onSubmit: (selectedKeys: string[]) => void
}

export function MeasurementSelectionModal({
  open,
  options,
  onOpenChange,
  onSubmit,
}: MeasurementSelectionModalProps) {
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setSelected({})
    setError('')
  }, [open])

  const categories = useMemo(
    () => Array.from(new Set(options.map((option) => option.category))),
    [options],
  )

  const selectedCount = Object.values(selected).filter(Boolean).length

  const toggleOption = (key: string) => {
    setSelected((previous) => ({ ...previous, [key]: !previous[key] }))
    if (error) setError('')
  }

  const handleSubmit = () => {
    const selectedKeys = options
      .filter((option) => selected[option.key])
      .map((option) => option.key)

    if (!selectedKeys.length) {
      setError('Select at least one standard measurement to continue.')
      return
    }

    onSubmit(selectedKeys)
  }

  return (
    <ModalForm
      open={open}
      onOpenChange={onOpenChange}
      title="Select Standard Measurements"
      description="Choose the standard measurements you want to record first."
      onSubmit={handleSubmit}
      submitLabel="Start Recording"
      maxWidth="2xl"
    >
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-brand-stone">
          <span>Selected</span>
          <Badge variant="secondary">{selectedCount}</Badge>
        </div>

        {categories.map((category) => (
          <div key={category} className="space-y-2">
            <p className="text-sm font-semibold text-brand-ink">{category}</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {options
                .filter((option) => option.category === category)
                .map((option) => {
                  const isSelected = Boolean(selected[option.key])
                  return (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => toggleOption(option.key)}
                      className={cn(
                        'text-xs px-3 py-2 rounded-lg border text-left transition-all',
                        isSelected
                          ? 'bg-brand-ink text-white border-brand-ink'
                          : 'bg-white hover:bg-brand-cream border-brand-border',
                      )}
                    >
                      {option.label}
                    </button>
                  )
                })}
            </div>
          </div>
        ))}

        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    </ModalForm>
  )
}
