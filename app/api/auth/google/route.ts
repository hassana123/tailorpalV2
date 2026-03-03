import { getAuthErrorMessage } from '@/lib/auth/errors'
import { createClient } from '@/lib/supabase/server'
import { getSafeNextPath } from '@/lib/utils/app-url'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const AUTH_NEXT_COOKIE = 'tp_auth_next'

const schema = z.object({
  mode: z.enum(['login', 'signup']).default('login'),
  next: z.string().trim().max(2048).optional(),
  origin: z.string().trim().max(2048).optional(),
})

type OAuthPayload = z.infer<typeof schema>
type OAuthStartError = {
  ok: false
  appUrl: string
  error: string
  status: number
}

type OAuthStartSuccess = {
  ok: true
  appUrl: string
  authUrl: string
  nextPath: string
  secureCookie: boolean
}

function parseHttpOrigin(value: string | undefined) {
  if (!value) {
    return null
  }

  try {
    const parsed = new URL(value)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null
    }
    return parsed.origin
  } catch {
    return null
  }
}

function isLocalHost(hostname: string) {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1'
}

function resolveAuthAppUrl(request: NextRequest, preferredOrigin?: string) {
  const requestOrigin = request.nextUrl.origin || new URL(request.url).origin
  const requestUrl = new URL(requestOrigin)
  const parsedPreferredOrigin = parseHttpOrigin(preferredOrigin)

  if (!parsedPreferredOrigin) {
    return requestOrigin
  }

  const preferredUrl = new URL(parsedPreferredOrigin)
  const sameOrigin = preferredUrl.origin === requestUrl.origin
  const bothLocal = isLocalHost(preferredUrl.hostname) && isLocalHost(requestUrl.hostname)

  return sameOrigin || bothLocal ? parsedPreferredOrigin : requestOrigin
}

function buildAuthErrorRedirect(appUrl: string, errorCode: string) {
  const url = new URL('/auth/error', appUrl)
  url.searchParams.set('error', errorCode)
  return NextResponse.redirect(url)
}

async function createGoogleAuthResponse(
  request: NextRequest,
  payload: OAuthPayload,
): Promise<OAuthStartError | OAuthStartSuccess> {
  const appUrl = resolveAuthAppUrl(request, payload.origin)
  const callbackUrl = new URL('/auth/callback', appUrl)
  const fallbackNext = payload.mode === 'signup' ? '/auth/choose-role' : '/dashboard/customer'
  const nextPath = getSafeNextPath(payload.next ?? fallbackNext, fallbackNext)

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
    return { ok: false, appUrl, error: message, status: 400 }
  }

  const oauthRedirectTo = new URL(data.url).searchParams.get('redirect_to')
  const expectedRedirectBase = `${callbackUrl.origin}/auth/callback`
  if (oauthRedirectTo && !oauthRedirectTo.startsWith(expectedRedirectBase)) {
    return {
      ok: false,
      error: `Google redirect mismatch. Add "${expectedRedirectBase}" to Supabase Auth Redirect URLs.`,
      status: 400,
      appUrl,
    }
  }

  return {
    ok: true,
    appUrl,
    authUrl: data.url,
    nextPath,
    secureCookie: callbackUrl.protocol === 'https:',
  }
}

function setNextCookie(response: NextResponse, nextPath: string, secureCookie: boolean) {
  response.cookies.set(AUTH_NEXT_COOKIE, nextPath, {
    httpOnly: true,
    sameSite: 'lax',
    secure: secureCookie,
    path: '/',
    maxAge: 10 * 60,
  })
}

export async function GET(request: NextRequest) {
  try {
    const parsed = schema.safeParse({
      mode: request.nextUrl.searchParams.get('mode') ?? undefined,
      next: request.nextUrl.searchParams.get('next') ?? undefined,
      origin: request.nextUrl.searchParams.get('origin') ?? undefined,
    })

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const result = await createGoogleAuthResponse(request, parsed.data)
    if (!result.ok) {
      return buildAuthErrorRedirect(result.appUrl, result.error)
    }

    const response = NextResponse.redirect(result.authUrl)
    setNextCookie(response, result.nextPath, result.secureCookie)
    return response
  } catch (error) {
    const appUrl = request.nextUrl.origin || new URL(request.url).origin
    const message = getAuthErrorMessage(error, 'Unable to start Google sign in.')
    return buildAuthErrorRedirect(appUrl, message)
  }
}

export async function POST(request: NextRequest) {
  try {
    const parsed = schema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }
    const result = await createGoogleAuthResponse(request, parsed.data)
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

    const response = NextResponse.json({ url: result.authUrl })
    setNextCookie(response, result.nextPath, result.secureCookie)
    return response
  } catch (error) {
    const message = getAuthErrorMessage(error, 'Unable to start Google sign in.')
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
