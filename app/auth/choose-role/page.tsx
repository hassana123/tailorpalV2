import { Suspense } from 'react'
import ChooseRoleClient from './ChooseRoleClient'

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <ChooseRoleClient />
    </Suspense>
  )
}