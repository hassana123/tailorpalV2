'use client'

import { ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { AccountProfileDialog } from '@/components/dashboard/layout/AccountProfileDialog'
import { DashboardHeader }      from '@/components/dashboard/layout/DashboardHeader'
import { DashboardSidebar }     from '@/components/dashboard/layout/DashboardSidebar'
import { MobileBottomNav } from '@/components/dashboard/layout/MobileBottomNav'
import { FloatingVoiceAssistant } from '@/components/dashboard/layout/FloatingVoiceAssistant'
import type { DashboardNavItem } from '@/components/dashboard/layout/types'
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  Package,
  Boxes,
  Ruler,
  Mic,
  Settings,
  X
} from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import {
  EMPTY_STAFF_PERMISSIONS,
  hasAnyOperationalPermission,
  StaffPermissionSet,
} from '@/lib/staff/permissions'

type RouteGate =
  | { allowed: true }
  | { allowed: false; message: string; redirectTo: string }

type StaffPermissionRow = {
  can_manage_customers: boolean | null
  can_manage_orders: boolean | null
  can_manage_measurements: boolean | null
  can_manage_catalog: boolean | null
  can_manage_inventory: boolean | null
}

function mergeStaffPermissions(rows: StaffPermissionRow[]): StaffPermissionSet {
  return rows.reduce<StaffPermissionSet>(
    (acc, row) => ({
      can_manage_customers: acc.can_manage_customers || Boolean(row.can_manage_customers),
      can_manage_orders: acc.can_manage_orders || Boolean(row.can_manage_orders),
      can_manage_measurements: acc.can_manage_measurements || Boolean(row.can_manage_measurements),
      can_manage_catalog: acc.can_manage_catalog || Boolean(row.can_manage_catalog),
      can_manage_inventory: acc.can_manage_inventory || Boolean(row.can_manage_inventory),
    }),
    EMPTY_STAFF_PERMISSIONS,
  )
}

function getStaffRouteGate(
  pathname: string,
  shopId: string,
  permissions: StaffPermissionSet,
): RouteGate {
  const base = `/dashboard/shop/${shopId}`
  if (pathname === base || pathname.startsWith(`${base}/voice-assistant`)) {
    if (pathname.startsWith(`${base}/voice-assistant`) && !hasAnyOperationalPermission(permissions)) {
      return {
        allowed: false,
        message: 'You do not have access to Voice Assistant in this shop.',
        redirectTo: '/dashboard/staff',
      }
    }
    return { allowed: true }
  }

  if (pathname.startsWith(`${base}/customers`) && !permissions.can_manage_customers) {
    return {
      allowed: false,
      message: 'You do not have customer access for this shop.',
      redirectTo: '/dashboard/staff',
    }
  }

  if (pathname.startsWith(`${base}/orders`) && !permissions.can_manage_orders) {
    return {
      allowed: false,
      message: 'You do not have order access for this shop.',
      redirectTo: '/dashboard/staff',
    }
  }

  if (pathname.startsWith(`${base}/measurements`) && !permissions.can_manage_measurements) {
    return {
      allowed: false,
      message: 'You do not have measurements access for this shop.',
      redirectTo: '/dashboard/staff',
    }
  }

  if (pathname.startsWith(`${base}/catalog`) && !permissions.can_manage_catalog) {
    return {
      allowed: false,
      message: 'You do not have catalog access for this shop.',
      redirectTo: '/dashboard/staff',
    }
  }

  if (pathname.startsWith(`${base}/inventory`) && !permissions.can_manage_inventory) {
    return {
      allowed: false,
      message: 'You do not have inventory access for this shop.',
      redirectTo: '/dashboard/staff',
    }
  }

  if (pathname.startsWith(`${base}/staff`) || pathname.startsWith(`${base}/settings`)) {
    return {
      allowed: false,
      message: 'Only the shop owner can access this section.',
      redirectTo: '/dashboard/staff',
    }
  }

  return { allowed: true }
}

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
  const [isOwnerForShop, setIsOwnerForShop] = useState(false)
  const [isStaffForShop, setIsStaffForShop] = useState(false)
  const [staffPermissions, setStaffPermissions] = useState<StaffPermissionSet>(EMPTY_STAFF_PERMISSIONS)
  const [staffPermissionsLoaded, setStaffPermissionsLoaded] = useState(false)
  const deniedPathRef = useRef<string | null>(null)

  const shopId = pathname.match(/^\/dashboard\/shop\/([^/]+)/)?.[1]

  useEffect(() => { void loadAccountProfile() }, [shopId])

  const loadAccountProfile = async () => {
    try {
      setProfileLoading(true)
      setStaffPermissionsLoaded(false)
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
          .select('name, owner_id')
          .eq('id', shopId)
          .maybeSingle()

        const isOwner = Boolean(shop?.owner_id && shop.owner_id === user.id)
        setIsOwnerForShop(isOwner)
        setShopName(shop?.name ?? '')

        if (!isOwner) {
          const { data: memberships } = await supabase
            .from('shop_staff')
            .select('id')
            .eq('shop_id', shopId)
            .eq('user_id', user.id)
            .eq('status', 'active')
            .order('updated_at', { ascending: false })

          const staffIds = (memberships ?? []).map((membership) => membership.id)
          if (staffIds.length === 0) {
            setIsStaffForShop(false)
            setStaffPermissions(EMPTY_STAFF_PERMISSIONS)
            setStaffPermissionsLoaded(true)
            router.replace('/dashboard/staff')
            return
          }

          setIsStaffForShop(true)

          const { data: permissions, error: permissionsError } = await supabase
            .from('shop_staff_permissions')
            .select(
              'can_manage_customers, can_manage_orders, can_manage_measurements, can_manage_catalog, can_manage_inventory',
            )
            .in('staff_id', staffIds)

          if (permissionsError) {
            throw permissionsError
          }

          setStaffPermissions(mergeStaffPermissions((permissions ?? []) as StaffPermissionRow[]))
          setStaffPermissionsLoaded(true)
        } else {
          setIsStaffForShop(false)
          setStaffPermissions(EMPTY_STAFF_PERMISSIONS)
          setStaffPermissionsLoaded(true)
        }
      } else {
        setIsOwnerForShop(false)
        setIsStaffForShop(false)
        setStaffPermissions(EMPTY_STAFF_PERMISSIONS)
        setStaffPermissionsLoaded(true)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load profile')
      setStaffPermissionsLoaded(true)
    } finally {
      setProfileLoading(false)
    }
  }

  useEffect(() => {
    if (!shopId) return
    if (!staffPermissionsLoaded) return
    if (isOwnerForShop || !isStaffForShop) {
      deniedPathRef.current = null
      return
    }

    const gate = getStaffRouteGate(pathname, shopId, staffPermissions)
    if (!gate.allowed && deniedPathRef.current !== pathname) {
      deniedPathRef.current = pathname
      toast.error(gate.message)
      router.replace(gate.redirectTo)
      return
    }

    if (gate.allowed) {
      deniedPathRef.current = null
    }
  }, [isOwnerForShop, isStaffForShop, pathname, router, shopId, staffPermissions, staffPermissionsLoaded])

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
    () => {
      if (!shopId) {
        return [{ href: '/dashboard/shop', label: 'Dashboard', icon: LayoutDashboard }]
      }

      const ownerNav: DashboardNavItem[] = [
        { href: `/dashboard/shop/${shopId}`, label: 'Dashboard', icon: LayoutDashboard },
        { href: `/dashboard/shop/${shopId}/customers`, label: 'Customers', icon: Users },
        { href: `/dashboard/shop/${shopId}/orders`, label: 'Orders', icon: ShoppingCart },
        { href: `/dashboard/shop/${shopId}/catalog`, label: 'Catalog', icon: Package },
        { href: `/dashboard/shop/${shopId}/inventory`, label: 'Inventory', icon: Boxes },
        { href: `/dashboard/shop/${shopId}/measurements`, label: 'Measurements', icon: Ruler },
        { href: `/dashboard/shop/${shopId}/voice-assistant`, label: 'Voice Assistant', icon: Mic },
        { href: `/dashboard/shop/${shopId}/staff`, label: 'Staff', icon: Users },
        { href: `/dashboard/shop/${shopId}/settings`, label: 'Settings', icon: Settings },
      ]

      if (!isStaffForShop || isOwnerForShop) {
        return ownerNav
      }

      const staffNav: DashboardNavItem[] = [
        { href: `/dashboard/shop/${shopId}`, label: 'Dashboard', icon: LayoutDashboard },
      ]

      if (staffPermissions.can_manage_customers) {
        staffNav.push({ href: `/dashboard/shop/${shopId}/customers`, label: 'Customers', icon: Users })
      }
      if (staffPermissions.can_manage_orders) {
        staffNav.push({ href: `/dashboard/shop/${shopId}/orders`, label: 'Orders', icon: ShoppingCart })
      }
      if (staffPermissions.can_manage_catalog) {
        staffNav.push({ href: `/dashboard/shop/${shopId}/catalog`, label: 'Catalog', icon: Package })
      }
      if (staffPermissions.can_manage_inventory) {
        staffNav.push({ href: `/dashboard/shop/${shopId}/inventory`, label: 'Inventory', icon: Boxes })
      }
      if (staffPermissions.can_manage_measurements) {
        staffNav.push({ href: `/dashboard/shop/${shopId}/measurements`, label: 'Measurements', icon: Ruler })
      }
      if (hasAnyOperationalPermission(staffPermissions)) {
        staffNav.push({ href: `/dashboard/shop/${shopId}/voice-assistant`, label: 'Voice Assistant', icon: Mic })
      }

      return staffNav
    },
    [isOwnerForShop, isStaffForShop, shopId, staffPermissions],
  )

  // Primary items for bottom nav (max 5 for mobile UX)
  const primaryNavItems = useMemo(() => 
    navItems.filter(item => 
      ['Dashboard', 'Customers', 'Orders', 'Catalog', 'Inventory'].includes(item.label)
    ), [navItems]
  )

  // More menu items
  const secondaryNavItems = useMemo(() => 
    navItems.filter(item => 
      !['Dashboard', 'Customers', 'Orders', 'Catalog', 'Inventory'].includes(item.label)
    ), [navItems]
  )

  const isItemActive = (href: string) =>
    pathname === href ||
    (href !== `/dashboard/shop/${shopId}` && pathname.startsWith(`${href}/`))

  const hideFloatingAssistant =
    !shopId || pathname.startsWith(`/dashboard/shop/${shopId}/voice-assistant`)

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

      {shopId && (
        <FloatingVoiceAssistant
          shopId={shopId}
          hidden={hideFloatingAssistant}
        />
      )}

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
