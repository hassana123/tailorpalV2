'use client'

import { Search, Bell, ChevronDown, Menu } from 'lucide-react'
import { useState } from 'react'

interface DashboardHeaderProps {
  subtitle: string
  shopName?: string
  firstName?: string
  lastName?: string
  onOpenProfile: () => void
  onLogout: () => void
  onMenuClick?: () => void
}

export function DashboardHeader({
  subtitle,
  shopName,
  firstName,
  lastName,
  onOpenProfile,
  onMenuClick,
}: DashboardHeaderProps) {
  const [searchFocused, setSearchFocused] = useState(false)

  // Display priority: full name → shop name → "My Shop"
  const hasName  = (firstName?.trim() || lastName?.trim())
  const displayName = hasName
    ? `${firstName ?? ''} ${lastName ?? ''}`.trim()
    : (shopName ?? 'My Shop')

  // Initials for avatar
  const initials = hasName
    ? `${(firstName?.[0] ?? '')}${(lastName?.[0] ?? '')}`.toUpperCase()
    : (shopName?.[0]?.toUpperCase() ?? 'S')

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-brand-border h-16 flex items-center justify-between px-4 lg:px-6">
      {/* Mobile Menu Button */}
      <button 
        onClick={onMenuClick}
        className="lg:hidden p-2 -ml-2 rounded-xl hover:bg-brand-cream transition-colors"
        aria-label="Open menu"
      >
        <Menu size={20} className="text-brand-ink" />
      </button>

      {/* Page title */}
      <div className="flex-shrink-0 min-w-0">
        <h2 className="text-sm lg:text-base font-bold text-brand-ink truncate">{subtitle}</h2>
      </div>

      {/* Search bar — centre */}
      <div className="flex-1 max-w-md mx-auto hidden sm:block">
        <div className={`relative transition-all duration-200 ${searchFocused ? 'scale-[1.01]' : ''}`}>
          <Search
            size={14}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-stone pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search…"
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className="w-full h-9 pl-9 pr-4 rounded-xl bg-brand-cream border border-brand-border text-sm text-brand-ink placeholder:text-brand-stone focus:outline-none focus:ring-2 focus:ring-brand-gold/25 focus:border-brand-gold/50 transition-all"
          />
        </div>
      </div>

      {/* Right side: notifications + profile */}
      <div className="flex items-center gap-1 lg:gap-2 flex-shrink-0">

        {/* Mobile Search Button */}
        <button className="sm:hidden relative w-9 h-9 rounded-xl bg-brand-cream border border-brand-border flex items-center justify-center text-brand-stone hover:text-brand-ink hover:bg-white hover:border-brand-ink/20 transition-all">
          <Search size={15} />
        </button>

        {/* Notification bell */}
        <button className="relative w-9 h-9 rounded-xl bg-brand-cream border border-brand-border flex items-center justify-center text-brand-stone hover:text-brand-ink hover:bg-white hover:border-brand-ink/20 transition-all">
          <Bell size={15} />
          {/* Badge */}
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-brand-gold text-white text-[9px] font-bold flex items-center justify-center">
            3
          </span>
        </button>

        {/* Profile pill */}
        <button
          onClick={onOpenProfile}
          className="flex items-center gap-2 lg:gap-2.5 h-9 pl-1.5 pr-2 lg:pr-3 rounded-xl bg-brand-cream border border-brand-border hover:bg-white hover:border-brand-ink/20 transition-all group"
        >
          {/* Avatar */}
          <div className="w-6 h-6 rounded-lg bg-brand-ink text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">
            {initials}
          </div>
          <span className="hidden sm:block text-sm font-semibold text-brand-charcoal group-hover:text-brand-ink transition-colors max-w-[80px] lg:max-w-[120px] truncate">
            {displayName}
          </span>
          <ChevronDown size={12} className="hidden sm:block text-brand-stone group-hover:text-brand-ink transition-colors" />
        </button>
      </div>
    </header>
  )
}