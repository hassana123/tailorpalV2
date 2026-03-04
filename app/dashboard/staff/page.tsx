'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  AlertCircle,

  CheckCircle2,

} from 'lucide-react'
import {
  EMPTY_STAFF_PERMISSIONS,
  StaffPermissionColumn,
  StaffPermissionSet,
  STAFF_PERMISSION_LABELS,
  hasAnyOperationalPermission,
} from '@/lib/staff/permissions'

interface StaffShop {
  id: string
  name: string
  description: string | null
  owner_id: string
}

interface ShopAssignment {
  staffIds: string[]
  shop: StaffShop
  permissions: StaffPermissionSet
}

interface DashboardStats {
  customers: number
  orders: number
  pendingMeasurements: number
  completedMeasurements: number
  inventoryItems: number
}

const ACTIONS: Array<{
  label: string
  description: string
  path: (shopId: string) => string
  permission: StaffPermissionColumn
}> = [
  {
    label: 'Customers',
    description: 'View and manage customer records',
    path: (shopId) => `/dashboard/shop/${shopId}/customers`,
    permission: 'can_manage_customers',
  },
  {
    label: 'Orders',
    description: 'Track and update order workflow',
    path: (shopId) => `/dashboard/shop/${shopId}/orders`,
    permission: 'can_manage_orders',
  },
  {
    label: 'Measurements',
    description: 'Capture and update customer measurements',
    path: (shopId) => `/dashboard/shop/${shopId}/measurements`,
    permission: 'can_manage_measurements',
  },
  {
    label: 'Catalog',
    description: 'Maintain shop catalog items',
    path: (shopId) => `/dashboard/shop/${shopId}/catalog`,
    permission: 'can_manage_catalog',
  },
  {
    label: 'Inventory',
    description: 'Manage stock levels and supplies',
    path: (shopId) => `/dashboard/shop/${shopId}/inventory`,
    permission: 'can_manage_inventory',
  },
]

function mergePermissions(base: StaffPermissionSet, next: StaffPermissionSet): StaffPermissionSet {
  return {
    can_manage_customers: base.can_manage_customers || next.can_manage_customers,
    can_manage_orders: base.can_manage_orders || next.can_manage_orders,
    can_manage_measurements: base.can_manage_measurements || next.can_manage_measurements,
    can_manage_catalog: base.can_manage_catalog || next.can_manage_catalog,
    can_manage_inventory: base.can_manage_inventory || next.can_manage_inventory,
  }
}

export default function StaffDashboardPage() {
  const router = useRouter()
  const [supabase] = useState(() => createClient())
  const [assignments, setAssignments] = useState<ShopAssignment[]>([])
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<DashboardStats>({
    customers: 0,
    orders: 0,
    pendingMeasurements: 0,
    completedMeasurements: 0,
    inventoryItems: 0,
  })

  useEffect(() => {
    void checkUserAndFetchShops()
  }, [])

  const currentAssignment = useMemo(
    () => assignments.find((item) => item.shop.id === selectedShopId) ?? null,
    [assignments, selectedShopId],
  )

  const fetchStatsForShop = async (shopId: string, permissions: StaffPermissionSet) => {
    try {
      const next: DashboardStats = {
        customers: 0,
        orders: 0,
        pendingMeasurements: 0,
        completedMeasurements: 0,
        inventoryItems: 0,
      }

      if (permissions.can_manage_customers) {
        const { count } = await supabase
          .from('customers')
          .select('*', { count: 'exact', head: true })
          .eq('shop_id', shopId)
        next.customers = count || 0
      }

      if (permissions.can_manage_orders) {
        const { count } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('shop_id', shopId)
        next.orders = count || 0
      }

      if (permissions.can_manage_measurements) {
        const { data: measurements } = await supabase
          .from('measurements')
          .select('status')
          .eq('shop_id', shopId)
        next.pendingMeasurements = measurements?.filter((m) => m.status === 'pending').length || 0
        next.completedMeasurements = measurements?.filter((m) => m.status === 'completed').length || 0
      }

      if (permissions.can_manage_inventory) {
        const { count } = await supabase
          .from('shop_inventory_items')
          .select('*', { count: 'exact', head: true })
          .eq('shop_id', shopId)
          .eq('is_active', true)
        next.inventoryItems = count || 0
      }

      setStats(next)
    } catch (err) {
      console.error('Error fetching stats:', err)
      setError('Failed to load stats for this shop')
    }
  }

  const checkUserAndFetchShops = async () => {
    try {
      setLoading(true)
      setError(null)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data: staffRows, error: staffError } = await supabase
        .from('shop_staff')
        .select(
          `
          id,
          shop_id,
          shops(id, name, description, owner_id)
        `,
        )
        .eq('user_id', user.id)
        .eq('status', 'active')

      if (staffError) throw staffError

      if (!staffRows || staffRows.length === 0) {
        router.push('/dashboard/staff/onboarding')
        return
      }

      const normalized = staffRows
        .map((row) => {
          const relation = row.shops as StaffShop | StaffShop[] | null
          const shop = Array.isArray(relation) ? relation[0] ?? null : relation
          if (!shop) return null
          return { staffId: row.id as string, shop }
        })
        .filter((value): value is { staffId: string; shop: StaffShop } => Boolean(value))

      const staffIds = normalized.map((item) => item.staffId)
      let permissionRows: Array<{
        staff_id: string
        can_manage_customers: boolean | null
        can_manage_orders: boolean | null
        can_manage_measurements: boolean | null
        can_manage_catalog: boolean | null
        can_manage_inventory: boolean | null
      }> = []

      if (staffIds.length > 0) {
        const { data, error: permissionError } = await supabase
          .from('shop_staff_permissions')
          .select(
            'staff_id, can_manage_customers, can_manage_orders, can_manage_measurements, can_manage_catalog, can_manage_inventory',
          )
          .in('staff_id', staffIds)

        if (permissionError) throw permissionError
        permissionRows = (data ?? []) as typeof permissionRows
      }

      const permissionMap = permissionRows.reduce<Record<string, StaffPermissionSet>>(
        (acc, row) => {
          acc[row.staff_id] = {
            can_manage_customers: Boolean(row.can_manage_customers),
            can_manage_orders: Boolean(row.can_manage_orders),
            can_manage_measurements: Boolean(row.can_manage_measurements),
            can_manage_catalog: Boolean(row.can_manage_catalog),
            can_manage_inventory: Boolean(row.can_manage_inventory),
          }
          return acc
        },
        {},
      )

      const assignmentsByShop = normalized.reduce<Record<string, ShopAssignment>>((acc, item) => {
        const existing = acc[item.shop.id]
        const nextPermissions = permissionMap[item.staffId] ?? EMPTY_STAFF_PERMISSIONS

        if (existing) {
          existing.staffIds.push(item.staffId)
          existing.permissions = mergePermissions(existing.permissions, nextPermissions)
          return acc
        }

        acc[item.shop.id] = {
          staffIds: [item.staffId],
          shop: item.shop,
          permissions: { ...nextPermissions },
        }
        return acc
      }, {})

      const nextAssignments = Object.values(assignmentsByShop)

      setAssignments(nextAssignments)
      if (nextAssignments.length > 0) {
        setSelectedShopId(nextAssignments[0].shop.id)
        await fetchStatsForShop(nextAssignments[0].shop.id, nextAssignments[0].permissions)
      }
    } catch (err) {
      console.error('Error fetching staff dashboard:', err)
      setError('Failed to load your staff dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handleShopChange = (shopId: string) => {
    setSelectedShopId(shopId)
    const assignment = assignments.find((item) => item.shop.id === shopId)
    if (assignment) {
      void fetchStatsForShop(shopId, assignment.permissions)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (assignments.length === 0) {
    return (
      <div className="container mx-auto py-12 px-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>No shops assigned. Please check your invitations.</AlertDescription>
        </Alert>
      </div>
    )
  }

  const selectedPermissions = currentAssignment?.permissions ?? EMPTY_STAFF_PERMISSIONS

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Staff Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Your access is personalized per shop based on permissions granted by the owner.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Select Shop</CardTitle>
            <CardDescription>Switch between shops you are assigned to.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              {assignments.map((assignment) => (
                <Button
                  key={assignment.shop.id}
                  variant={selectedShopId === assignment.shop.id ? 'default' : 'outline'}
                  onClick={() => handleShopChange(assignment.shop.id)}
                >
                  {assignment.shop.name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Access Summary</CardTitle>
            <CardDescription>
              {currentAssignment?.shop.name ?? 'Selected shop'} permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {(Object.entries(STAFF_PERMISSION_LABELS) as Array<[StaffPermissionColumn, string]>).map(
                ([key, label]) => {
                  const enabled = selectedPermissions[key]
                  return (
                    <span
                      key={key}
                      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
                        enabled
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {enabled && <CheckCircle2 className="h-3 w-3" />}
                      {label}
                    </span>
                  )
                },
              )}
            </div>
            {!hasAnyOperationalPermission(selectedPermissions) && (
              <p className="text-sm text-muted-foreground mt-3">
                No operational permissions have been granted yet. Ask the shop owner to update your access.
              </p>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Customers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.customers}</div>
              <p className="text-xs text-muted-foreground">
                {selectedPermissions.can_manage_customers ? 'Accessible' : 'No access'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.orders}</div>
              <p className="text-xs text-muted-foreground">
                {selectedPermissions.can_manage_orders ? 'Accessible' : 'No access'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Pending Measurements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingMeasurements}</div>
              <p className="text-xs text-muted-foreground">
                {selectedPermissions.can_manage_measurements ? 'Accessible' : 'No access'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Completed Measurements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedMeasurements}</div>
              <p className="text-xs text-muted-foreground">
                {selectedPermissions.can_manage_measurements ? 'Accessible' : 'No access'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Active Inventory</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.inventoryItems}</div>
              <p className="text-xs text-muted-foreground">
                {selectedPermissions.can_manage_inventory ? 'Accessible' : 'No access'}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {ACTIONS.map((action) => {
            const allowed = selectedPermissions[action.permission]
            const selectedShop = currentAssignment?.shop.id
            return (
              <Card key={action.label}>
                <CardHeader>
                  <CardTitle>{action.label}</CardTitle>
                  <CardDescription>{action.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    disabled={!allowed || !selectedShop}
                    onClick={() => {
                      if (!selectedShop) return
                      router.push(action.path(selectedShop))
                    }}
                  >
                    {allowed ? `Open ${action.label}` : 'Access not granted'}
                  </Button>
                </CardContent>
              </Card>
            )
          })}

          <Card>
            <CardHeader>
              <CardTitle>Voice Assistant</CardTitle>
              <CardDescription>Hands-free workflow for allowed operations.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                disabled={!hasAnyOperationalPermission(selectedPermissions) || !currentAssignment?.shop.id}
                onClick={() => {
                  if (!currentAssignment?.shop.id) return
                  router.push(`/dashboard/shop/${currentAssignment.shop.id}/voice-assistant`)
                }}
              >
                {hasAnyOperationalPermission(selectedPermissions) ? 'Open Voice Assistant' : 'Access not granted'}
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Need More Access?</CardTitle>
            <CardDescription>
              Ask your shop owner to update your staff permissions if a section is missing.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-3">
            <Button variant="outline" onClick={() => router.push('/dashboard/staff/onboarding')}>
              View Invitations
            </Button>
            <Button variant="outline" onClick={() => router.push('/dashboard/staff/onboarding')}>
              Re-enter Invite Code
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
