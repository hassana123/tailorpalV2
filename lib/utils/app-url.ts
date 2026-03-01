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
  const forwardedHost = request.headers.get('x-forwarded-host')
  if (forwardedHost) {
    const forwardedProto = request.headers.get('x-forwarded-proto') ?? 'https'
    return `${forwardedProto}://${forwardedHost}`
  }

  if (request.nextUrl.origin) {
    return request.nextUrl.origin
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
