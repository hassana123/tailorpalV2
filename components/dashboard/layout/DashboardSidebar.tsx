'use client'

import Link from 'next/link'
import { TailorPalLogo } from '@/components/logo'
import { ChevronLeft, ChevronRight, LogOut } from 'lucide-react'
import type { DashboardNavItem } from './types'

interface DashboardSidebarProps {
  title: string
  sidebarOpen: boolean
  onToggleSidebar: () => void
  navItems: DashboardNavItem[]
  isItemActive: (href: string) => boolean
  onLogout: () => void
}

const STUDIO_LABELS = ['Dashboard', 'Customers', 'Orders', 'Measurements']
const WORKSHOP_LABELS = ['Floor Board', 'Workshop Floor', 'Production Planner', 'Production Workflow', 'Inventory', 'Staff']

export function DashboardSidebar({
  sidebarOpen,
  onToggleSidebar,
  navItems,
  isItemActive,
  onLogout,
}: DashboardSidebarProps) {
  const studioItems = navItems.filter((item) => STUDIO_LABELS.includes(item.label))
  const workshopItems = navItems.filter((item) => WORKSHOP_LABELS.includes(item.label))
  const otherItems = navItems.filter(
    (item) => !STUDIO_LABELS.includes(item.label) && !WORKSHOP_LABELS.includes(item.label)
  )

  const renderNavGroup = (title: string, items: DashboardNavItem[]) => {
    if (items.length === 0) return null
    return (
      <div className="space-y-1">
        {sidebarOpen ? (
          <p className="text-[10px] font-bold text-brand-stone/70 uppercase tracking-[0.2em] px-3 pt-4 pb-1">
            {title}
          </p>
        ) : (
          <div className="my-2 h-px bg-brand-border mx-2" />
        )}

        {items.map((item) => {
          const Icon = item.icon
          const active = isItemActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-semibold transition-all duration-150 group ${
                active
                  ? 'bg-brand-ink text-white shadow-brand'
                  : 'text-brand-stone hover:text-brand-ink hover:bg-brand-cream'
              } ${!sidebarOpen ? 'justify-center' : ''}`}
              title={!sidebarOpen ? item.label : undefined}
            >
              <Icon
                size={17}
                className={`flex-shrink-0 transition-colors ${
                  active ? 'text-brand-gold-light' : 'text-brand-stone group-hover:text-brand-ink'
                }`}
              />
              {sidebarOpen && <span className="truncate">{item.label}</span>}
            </Link>
          )
        })}
      </div>
    )
  }

  return (
    <aside
      className={`${
        sidebarOpen ? 'w-64' : 'w-[74px]'
      } flex-shrink-0 transition-all duration-300 flex flex-col border-r border-brand-border bg-white h-screen sticky top-0 overflow-hidden shadow-xs`}
    >
      {/* Logo row */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-brand-border h-16">
        {sidebarOpen ? (
          <TailorPalLogo size="sm" />
        ) : (
          <div className="w-8 h-8 rounded-xl bg-brand-ink flex items-center justify-center mx-auto shadow-sm">
            <span className="text-white text-xs font-bold font-display">T</span>
          </div>
        )}
        <button
          onClick={onToggleSidebar}
          className={`p-1.5 rounded-xl text-brand-stone hover:text-brand-ink hover:bg-brand-cream border border-transparent hover:border-brand-border transition-all ${
            !sidebarOpen ? 'mx-auto mt-0' : ''
          }`}
          aria-label="Toggle sidebar"
        >
          {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>
      </div>

      {/* Main nav groups */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-2">
        {renderNavGroup('Studio', studioItems)}
        {renderNavGroup('Workshop', workshopItems)}
        {renderNavGroup('Commerce', otherItems)}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-brand-border">
        <button
          onClick={onLogout}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-semibold text-red-500 hover:bg-red-50 hover:text-red-600 transition-all duration-150 ${
            !sidebarOpen ? 'justify-center' : ''
          }`}
          title={!sidebarOpen ? 'Logout' : undefined}
        >
          <LogOut size={16} className="flex-shrink-0" />
          {sidebarOpen && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  )
}
