'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Menu, X } from 'lucide-react'
import type { DashboardNavItem } from './types'

interface DashboardSidebarProps {
  title: string
  sidebarOpen: boolean
  onToggleSidebar: () => void
  navItems: DashboardNavItem[]
  isItemActive: (href: string) => boolean
}

export function DashboardSidebar({
  title,
  sidebarOpen,
  onToggleSidebar,
  navItems,
  isItemActive,
}: DashboardSidebarProps) {
  return (
    <div
      className={`${
        sidebarOpen ? 'w-64' : 'w-20'
      } transition-all duration-300 border-r bg-muted/50 flex flex-col`}
    >
      <div className="p-4 flex items-center justify-between">
        {sidebarOpen && <h1 className="text-xl font-bold">{title}</h1>}
        <Button variant="ghost" size="sm" onClick={onToggleSidebar}>
          {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = isItemActive(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {sidebarOpen && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
