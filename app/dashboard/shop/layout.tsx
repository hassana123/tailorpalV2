'use client'

import { ReactNode, useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { AccountProfileDialog } from '@/components/dashboard/layout/AccountProfileDialog'
import { DashboardHeader } from '@/components/dashboard/layout/DashboardHeader'
import { DashboardSidebar } from '@/components/dashboard/layout/DashboardSidebar'
import type { DashboardNavItem } from '@/components/dashboard/layout/types'
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  Package,
  Ruler,
  Mic,
  Settings,
} from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

export default function ShopLayout({ children }: { children: ReactNode }) {
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
  const shopId = pathname.match(/^\/dashboard\/shop\/([^/]+)/)?.[1]

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

  const navItems = useMemo<DashboardNavItem[]>(
    () =>
      shopId
        ? [
            { href: `/dashboard/shop/${shopId}`, label: 'Dashboard', icon: LayoutDashboard },
            { href: `/dashboard/shop/${shopId}/customers`, label: 'Customers', icon: Users },
            { href: `/dashboard/shop/${shopId}/orders`, label: 'Orders', icon: ShoppingCart },
            { href: `/dashboard/shop/${shopId}/catalog`, label: 'Catalog', icon: Package },
            { href: `/dashboard/shop/${shopId}/measurements`, label: 'Measurements', icon: Ruler },
            {
              href: `/dashboard/shop/${shopId}/voice-assistant`,
              label: 'Voice Assistant',
              icon: Mic,
            },
            { href: `/dashboard/shop/${shopId}/staff`, label: 'Staff', icon: Users },
            { href: `/dashboard/shop/${shopId}/settings`, label: 'Settings', icon: Settings },
          ]
        : [{ href: '/dashboard/shop', label: 'Dashboard', icon: LayoutDashboard }],
    [shopId],
  )

  return (
    <>
      <div className="flex h-screen overflow-hidden bg-background">
        <DashboardSidebar
          title="TailorPal"
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
          navItems={navItems}
          isItemActive={(href) =>
            pathname === href || (href !== '/dashboard/shop' && pathname.startsWith(`${href}/`))
          }
        />

        <div className="flex-1 overflow-auto">
          <DashboardHeader
            subtitle={shopId ? 'Shop workspace' : 'Shop dashboard'}
            onOpenProfile={handleOpenProfile}
            onLogout={handleLogout}
          />
          {children}
        </div>
      </div>

      <AccountProfileDialog
        open={profileDialogOpen}
        onOpenChange={setProfileDialogOpen}
        profileLoading={profileLoading}
        profileSaving={profileSaving}
        email={userEmail}
        firstName={firstName}
        lastName={lastName}
        userType={userType}
        onFirstNameChange={setFirstName}
        onLastNameChange={setLastName}
        onSave={handleSaveProfile}
      />
    </>
  )
}
