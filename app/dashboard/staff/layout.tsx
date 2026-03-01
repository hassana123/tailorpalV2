'use client'

import { ReactNode, useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
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
import {
  LayoutDashboard,
  ClipboardCheck,
  LogOut,
  Menu,
  X,
  User,
} from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

function formatRoleLabel(role: string | null) {
  if (!role) return 'Not set'
  return role
    .split('_')
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ')
}

export default function StaffLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [supabase] = useState(() => createClient())
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [profileDialogOpen, setProfileDialogOpen] = useState(false)
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileSaving, setProfileSaving] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [userType, setUserType] = useState<string | null>(null)

  useEffect(() => {
    void loadAccountProfile()
  }, [])

  const loadAccountProfile = async () => {
    try {
      setProfileLoading(true)
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        return
      }

      setUserId(user.id)
      setUserEmail(user.email ?? '')

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('first_name, last_name, user_type')
        .eq('id', user.id)
        .maybeSingle()

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError
      }

      setFirstName(profile?.first_name ?? '')
      setLastName(profile?.last_name ?? '')
      setUserType(profile?.user_type ?? null)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load profile information'
      toast.error(message)
    } finally {
      setProfileLoading(false)
    }
  }

  const handleOpenProfile = () => {
    setProfileDialogOpen(true)
    void loadAccountProfile()
  }

  const handleSaveProfile = async () => {
    if (!userId) {
      toast.error('Could not load your account. Please sign in again.')
      return
    }

    try {
      setProfileSaving(true)
      const { error } = await supabase
        .from('profiles')
        .upsert(
          {
            id: userId,
            first_name: firstName.trim() || null,
            last_name: lastName.trim() || null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' },
        )

      if (error) {
        throw error
      }

      toast.success('Profile updated successfully.')
      setProfileDialogOpen(false)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update profile'
      toast.error(message)
    } finally {
      setProfileSaving(false)
    }
  }

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      toast.success('Logged out successfully.')
      router.push('/auth/login')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to log out'
      toast.error(message)
    }
  }

  const navItems = [
    { href: '/dashboard/staff', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/staff/onboarding', label: 'Invitations', icon: ClipboardCheck },
  ]

  return (
    <>
      <div className="flex h-screen overflow-hidden bg-background">
        <div
          className={`${
            sidebarOpen ? 'w-64' : 'w-20'
          } transition-all duration-300 border-r bg-muted/50 flex flex-col`}
        >
          <div className="p-4 flex items-center justify-between">
            {sidebarOpen && <h1 className="text-xl font-bold">TailorPal</h1>}
            <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(!sidebarOpen)}>
              {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>

          <nav className="flex-1 p-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {sidebarOpen && <span>{item.label}</span>}
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="flex-1 overflow-auto">
          <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
            <div className="h-16 px-4 md:px-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                  Dashboard
                </p>
                <p className="text-sm font-semibold">Staff workspace</p>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleOpenProfile}>
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">Manage Profile</span>
                </Button>

                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </div>
            </div>
          </header>

          {children}
        </div>
      </div>

      <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Profile</DialogTitle>
            <DialogDescription>Update your account details used across the dashboard.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="profile-email">Email</Label>
              <Input id="profile-email" value={userEmail} disabled />
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="profile-first-name">First name</Label>
                <Input
                  id="profile-first-name"
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  placeholder="First name"
                  disabled={profileLoading}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="profile-last-name">Last name</Label>
                <Input
                  id="profile-last-name"
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
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
            <Button
              variant="outline"
              onClick={() => setProfileDialogOpen(false)}
              disabled={profileSaving}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveProfile} disabled={profileLoading || profileSaving}>
              {profileSaving ? 'Saving...' : 'Save changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
