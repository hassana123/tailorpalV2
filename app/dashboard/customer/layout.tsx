'use client'

import Link from 'next/link'
import { ReactNode, useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { AccountProfileDialog } from '@/components/dashboard/layout/AccountProfileDialog'
import { DashboardHeader } from '@/components/dashboard/layout/DashboardHeader'
import { DashboardSidebar } from '@/components/dashboard/layout/DashboardSidebar'
import { MobileBottomNav } from '@/components/dashboard/layout/MobileBottomNav'
import type { DashboardNavItem } from '@/components/dashboard/layout/types'
import { Compass, LayoutDashboard, Package, X } from 'lucide-react'

export default function CustomerLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [supabase] = useState(() => createClient())
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [profileDialogOpen, setProfileDialogOpen] = useState(false)
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileSaving, setProfileSaving] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [userType, setUserType] = useState<string | null>(null)

  const navItems: DashboardNavItem[] = [
    { href: '/dashboard/customer', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/customer/my-requests', label: 'My Requests', icon: Package },
    { href: '/dashboard/customer/marketplace', label: 'Marketplace', icon: Compass },
  ]

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
        router.replace('/auth/login')
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

      const currentType = profile?.user_type ?? null
      if (!currentType) {
        router.replace('/auth/choose-role')
        return
      }
      if (currentType === 'shop_owner') {
        router.replace('/dashboard/shop')
        return
      }
      if (currentType === 'staff') {
        router.replace('/dashboard/staff')
        return
      }

      setFirstName(profile?.first_name ?? '')
      setLastName(profile?.last_name ?? '')
      setUserType(currentType)
      setAuthChecked(true)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load profile information'
      toast.error(message)
      setAuthChecked(true)
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
      router.replace('/auth/login')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to log out'
      toast.error(message)
    }
  }

  const isItemActive = (href: string) =>
    pathname === href || (href !== '/dashboard/customer' && pathname.startsWith(`${href}/`))

  const primaryNavItems = useMemo(() => navItems, [navItems])
  const secondaryNavItems = useMemo<DashboardNavItem[]>(() => [], [])

  if (!authChecked) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-brand-cream">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-ink" />
      </div>
    )
  }

  return (
    <>
      <div className="flex h-screen overflow-hidden bg-brand-cream">
        <div className="hidden lg:block">
          <DashboardSidebar
            title="TailorPal"
            onLogout={handleLogout}
            sidebarOpen={sidebarOpen}
            onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
            navItems={navItems}
            isItemActive={isItemActive}
          />
        </div>

        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="absolute left-0 top-0 h-full w-72 bg-white shadow-2xl animate-slide-in-left">
              <div className="flex items-center justify-between p-4 border-b border-brand-border">
                <span className="font-display text-xl text-brand-ink">TailorPal</span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-lg hover:bg-brand-cream"
                >
                  <X size={20} className="text-brand-stone" />
                </button>
              </div>
              <nav className="p-4 space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon
                  const active = isItemActive(item.href)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                        active
                          ? 'bg-brand-ink text-white'
                          : 'text-brand-stone hover:text-brand-ink hover:bg-brand-cream'
                      }`}
                    >
                      <Icon size={18} />
                      {item.label}
                    </Link>
                  )
                })}
                <div className="pt-4 mt-4 border-t border-brand-border">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50"
                  >
                    <span>Logout</span>
                  </button>
                </div>
              </nav>
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col overflow-hidden">
          <DashboardHeader
            subtitle="Customer workspace"
            onOpenProfile={handleOpenProfile}
            onLogout={handleLogout}
            onMenuClick={() => setMobileMenuOpen(true)}
          />
          <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">{children}</main>
        </div>
      </div>

      <MobileBottomNav
        items={primaryNavItems}
        moreItems={secondaryNavItems}
        isItemActive={isItemActive}
        onMoreClick={() => setMobileMenuOpen(true)}
      />

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
