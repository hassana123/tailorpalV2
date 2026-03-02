import { getAuthErrorMessage } from '@/lib/auth/errors'
import { requiresRoleSelection } from '@/lib/auth/role'
import { getRequestAppUrl, getSafeNextPath } from '@/lib/utils/app-url'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

function buildAuthErrorRedirect(appUrl: string, errorCode: string) {
  const url = new URL('/auth/error', appUrl)
  url.searchParams.set('error', errorCode)
  return NextResponse.redirect(url)
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const appUrl = getRequestAppUrl(request)
  const code = searchParams.get('code')
  const oauthError = searchParams.get('error')
  const oauthErrorDescription = searchParams.get('error_description')
  const requestedNext = searchParams.get('next')
  const next = getSafeNextPath(requestedNext)

  if (oauthError || oauthErrorDescription) {
    const message = getAuthErrorMessage(
      new Error([oauthError, oauthErrorDescription].filter(Boolean).join(': ')),
      'oauth_error',
    )
    return buildAuthErrorRedirect(appUrl, message)
  }

  if (!code) {
    return buildAuthErrorRedirect(appUrl, 'auth_callback_failed')
  }

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
  if (error) {
    return buildAuthErrorRedirect(
      appUrl,
      getAuthErrorMessage(error, 'auth_callback_failed'),
    )
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', user.id)
      .maybeSingle()

    if (!requiresRoleSelection(profile)) {
      if (requestedNext && next !== '/auth/choose-role') {
        return NextResponse.redirect(new URL(next, appUrl))
      }
      if (profile?.user_type === 'shop_owner') {
        return NextResponse.redirect(new URL('/dashboard/shop', appUrl))
      }
      if (profile?.user_type === 'staff') {
        return NextResponse.redirect(new URL('/dashboard/staff', appUrl))
      }
      if (profile?.user_type === 'customer') {
        return NextResponse.redirect(new URL('/dashboard/customer', appUrl))
      }
    }
  }

  return NextResponse.redirect(new URL(next, appUrl))
}
