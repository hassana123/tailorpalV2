import { Suspense } from 'react'
import AuthErrorClient from './AuthErrorClient'

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <AuthErrorClient />
    </Suspense>
  )
}