import { createClient } from '@/lib/supabase/server'

export interface StaffMember {
  id: string
  shop_id: string
  user_id: string | null
  email: string
  role: 'staff' | 'manager'
  status: 'pending' | 'active' | 'revoked'
  invited_at: string
  accepted_at: string | null
  created_at: string
}

export async function getShopStaff(shopId: string): Promise<StaffMember[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('shop_staff')
    .select('*')
    .eq('shop_id', shopId)
    .order('invited_at', { ascending: false })

  if (error) {
    console.error('Error fetching staff:', error)
    return []
  }

  return data as StaffMember[]
}

export async function getUserShops(userId: string): Promise<Array<{ shop_id: string; status: string }>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('shop_staff')
    .select('shop_id, status')
    .eq('user_id', userId)
    .eq('status', 'active')

  if (error) {
    console.error('Error fetching user shops:', error)
    return []
  }

  return data || []
}

export async function removeStaffMember(staffId: string): Promise<boolean> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('shop_staff')
    .update({ status: 'revoked' })
    .eq('id', staffId)

  if (error) {
    console.error('Error removing staff:', error)
    return false
  }

  return true
}

export async function isShopStaff(userId: string, shopId: string): Promise<boolean> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('shop_staff')
    .select('id')
    .eq('user_id', userId)
    .eq('shop_id', shopId)
    .eq('status', 'active')
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error checking staff status:', error)
  }

  return !!data
}
