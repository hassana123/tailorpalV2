import { redirect } from 'next/navigation'
import { requiresRoleSelection } from '@/lib/auth/role'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardResolverPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('user_type')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError && profileError.code !== 'PGRST116') {
    redirect('/auth/login')
  }

  if (requiresRoleSelection(profile)) {
    redirect('/auth/choose-role')
  }

  if (profile?.user_type === 'shop_owner') {
    redirect('/dashboard/shop')
  }

  if (profile?.user_type === 'staff') {
    redirect('/dashboard/staff')
  }

  if (profile?.user_type === 'customer') {
    redirect('/dashboard/customer')
  }

  redirect('/auth/choose-role')
}
