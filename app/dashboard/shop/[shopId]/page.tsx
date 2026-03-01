'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

interface Shop {
  id: string
  name: string
  description: string | null
  email: string | null
  phone: string | null
  city: string | null
  country: string | null
  rating: number
  total_ratings: number
}

interface DashboardStats {
  customersCount: number
  ordersCount: number
  activeOrdersCount: number
  staffCount: number
}

export default function ShopDashboard() {
  const params = useParams()
  const shopId = params.shopId as string
  const [shop, setShop] = useState<Shop | null>(null)
  const [stats, setStats] = useState<DashboardStats>({
    customersCount: 0,
    ordersCount: 0,
    activeOrdersCount: 0,
    staffCount: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const supabase = createClient()

        // Fetch shop data
        const { data: shopData, error: shopError } = await supabase
          .from('shops')
          .select('*')
          .eq('id', shopId)
          .single()

        if (shopError || !shopData) {
          throw new Error('Shop not found')
        }

        setShop(shopData as Shop)

        // Fetch stats
        const { count: customersCount } = await supabase
          .from('customers')
          .select('*', { count: 'exact', head: true })
          .eq('shop_id', shopId)

        const { count: ordersCount } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('shop_id', shopId)

        const { count: activeOrdersCount } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('shop_id', shopId)
          .in('status', ['pending', 'in_progress'])

        const { count: staffCount } = await supabase
          .from('shop_staff')
          .select('*', { count: 'exact', head: true })
          .eq('shop_id', shopId)
          .eq('status', 'active')

        setStats({
          customersCount: customersCount || 0,
          ordersCount: ordersCount || 0,
          activeOrdersCount: activeOrdersCount || 0,
          staffCount: staffCount || 0,
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard')
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [shopId])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading dashboard...</p>
      </div>
    )
  }

  if (error || !shop) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-500">{error || 'Shop not found'}</p>
            <Button className="mt-4 w-full" onClick={() => router.push('/dashboard/shop')}>
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-6 md:p-10">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-4xl font-bold">{shop.name}</h1>
            <p className="mt-2 text-muted-foreground">{shop.description}</p>
          </div>
          <Link href={`/dashboard/shop/${shopId}/settings`}>
            <Button variant="outline">Settings</Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="mb-8 grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Customers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.customersCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.ordersCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {stats.activeOrdersCount}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Staff Members
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.staffCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Link href={`/dashboard/shop/${shopId}/customers`}>
              <Button className="w-full">Manage Customers</Button>
            </Link>
            <Link href={`/dashboard/shop/${shopId}/orders`}>
              <Button className="w-full">View Orders</Button>
            </Link>
            <Link href={`/dashboard/shop/${shopId}/catalog`}>
              <Button className="w-full">Manage Catalog</Button>
            </Link>
            <Link href={`/dashboard/shop/${shopId}/staff`}>
              <Button className="w-full">Manage Staff</Button>
            </Link>
            <Link href={`/dashboard/shop/${shopId}/settings`}>
              <Button className="w-full" variant="outline">
                Shop Settings
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
