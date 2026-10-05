import { createBrowserClient } from '@supabase/ssr'
import { parse, serialize } from 'cookie'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // Client components are also rendered on the server, where window is absent.
        userStorage: typeof window === 'undefined'
          ? { getItem: () => null, setItem: () => {}, removeItem: () => {} }
          : window.localStorage,
      },
      cookies: {
        // Keep user metadata in localStorage; only session tokens travel in headers.
        encode: 'tokens-only',
        getAll() {
          if (typeof document === 'undefined') return []
          return Object.entries(parse(document.cookie)).map(([name, value]) => ({
            name, value: value ?? '',
          }))
        },
        setAll(cookiesToSet) {
          if (typeof document === 'undefined') return
          cookiesToSet.forEach(({ name, value, options }) => {
            document.cookie = serialize(name, value, options)
          })
        },
      },
    },
  )
}
