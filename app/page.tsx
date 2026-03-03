'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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
  const searchParams = useSearchParams()
  const supabase = createClient()
  const oauthQuery = searchParams.toString()

  useEffect(() => {
    const params = new URLSearchParams(oauthQuery)
    const hasOAuthParams =
      params.has('code') || params.has('error') || params.has('error_description')

    if (hasOAuthParams) {
      router.replace(oauthQuery ? `/auth/callback?${oauthQuery}` : '/auth/callback')
      return
    }

    void checkAuth()
  }, [oauthQuery])

  const checkAuth = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', user.id)
        .maybeSingle()

      if (profileError && profileError.code !== 'PGRST116') {
        return
      }

      if (requiresRoleSelection(profile)) router.replace('/auth/choose-role')
      else if (profile?.user_type === 'shop_owner') router.replace('/dashboard/shop')
      else if (profile?.user_type === 'staff') router.replace('/dashboard/staff')
      else router.replace('/dashboard/customer')
    } catch {
      // Keep home page interactive if auth/profile checks fail transiently.
    }
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
