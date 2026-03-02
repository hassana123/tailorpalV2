import { getAuthErrorMessage } from '@/lib/auth/errors'
import { createClient } from '@/lib/supabase/server'
import { getRequestAppUrl, getSafeNextPath } from '@/lib/utils/app-url'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const schema = z.object({
  mode: z.enum(['login', 'signup']).default('login'),
  next: z.string().trim().max(2048).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const parsed = schema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const appUrl = getRequestAppUrl(request)
    const callbackUrl = new URL('/auth/callback', appUrl)
    const fallbackNext =
      parsed.data.mode === 'signup' ? '/auth/choose-role' : '/dashboard/customer'
    const nextPath = getSafeNextPath(parsed.data.next ?? fallbackNext, fallbackNext)

    callbackUrl.searchParams.set('next', nextPath)

    const supabase = await createClient()
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: callbackUrl.toString(),
        skipBrowserRedirect: true,
      },
    })

    if (error || !data?.url) {
      const message = getAuthErrorMessage(error, 'Failed to start Google sign in.')
      return NextResponse.json({ error: message }, { status: 400 })
    }

    return NextResponse.json({ url: data.url })
  } catch (error) {
    const message = getAuthErrorMessage(error, 'Unable to start Google sign in.')
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
