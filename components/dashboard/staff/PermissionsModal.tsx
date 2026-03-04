'use client'

import { Sparkles } from 'lucide-react'
import { ModalForm } from '@/components/dashboard/shared/ModalForm'
import { PermissionToggle } from './PermissionToggle'
import { StaffMember, StaffPermissions, PERMISSION_KEYS } from '../../../app/dashboard/shop/[shopId]/staff/types'

interface PermissionsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  staff: StaffMember | null
  getPermissionState: (staffId: string) => StaffPermissions
  updatePermissionDraft: (staffId: string, key: keyof Omit<StaffPermissions, 'staff_id'>, value: boolean) => void
  savingPermissionsFor: string | null
  onSave: () => void
}

export function PermissionsModal({
  open,
  onOpenChange,
  staff,
  getPermissionState,
  updatePermissionDraft,
  savingPermissionsFor,
  onSave,
}: PermissionsModalProps) {
  if (!staff) return null

  return (
    <ModalForm
      open={open}
      onOpenChange={onOpenChange}
      title={`Permissions — ${staff.email}`}
      description="Toggle what this staff member can manage in your shop."
      onSubmit={onSave}
      isSubmitting={savingPermissionsFor === staff.id}
      submitLabel="Save Permissions"
      maxWidth="md"
    >
      <div className="space-y-4">
        <div className="bg-brand-cream/40 border border-brand-border rounded-xl p-4 flex items-center gap-3">
          <Sparkles size={16} className="text-brand-gold flex-shrink-0" />
          <p className="text-xs text-brand-stone leading-relaxed">
            Permissions take effect immediately after saving. Staff can only see pages they have access to.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {PERMISSION_KEYS.map(({ key, label }) => (
            <PermissionToggle
              key={key}
              label={label}
              checked={getPermissionState(staff.id)[key]}
              onChange={(v) => updatePermissionDraft(staff.id, key, v)}
            />
          ))}
        </div>
      </div>
    </ModalForm>
  )
}
