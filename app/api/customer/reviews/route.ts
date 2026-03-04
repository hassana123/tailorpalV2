import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('shop_ratings')
      .select('id, shop_id, rating, comment, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(8)

    if (error) {
      console.error('Failed to fetch customer reviews:', error)
      return NextResponse.json({ error: 'Failed to load reviews' }, { status: 500 })
    }

    return NextResponse.json({ reviews: data ?? [] })
  } catch (error) {
    console.error('Customer reviews endpoint error:', error)
    return NextResponse.json({ error: 'Failed to load reviews' }, { status: 500 })
  }
}
