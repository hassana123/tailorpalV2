'use client'

import { ReactNode, useEffect } from 'react'

interface ClientBoundaryProps {
  children: ReactNode
}

/**
 * Wraps any content that needs to run on the client
 * (useRouter, useSearchParams, usePathname, etc.)
 */
export default function ClientBoundary({ children }: ClientBoundaryProps) {
  // Optional: global client-side logic can go here
  useEffect(() => {
    // console.log('Client boundary mounted')
  }, [])

  return <>{children}</>
}