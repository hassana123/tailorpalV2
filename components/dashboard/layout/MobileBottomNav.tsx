'use client'

import Link from 'next/link'
import { useState } from 'react'
import { MoreHorizontal, X } from 'lucide-react'
import type { DashboardNavItem } from './types'

interface MobileBottomNavProps {
  items: DashboardNavItem[]
  moreItems: DashboardNavItem[]
  isItemActive: (href: string) => boolean
  onMoreClick: () => void
}

export function MobileBottomNav({ 
  items, 
  moreItems, 
  isItemActive,
}: MobileBottomNavProps) {
  const [showMoreMenu, setShowMoreMenu] = useState(false)

  // Limit to 5 items for mobile UX best practices
  const displayItems = items.slice(0, 4)
  const hasMore = moreItems.length > 0 || items.length > 4

  return (
    <>
      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-brand-border lg:hidden safe-area-pb">
        <div className="flex items-center justify-around h-16">
          {displayItems.map((item) => {
            const Icon = item.icon
            const active = isItemActive(item.href)
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center flex-1 h-full min-w-0 transition-all duration-200 ${
                  active 
                    ? 'text-brand-ink' 
                    : 'text-brand-stone hover:text-brand-charcoal'
                }`}
              >
                <div className={`relative p-1.5 rounded-xl transition-all ${
                  active ? 'bg-brand-ink/10' : ''
                }`}>
                  <Icon 
                    size={20} 
                    className={`${active ? 'text-brand-ink' : 'text-brand-stone'}`}
                    strokeWidth={active ? 2.5 : 2}
                  />
                  {active && (
                    <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-brand-gold" />
                  )}
                </div>
                <span className={`text-[10px] font-medium mt-0.5 truncate max-w-[64px] ${
                  active ? 'text-brand-ink' : 'text-brand-stone'
                }`}>
                  {item.label}
                </span>
              </Link>
            )
          })}

          {/* More Button */}
          {hasMore && (
            <button
              onClick={() => setShowMoreMenu(true)}
              className={`flex flex-col items-center justify-center flex-1 h-full min-w-0 transition-all duration-200 ${
                showMoreMenu ? 'text-brand-ink' : 'text-brand-stone hover:text-brand-charcoal'
              }`}
            >
              <div className={`relative p-1.5 rounded-xl transition-all ${
                showMoreMenu ? 'bg-brand-ink/10' : ''
              }`}>
                <MoreHorizontal 
                  size={20} 
                  className={showMoreMenu ? 'text-brand-ink' : 'text-brand-stone'}
                />
              </div>
              <span className={`text-[10px] font-medium mt-0.5 ${
                showMoreMenu ? 'text-brand-ink' : 'text-brand-stone'
              }`}>
                More
              </span>
            </button>
          )}
        </div>
      </nav>

      {/* More Menu Modal */}
      {showMoreMenu && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => setShowMoreMenu(false)}
          />
          
          {/* Menu Panel */}
          <div className="absolute bottom-20 left-4 right-4 bg-white rounded-2xl shadow-2xl border border-brand-border overflow-hidden animate-slide-up">
            <div className="p-4 border-b border-brand-border flex items-center justify-between">
              <span className="font-semibold text-brand-ink">More Options</span>
              <button 
                onClick={() => setShowMoreMenu(false)}
                className="p-2 rounded-lg hover:bg-brand-cream transition-colors"
              >
                <X size={18} className="text-brand-stone" />
              </button>
            </div>
            
            <div className="p-2 max-h-[60vh] overflow-y-auto">
              {[...items.slice(4), ...moreItems].map((item) => {
                const Icon = item.icon
                const active = isItemActive(item.href)
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setShowMoreMenu(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      active
                        ? 'bg-brand-ink text-white'
                        : 'text-brand-charcoal hover:bg-brand-cream'
                    }`}
                  >
                    <Icon 
                      size={18} 
                      className={active ? 'text-white' : 'text-brand-stone'}
                    />
                    {item.label}
                    {active && (
                      <span className="ml-auto w-2 h-2 rounded-full bg-brand-gold" />
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </>
  )
}