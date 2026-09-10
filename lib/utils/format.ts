/**
 * TailorPal Formatting Utilities
 * Standardized across the entire application for a consistent, professional atelier experience.
 */

/**
 * Formats an amount into Nigerian Naira (₦) with thousand separators.
 * Handles numbers, strings, and null/undefined gracefully.
 * Example: formatNaira(45000) -> "₦45,000"
 * Example: formatNaira(45000.5) -> "₦45,000.50"
 */
export function formatNaira(
  amount: number | string | null | undefined,
  options?: { showZero?: boolean; decimals?: boolean }
): string {
  if (amount === null || amount === undefined || amount === '') {
    return options?.showZero ? '₦0' : '—'
  }

  const num = typeof amount === 'string' ? parseFloat(amount.replace(/[^0-9.-]+/g, '')) : amount
  if (isNaN(num)) return options?.showZero ? '₦0' : '—'

  const hasDecimals = options?.decimals ?? (num % 1 !== 0)

  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    currencyDisplay: 'narrowSymbol',
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: hasDecimals ? 2 : 0,
  }).format(num)
}

/**
 * Format compact money for stat cards and badges (e.g., ₦2.4M, ₦150k)
 */
export function formatCompactNaira(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || amount === '') return '₦0'
  const num = typeof amount === 'string' ? parseFloat(amount.replace(/[^0-9.-]+/g, '')) : amount
  if (isNaN(num)) return '₦0'

  if (Math.abs(num) >= 1_000_000) {
    return `₦${(num / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  }
  if (Math.abs(num) >= 1_000) {
    return `₦${(num / 1_000).toFixed(1).replace(/\.0$/, '')}k`
  }
  return `₦${num.toLocaleString()}`
}

/**
 * Layman-friendly date formatting
 * Example: "14 Oct 2026" or "Tomorrow" or "In 3 days"
 */
export function formatRelativeDate(dateStr: string | null | undefined): {
  text: string
  isUrgent: boolean
  isOverdue: boolean
} {
  if (!dateStr) return { text: 'No date set', isUrgent: false, isOverdue: false }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const targetDate = new Date(`${dateStr.split('T')[0]}T00:00:00`)
  const diffTime = targetDate.getTime() - today.getTime()
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays < 0) {
    const overdueDays = Math.abs(diffDays)
    return {
      text: overdueDays === 1 ? '1 day overdue' : `${overdueDays} days overdue`,
      isUrgent: true,
      isOverdue: true,
    }
  }

  if (diffDays === 0) {
    return { text: 'Due today', isUrgent: true, isOverdue: false }
  }

  if (diffDays === 1) {
    return { text: 'Due tomorrow', isUrgent: true, isOverdue: false }
  }

  if (diffDays <= 3) {
    return { text: `In ${diffDays} days`, isUrgent: true, isOverdue: false }
  }

  if (diffDays <= 7) {
    return { text: `In ${diffDays} days`, isUrgent: false, isOverdue: false }
  }

  return {
    text: targetDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
    isUrgent: false,
    isOverdue: false,
  }
}

/**
 * Format phone numbers for display
 */
export function formatPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return ''
  const cleaned = phone.replace(/[^0-9+]/g, '')
  if (cleaned.startsWith('0') && cleaned.length === 11) {
    return `+234 ${cleaned.slice(1, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`
  }
  return cleaned
}

/**
 * Clean phone for wa.me URL (digits only, normalized to country code)
 */
export function cleanPhoneForWhatsApp(phone: string | null | undefined): string {
  if (!phone) return ''
  let cleaned = phone.replace(/[^0-9]/g, '')
  if (cleaned.startsWith('0') && cleaned.length === 11) {
    cleaned = '234' + cleaned.slice(1)
  }
  return cleaned
}
