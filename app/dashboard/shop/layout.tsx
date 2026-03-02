'use client'

import { ReactNode, useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { AccountProfileDialog } from '@/components/dashboard/layout/AccountProfileDialog'
import { DashboardHeader }      from '@/components/dashboard/layout/DashboardHeader'
import { DashboardSidebar }     from '@/components/dashboard/layout/DashboardSidebar'
import { MobileBottomNav } from '@/components/dashboard/layout/MobileBottomNav'
import type { DashboardNavItem } from '@/components/dashboard/layout/types'
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  Package,
  Ruler,
  Mic,
  Settings,
  X
} from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

export default function ShopLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router   = useRouter()
  const [supabase] = useState(() => createClient())

  const [sidebarOpen, setSidebarOpen]         = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen]   = useState(false)
  const [profileDialogOpen, setProfileDialogOpen] = useState(false)
  const [profileLoading, setProfileLoading]   = useState(false)
  const [profileSaving, setProfileSaving]     = useState(false)

  const [userId, setUserId]     = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName]   = useState('')
  const [userType, setUserType]   = useState<string | null>(null)
  const [shopName, setShopName]   = useState('')

  const shopId = pathname.match(/^\/dashboard\/shop\/([^/]+)/)?.[1]

  useEffect(() => { void loadAccountProfile() }, [])

  const loadAccountProfile = async () => {
    try {
      setProfileLoading(true)
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) return

      setUserId(user.id)
      setUserEmail(user.email ?? '')

      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name, user_type')
        .eq('id', user.id)
        .maybeSingle()

      setFirstName(profile?.first_name ?? '')
      setLastName(profile?.last_name ?? '')
      setUserType(profile?.user_type ?? null)

      if (shopId) {
        const { data: shop } = await supabase
          .from('shops')
          .select('name')
          .eq('id', shopId)
          .maybeSingle()
        setShopName(shop?.name ?? '')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load profile')
    } finally {
      setProfileLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!userId) return toast.error('Could not load your account. Please sign in again.')
    try {
      setProfileSaving(true)
      const { error } = await supabase
        .from('profiles')
        .upsert(
          { id: userId, first_name: firstName.trim() || null, last_name: lastName.trim() || null, updated_at: new Date().toISOString() },
          { onConflict: 'id' },
        )
      if (error) throw error
      toast.success('Profile updated successfully.')
      setProfileDialogOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update profile')
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
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to log out')
    }
  }

  const navItems = useMemo<DashboardNavItem[]>(
    () =>
      shopId
        ? [
            { href: `/dashboard/shop/${shopId}`,                  label: 'Dashboard',       icon: LayoutDashboard },
            { href: `/dashboard/shop/${shopId}/customers`,         label: 'Customers',       icon: Users           },
            { href: `/dashboard/shop/${shopId}/orders`,            label: 'Orders',          icon: ShoppingCart    },
            { href: `/dashboard/shop/${shopId}/catalog`,           label: 'Catalog',         icon: Package         },
            { href: `/dashboard/shop/${shopId}/measurements`,      label: 'Measurements',    icon: Ruler           },
            { href: `/dashboard/shop/${shopId}/voice-assistant`,   label: 'Voice',           icon: Mic             },
            { href: `/dashboard/shop/${shopId}/staff`,             label: 'Staff',           icon: Users           },
            { href: `/dashboard/shop/${shopId}/settings`,          label: 'Settings',        icon: Settings        },
          ]
        : [{ href: '/dashboard/shop', label: 'Dashboard', icon: LayoutDashboard }],
    [shopId],
  )

  // Primary items for bottom nav (max 5 for mobile UX)
  const primaryNavItems = useMemo(() => 
    navItems.filter(item => 
      ['Dashboard', 'Customers', 'Orders', 'Catalog', 'Voice'].includes(item.label)
    ), [navItems]
  )

  // More menu items
  const secondaryNavItems = useMemo(() => 
    navItems.filter(item => 
      !['Dashboard', 'Customers', 'Orders', 'Catalog', 'Voice'].includes(item.label)
    ), [navItems]
  )

  const isItemActive = (href: string) =>
    pathname === href ||
    (href !== `/dashboard/shop/${shopId}` && pathname.startsWith(`${href}/`))

  return (
    <>
      <div className="flex h-screen overflow-hidden bg-brand-cream">
        {/* Desktop Sidebar - Hidden on mobile */}
        <div className="hidden lg:block">
          <DashboardSidebar
            title="TailorPal"
            sidebarOpen={sidebarOpen}
            onToggleSidebar={() => setSidebarOpen((p) => !p)}
            navItems={navItems}
            isItemActive={isItemActive}
            onLogout={handleLogout}
          />
        </div>

        {/* Mobile Sidebar Drawer */}
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
                    <a
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
                    </a>
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
          {/* Header - Responsive */}
          <DashboardHeader
            subtitle={shopName || 'Shop Dashboard'}
            shopName={shopName}
            firstName={firstName}
            lastName={lastName}
            onOpenProfile={() => { setProfileDialogOpen(true); void loadAccountProfile() }}
            onLogout={handleLogout}
            onMenuClick={() => setMobileMenuOpen(true)}
          />
          
          {/* Main Content */}
          <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
            {children}
          </main>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
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