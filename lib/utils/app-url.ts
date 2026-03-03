type RequestLike = {
  headers: Pick<Headers, 'get'>
  nextUrl: {
    origin: string
  }
}

const PROTOCOL_PATTERN = /^https?:\/\//i
function normalizeAppUrl(url: string): string {
  const trimmed = url.trim()
  const withProtocol = PROTOCOL_PATTERN.test(trimmed) ? trimmed : `https://${trimmed}`
  return withProtocol.replace(/\/+$/, '')
}

function toSafeOrigin(value: string | null | undefined): string | null {
  if (!value) {
    return null
  }

  try {
    const parsed = new URL(value)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null
    }
    return `${parsed.protocol}//${parsed.host}`
  } catch {
    return null
  }
}

function resolveForwardedOrigin(request: RequestLike): string | null {
  const forwardedHost = request.headers.get('x-forwarded-host')?.trim()
  if (!forwardedHost) {
    return null
  }

  const forwardedProto = request.headers.get('x-forwarded-proto')?.trim() || 'https'
  const protocol = forwardedProto === 'http' ? 'http' : 'https'
  return toSafeOrigin(`${protocol}://${forwardedHost}`)
}

function getConfiguredAppUrl(): string | null {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim()
  return configured ? normalizeAppUrl(configured) : null
}

export function getBrowserAppUrl(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin
  }

  const configured = getConfiguredAppUrl()
  if (configured) {
    return configured
  }

  return 'http://localhost:3000'
}

export function getRequestAppUrl(request: RequestLike): string {
  // Same-origin fetch requests include this; prefer it so localhost stays localhost.
  const requestOriginHeader = toSafeOrigin(request.headers.get('origin'))
  if (requestOriginHeader) {
    return requestOriginHeader
  }

  const nextOrigin = toSafeOrigin(request.nextUrl.origin)
  if (nextOrigin) {
    return nextOrigin
  }

  const forwardedOrigin = resolveForwardedOrigin(request)
  if (forwardedOrigin) {
    return forwardedOrigin
  }

  const configured = getConfiguredAppUrl()
  if (configured) {
    return configured
  }

  return 'http://localhost:3000'
}

export function getSafeNextPath(value: string | null, fallback = '/auth/choose-role'): string {
  if (!value) {
    return fallback
  }

  if (!value.startsWith('/') || value.startsWith('//')) {
    return fallback
  }

  return value
}
