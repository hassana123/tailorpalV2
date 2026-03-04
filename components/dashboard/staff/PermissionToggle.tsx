import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PermissionToggleProps {
  label: string
  checked: boolean
  onChange: (value: boolean) => void
}

export function PermissionToggle({ label, checked, onChange }: PermissionToggleProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        'flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg border transition-all',
        checked
          ? 'bg-brand-ink text-white border-brand-ink'
          : 'bg-white text-brand-stone border-brand-border hover:bg-brand-cream'
      )}
    >
      {checked && <Check size={11} strokeWidth={2.5} />}
      {label}
    </button>
  )
}
