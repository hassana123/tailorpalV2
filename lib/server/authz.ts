import { createClient } from '@/lib/supabase/server'

export async function getCurrentUser() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  return user
}

export async function isShopOwner(userId: string, shopId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('shops')
    .select('id')
    .eq('id', shopId)
    .eq('owner_id', userId)
    .single()

  if (error) {
    return false
  }

  return !!data
}

export async function hasShopAccess(userId: string, shopId: string) {
  const supabase = await createClient()

  const { data: owned } = await supabase
    .from('shops')
    .select('id')
    .eq('id', shopId)
    .eq('owner_id', userId)
    .single()

  if (owned) {
    return true
  }

  const { data: staff } = await supabase
    .from('shop_staff')
    .select('id')
    .eq('shop_id', shopId)
    .eq('user_id', userId)
    .eq('status', 'active')
    .single()

  return !!staff
}
