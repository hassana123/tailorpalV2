'use client'

import { ReactNode } from 'react'

export default function ClientBoundary({ children }: { children: ReactNode }) {
  return <>{children}</>
}