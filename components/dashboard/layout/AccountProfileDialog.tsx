'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

function formatRoleLabel(role: string | null) {
  if (!role) return 'Not set'
  return role
    .split('_')
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ')
}

interface AccountProfileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  profileLoading: boolean
  profileSaving: boolean
  email: string
  firstName: string
  lastName: string
  userType: string | null
  onFirstNameChange: (value: string) => void
  onLastNameChange: (value: string) => void
  onSave: () => void
}

export function AccountProfileDialog({
  open,
  onOpenChange,
  profileLoading,
  profileSaving,
  email,
  firstName,
  lastName,
  userType,
  onFirstNameChange,
  onLastNameChange,
  onSave,
}: AccountProfileDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manage Profile</DialogTitle>
          <DialogDescription>Update your account details used across the dashboard.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="profile-email">Email</Label>
            <Input id="profile-email" value={email} disabled />
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="profile-first-name">First name</Label>
              <Input
                id="profile-first-name"
                value={firstName}
                onChange={(event) => onFirstNameChange(event.target.value)}
                placeholder="First name"
                disabled={profileLoading}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="profile-last-name">Last name</Label>
              <Input
                id="profile-last-name"
                value={lastName}
                onChange={(event) => onLastNameChange(event.target.value)}
                placeholder="Last name"
                disabled={profileLoading}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="profile-role">Current role</Label>
            <Input id="profile-role" value={formatRoleLabel(userType)} disabled />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={profileSaving}>
            Cancel
          </Button>
          <Button onClick={onSave} disabled={profileLoading || profileSaving}>
            {profileSaving ? 'Saving...' : 'Save changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
