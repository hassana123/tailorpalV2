import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { requiresRoleSelection } from '@/lib/auth/role'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // 'next' lets us redirect to a specific page after auth (e.g. /auth/choose-role)
  const next = searchParams.get('next') ?? '/auth/choose-role'

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
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

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Check if user already has a role — if so, skip choose-role
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_type, created_at, updated_at')
          .eq('id', user.id)
          .single()

        if (!requiresRoleSelection(profile)) {
          if (profile?.user_type === 'shop_owner') {
            return NextResponse.redirect(`${origin}/dashboard/shop`)
          }
          if (profile?.user_type === 'staff') {
            return NextResponse.redirect(`${origin}/dashboard/staff`)
          }
          if (profile?.user_type === 'customer') {
            return NextResponse.redirect(`${origin}/marketplace`)
          }
        }
      }

      // No role yet — send to choose-role
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Auth failed — redirect to error page
  return NextResponse.redirect(`${origin}/auth/error?error=auth_callback_failed`)
}
