const AUTH_ERROR_PATTERNS: Array<{ pattern: RegExp; message: string }> = [
  {
    pattern: /invalid login credentials/i,
    message: 'Invalid email or password.',
  },
  {
    pattern: /email not confirmed/i,
    message: 'Please confirm your email before signing in.',
  },
  {
    pattern: /user already registered|already been registered/i,
    message: 'An account with this email already exists. Try signing in instead.',
  },
  {
    pattern: /signup is disabled/i,
    message: 'New sign-ups are currently disabled.',
  },
  {
    pattern: /password should be at least/i,
    message: 'Password must be at least 8 characters.',
  },
  {
    pattern: /too many requests|rate limit/i,
    message: 'Too many attempts. Please wait and try again.',
  },
  {
    pattern: /network|fetch failed|failed to fetch/i,
    message: 'Network error. Check your connection and try again.',
  },
]

export function getAuthErrorMessage(error: unknown, fallback: string): string {
  const rawMessage = error instanceof Error ? error.message : ''
  if (!rawMessage) {
    return fallback
  }

  const matched = AUTH_ERROR_PATTERNS.find(({ pattern }) => pattern.test(rawMessage))
  if (matched) {
    return matched.message
  }

  return rawMessage
}
