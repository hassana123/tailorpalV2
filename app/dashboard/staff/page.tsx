'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Users, ShoppingCart, Ruler, BarChart3 } from 'lucide-react'

interface StaffShop {
  id: string
  name: string
  description: string | null
  owner_id: string
}

export default function StaffDashboardPage() {
  const router = useRouter()
  const supabase = createClient()
  const [shops, setShops] = useState<StaffShop[]>([])
  const [selectedShop, setSelectedShop] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState({
    customers: 0,
    orders: 0,
    pendingMeasurements: 0,
    completedMeasurements: 0,
  })

  useEffect(() => {
    checkUserAndFetchShops()
  }, [])

  const checkUserAndFetchShops = async () => {
    try {
      setLoading(true)
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      // Check if user has accepted any invitations
      const { data: staffData, error: staffError } = await supabase
        .from('shop_staff')
        .select(
          `
          shop_id,
          shops(id, name, description, owner_id)
        `
        )
        .eq('user_id', user.id)
        .eq('status', 'active')

      if (staffError) throw staffError

      if (!staffData || staffData.length === 0) {
        // No shops yet, redirect to onboarding
        router.push('/dashboard/staff/onboarding')
        return
      }

      const shopsData = staffData
        .map((item) => {
          const relation = item.shops as StaffShop | StaffShop[] | null
          if (!relation) return null
          return Array.isArray(relation) ? relation[0] ?? null : relation
        })
        .filter((shop): shop is StaffShop => !!shop)
      setShops(shopsData)

      if (shopsData.length > 0) {
        setSelectedShop(shopsData[0].id)
        fetchStatsForShop(shopsData[0].id)
      }
    } catch (err) {
      console.error('Error fetching shops:', err)
      setError('Failed to load your shops')
    } finally {
      setLoading(false)
    }
  }

  const fetchStatsForShop = async (shopId: string) => {
    try {
      // Fetch customers count
      const { count: customersCount } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .eq('shop_id', shopId)

      // Fetch orders count
      const { count: ordersCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('shop_id', shopId)

      // Fetch measurements
      const { data: measurements } = await supabase
        .from('measurements')
        .select('status')
        .eq('shop_id', shopId)

      const pending = measurements?.filter((m) => m.status === 'pending').length || 0
      const completed = measurements?.filter((m) => m.status === 'completed').length || 0

      setStats({
        customers: customersCount || 0,
        orders: ordersCount || 0,
        pendingMeasurements: pending,
        completedMeasurements: completed,
      })
    } catch (err) {
      console.error('Error fetching stats:', err)
    }
  }

  const handleShopChange = (shopId: string) => {
    setSelectedShop(shopId)
    fetchStatsForShop(shopId)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (shops.length === 0) {
    return (
      <div className="container mx-auto py-12 px-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>No shops assigned. Please check your invitations.</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Staff Dashboard</h1>
          <p className="text-muted-foreground mt-2">Manage customers, orders, and measurements</p>
        </div>

        {/* Shop Selector */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Select Shop</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              {shops.map((shop) => (
                <Button
                  key={shop.id}
                  variant={selectedShop === shop.id ? 'default' : 'outline'}
                  onClick={() => handleShopChange(shop.id)}
                >
                  {shop.name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.customers}</div>
              <p className="text-xs text-muted-foreground">Shop customers</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.orders}</div>
              <p className="text-xs text-muted-foreground">Total orders</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Ruler className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingMeasurements}</div>
              <p className="text-xs text-muted-foreground">Measurements</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedMeasurements}</div>
              <p className="text-xs text-muted-foreground">Measurements</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for different sections */}
        <Tabs defaultValue="customers" className="space-y-4">
          <TabsList>
            <TabsTrigger value="customers">Customers</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="measurements">Measurements</TabsTrigger>
          </TabsList>

          <TabsContent value="customers" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Customers</CardTitle>
                <CardDescription>Manage and view all shop customers</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => router.push(`/dashboard/shop/${selectedShop}/customers`)}>
                  View Customers
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Orders</CardTitle>
                <CardDescription>View and manage shop orders</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => router.push(`/dashboard/shop/${selectedShop}/orders`)}>
                  View Orders
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="measurements" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Measurements</CardTitle>
                <CardDescription>Track customer measurements</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => router.push(`/dashboard/shop/${selectedShop}/measurements`)}>
                  View Measurements
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
