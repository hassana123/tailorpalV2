'use client'

import { Button } from '@/components/ui/button'
import { LogOut, User } from 'lucide-react'

interface DashboardHeaderProps {
  subtitle: string
  onOpenProfile: () => void
  onLogout: () => void
}

export function DashboardHeader({ subtitle, onOpenProfile, onLogout }: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="h-16 px-4 md:px-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Dashboard</p>
          <p className="text-sm font-semibold">{subtitle}</p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onOpenProfile}>
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Manage Profile</span>
          </Button>

          <Button variant="ghost" size="sm" onClick={onLogout}>
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </div>
    </header>
  )
}
