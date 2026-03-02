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

// Group nav items like the reference image
const MAIN_NAV_LABELS  = ['Dashboard', 'Customers', 'Orders', 'Catalog', 'Measurements', 'Voice Assistant']
const OTHER_NAV_LABELS = ['Staff', 'Settings']

export function DashboardSidebar({
  title,
  sidebarOpen,
  onToggleSidebar,
  navItems,
  isItemActive,
  onLogout,
}: DashboardSidebarProps) {
  const mainItems  = navItems.filter((i) => MAIN_NAV_LABELS.includes(i.label))
  const otherItems = navItems.filter((i) => OTHER_NAV_LABELS.includes(i.label))

  return (
    <aside
      className={`${
        sidebarOpen ? 'w-60' : 'w-[72px]'
      } flex-shrink-0 transition-all duration-300 flex flex-col border-r border-brand-border bg-white h-screen sticky top-0 overflow-hidden`}
    >
      {/* Logo row */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-brand-border">
        {sidebarOpen ? (
          <TailorPalLogo size="sm" />
        ) : (
          <div className="w-8 h-8 rounded-lg bg-brand-ink flex items-center justify-center mx-auto">
            <span className="text-white text-xs font-bold font-display">T</span>
          </div>
        )}
        <button
          onClick={onToggleSidebar}
          className={`p-1.5 rounded-lg text-brand-stone hover:text-brand-ink hover:bg-brand-cream transition-all ${
            !sidebarOpen ? 'mx-auto mt-0' : ''
          }`}
          aria-label="Toggle sidebar"
        >
          {sidebarOpen ? <ChevronLeft size={15} /> : <ChevronRight size={15} />}
        </button>
      </div>

      {/* Main nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        {sidebarOpen && (
          <p className="text-[9px] font-bold text-brand-stone/60 uppercase tracking-[0.22em] px-3 mb-3">
            Main Menu
          </p>
        )}

        {mainItems.map((item) => {
          const Icon = item.icon
          const active = isItemActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
                active
                  ? 'bg-brand-ink text-white'
                  : 'text-brand-stone hover:text-brand-ink hover:bg-brand-cream'
              } ${!sidebarOpen ? 'justify-center' : ''}`}
              title={!sidebarOpen ? item.label : undefined}
            >
              <Icon
                size={17}
                className={`flex-shrink-0 ${
                  active ? 'text-white' : 'text-brand-stone group-hover:text-brand-ink'
                }`}
              />
              {sidebarOpen && <span>{item.label}</span>}
            </Link>
          )
        })}

        {/* Others section */}
        {otherItems.length > 0 && (
          <>
            {sidebarOpen && (
              <p className="text-[9px] font-bold text-brand-stone/60 uppercase tracking-[0.22em] px-3 mb-3 pt-5">
                Others
              </p>
            )}
            {!sidebarOpen && <div className="my-3 h-px bg-brand-border mx-2" />}

            {otherItems.map((item) => {
              const Icon = item.icon
              const active = isItemActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
                    active
                      ? 'bg-brand-ink text-white'
                      : 'text-brand-stone hover:text-brand-ink hover:bg-brand-cream'
                  } ${!sidebarOpen ? 'justify-center' : ''}`}
                  title={!sidebarOpen ? item.label : undefined}
                >
                  <Icon
                    size={17}
                    className={`flex-shrink-0 ${
                      active ? 'text-white' : 'text-brand-stone group-hover:text-brand-ink'
                    }`}
                  />
                  {sidebarOpen && <span>{item.label}</span>}
                </Link>
              )
            })}
          </>
        )}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-brand-border">
        <button
          onClick={onLogout}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 hover:text-red-600 transition-all duration-150 ${
            !sidebarOpen ? 'justify-center' : ''
          }`}
          title={!sidebarOpen ? 'Logout' : undefined}
        >
          <LogOut size={17} className="flex-shrink-0" />
          {sidebarOpen && <span>Logout</span>}
        </button>
      </div>
    </aside>
  )
}