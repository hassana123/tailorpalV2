'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ShopDashboardRedirect() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    redirectToShop()
  }, [])

  const redirectToShop = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      // Get user's shops
      const { data: shops, error } = await supabase
        .from('shops')
        .select('id')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: true })
        .limit(1)

      if (error) {
        throw error
      }

      if (shops && shops.length > 0) {
        router.push(`/dashboard/shop/${shops[0].id}`)
      } else {
        // No shop yet, redirect to setup
        router.push('/dashboard/shop/setup')
      }
    } catch (err) {
      console.error('Error redirecting:', err)
      router.push('/auth/login')
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  )
}
