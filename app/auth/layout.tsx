import { ReactNode } from 'react'

// This layout intentionally bypasses the parent auth/layout.tsx
// so choose-role gets a full-width, unboxed experience.
export default function ChooseRoleLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}