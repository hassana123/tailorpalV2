import { createServerClient } from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabase/admin'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const schema = z.object({
  userType: z.enum(['shop_owner', 'staff', 'customer']),
})

type DbErrorLike = {
  code?: string
  message?: string
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const authHeader = request.headers.get('authorization')
    const accessToken = authHeader?.startsWith('Bearer ')
      ? authHeader.slice('Bearer '.length)
      : null

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: accessToken
          ? {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          : undefined,
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options),
              )
            } catch {
              // Ignore errors from Server Components
            }
          },
        },
      },
    )

    const parsed = schema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }
    const { userType } = parsed.data

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Upsert ensures missing profile rows are repaired automatically.
    const upsertPayload = {
      id: user.id,
      user_type: userType,
      updated_at: new Date().toISOString(),
    }

    const { error } = await supabase
      .from('profiles')
      .upsert(upsertPayload, { onConflict: 'id' })

    if (error) {
      const dbError = error as DbErrorLike
      if (dbError.code === '42501') {
        try {
          const admin = createAdminClient()
          const { error: adminError } = await admin
            .from('profiles')
            .upsert(upsertPayload, { onConflict: 'id' })

          if (!adminError) {
            return NextResponse.json({ success: true })
          }

          console.error('Admin fallback failed while updating user type:', adminError)
        } catch (adminClientError) {
          console.error('Failed to create admin client for user type fallback:', adminClientError)
        }
      }

      console.error('Error updating user type:', error)
      return NextResponse.json(
        { error: 'Failed to update user role' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in set-user-type:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
