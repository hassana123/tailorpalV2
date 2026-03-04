'use client'

import { useState } from 'react'
import { DataTable } from '@/components/dashboard/shared/DataTable'
import { ConfirmDialog } from '@/components/dashboard/shared/ConfirmDialog'

import { useStaffManagement } from '../../../../../hooks/staff/useStaffManagement'
import { StaffHeader } from '../../../../../components/dashboard/staff/StaffHeader'
import { StatsGrid } from '../../../../../components/dashboard/staff/StatsGrid'
import { LoadingState } from '../../../../../components/dashboard/shared/LoadingState'
import { InviteModal } from '../../../../../components/dashboard/staff/InviteModal'
import { InviteResultModal } from '../../../../../components/dashboard/staff/InviteResultModal'
import { PermissionsModal } from '../../../../../components/dashboard/staff/PermissionsModal'
import { useStaffColumns } from '../../../../../components/dashboard/staff/staffColumns'
import { useInvitationColumns } from '../../../../../components/dashboard/staff/invitationColumns'
import { DeliveryMethod, StaffMember } from './types'


export default function StaffManagementPage() {
  const {
    staff,
    invitations,
    isLoading,
    error,
    getPermissionState,
    updatePermissionDraft,
    savePermissions,
    savingPermissionsFor,
    handleInviteStaff,
    isInviting,
    refreshInvitation,
    sharingInviteId,
    handleRemoveStaff,
    handleDeleteStaffRecord,
    deleteInvitation,
    deletingStaffId,
    deletingInviteId,
    latestInvite,
    buildStaffSignUpLink,
    buildInviteInstructionsText,
    shareInvite,
  } = useStaffManagement()

  // Modal state
  const [inviteModalOpen, setInviteModalOpen] = useState(false)
  const [inviteResultOpen, setInviteResultOpen] = useState(false)
  const [permissionsModalOpen, setPermissionsModalOpen] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null)

  // Form state
  const [newEmail, setNewEmail] = useState('')
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('supabase_email')

  // Confirmation dialogs
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [confirmDialogConfig, setConfirmDialogConfig] = useState<{
    title: string
    description: string
    confirmLabel: string
    variant: 'default' | 'destructive'
    onConfirm: () => void
  }>({
    title: '',
    description: '',
    confirmLabel: 'Confirm',
    variant: 'default',
    onConfirm: () => {},
  })

  // Staff table
  const { columns: staffColumns, actions: staffActions } = useStaffColumns({
    getPermissionState,
    deletingStaffId,
    onManagePermissions: (member) => {
      setSelectedStaff(member)
      setPermissionsModalOpen(true)
    },
    onRemoveStaff: (staffId) => {
      setConfirmDialogConfig({
        title: 'Remove Staff Access',
        description: 'Remove this staff member access? You can restore by inviting again.',
        confirmLabel: 'Remove',
        variant: 'destructive',
        onConfirm: () => handleRemoveStaff(staffId),
      })
      setConfirmDialogOpen(true)
    },
    onDeleteStaffRecord: (staffId) => {
      setConfirmDialogConfig({
        title: 'Delete Staff Record',
        description: 'Delete this staff record permanently? This cannot be undone.',
        confirmLabel: 'Delete',
        variant: 'destructive',
        onConfirm: () => handleDeleteStaffRecord(staffId),
      })
      setConfirmDialogOpen(true)
    },
  })

  // Invitation table
  const { columns: invitationColumns, actions: invitationActions } = useInvitationColumns({
    sharingInviteId,
    deletingInviteId,
    onRefreshInvitation: refreshInvitation,
    onDeleteInvitation: (invitationId) => {
      setConfirmDialogConfig({
        title: 'Delete Invitation',
        description: 'Delete this invitation? This action cannot be undone.',
        confirmLabel: 'Delete',
        variant: 'destructive',
        onConfirm: () => deleteInvitation(invitationId),
      })
      setConfirmDialogOpen(true)
    },
  })

  // Handlers
  const handleInviteSubmit = async () => {
    await handleInviteStaff(newEmail, deliveryMethod)
    setNewEmail('')
    setInviteModalOpen(false)
    setInviteResultOpen(true)
  }

  const handlePermissionsSave = async () => {
    if (selectedStaff) {
      await savePermissions(selectedStaff.id)
      setPermissionsModalOpen(false)
    }
  }

  if (isLoading) {
    return <LoadingState />
  }

  return (
    <div className="p-4 lg:p-6 xl:p-8 space-y-6">
      <StaffHeader onInvite={() => setInviteModalOpen(true)} />
      <StatsGrid staff={staff} invitations={invitations} />

      {/* Staff table */}
      <div className="bg-white rounded-2xl border border-brand-border p-4 lg:p-6">
        <div className="mb-4">
          <h2 className="font-display text-lg text-brand-ink">Staff Members</h2>
          <p className="text-xs text-brand-stone mt-0.5">{staff.length} total members</p>
        </div>
        <DataTable
          data={staff}
          columns={staffColumns}
          keyExtractor={(m) => m.id}
          searchKeys={['email', 'status']}
          emptyMessage="No staff members yet. Invite someone to get started."
          actions={staffActions}
        />
      </div>

      {/* Invitations table */}
      <div className="bg-white rounded-2xl border border-brand-border p-4 lg:p-6">
        <div className="mb-4">
          <h2 className="font-display text-lg text-brand-ink">Pending Invitations</h2>
          <p className="text-xs text-brand-stone mt-0.5">Refresh, resend, or delete invitations</p>
        </div>
        <DataTable
          data={invitations}
          columns={invitationColumns}
          keyExtractor={(i) => i.id}
          searchKeys={['email', 'status']}
          emptyMessage="No invitations yet."
          actions={invitationActions}
        />
      </div>

      {/* Modals */}
      <InviteModal
        open={inviteModalOpen}
        onOpenChange={setInviteModalOpen}
        email={newEmail}
        onEmailChange={setNewEmail}
        deliveryMethod={deliveryMethod}
        onDeliveryMethodChange={setDeliveryMethod}
        error={error}
        isInviting={isInviting}
        onSubmit={handleInviteSubmit}
      />

      <InviteResultModal
        open={inviteResultOpen}
        onOpenChange={setInviteResultOpen}
        invite={latestInvite}
        buildStaffSignUpLink={buildStaffSignUpLink}
        buildInviteInstructionsText={buildInviteInstructionsText}
        onShare={shareInvite}
      />

      <PermissionsModal
        open={permissionsModalOpen}
        onOpenChange={setPermissionsModalOpen}
        staff={selectedStaff}
        getPermissionState={getPermissionState}
        updatePermissionDraft={updatePermissionDraft}
        savingPermissionsFor={savingPermissionsFor}
        onSave={handlePermissionsSave}
      />

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        title={confirmDialogConfig.title}
        description={confirmDialogConfig.description}
        confirmLabel={confirmDialogConfig.confirmLabel}
        variant={confirmDialogConfig.variant}
        onConfirm={confirmDialogConfig.onConfirm}
      />
    </div>
  )
}
