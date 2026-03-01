'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { requiresRoleSelection } from '@/lib/auth/role'

import { Navbar }              from '@/components/layout/Navbar'
import { Footer }              from '@/components/layout/Footer'
import { Hero }                from '@/components/home/Hero'
import { TrustedStrip } from '@/components/home/TrustedStripe'
import { StatsSection }        from '@/components/home/StatsSection'
import { FeaturesSection } from '@/components/home/FeautureSection'
import { HowItWorks }          from '@/components/home/HowItWorks'
import { TestimonialsSection } from '@/components/home/TestimonialsSection'
import { FinalCTA }            from '@/components/home/FinalCTA'

export default function HomePage() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_type, created_at, updated_at')
      .eq('id', user.id)
      .single()
    if (requiresRoleSelection(profile))           router.push('/auth/choose-role')
    else if (profile?.user_type === 'shop_owner') router.push('/dashboard/shop')
    else if (profile?.user_type === 'staff')      router.push('/dashboard/staff')
    else                                          router.push('/marketplace')
  }

  return (
    <div className="min-h-screen bg-brand-cream overflow-x-hidden">
      <Navbar />
      <Hero />
      <TrustedStrip />
      <StatsSection />
      <FeaturesSection />
      <HowItWorks />
      <TestimonialsSection />
      <FinalCTA />
      <Footer />
    </div>
  )
}