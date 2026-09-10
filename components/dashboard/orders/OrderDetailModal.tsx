'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { ModalForm } from '@/components/dashboard/shared/ModalForm'
import type { Order } from '@/app/dashboard/shop/[shopId]/orders/types'
import { ORDER_STATUS_STYLES } from '@/components/dashboard/orders/status'
import { formatNaira, formatRelativeDate } from '@/lib/utils/format'
import { createWhatsAppUrl, getOrderConfirmationMessage } from '@/lib/utils/whatsapp'
import {
  Calendar,
  CreditCard,
  Hash,
  MessageCircle,
  Copy,
  Check,
  Scissors,
  User,
  Sparkles,
} from 'lucide-react'
import { OrderAssetsPanel } from '@/components/dashboard/orders/OrderAssetsPanel'
import { InvoiceActions } from '@/components/dashboard/orders/InvoiceActions'
import { OrderLifecyclePanel } from '@/components/dashboard/orders/OrderLifecyclePanel'

interface OrderDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  order: Order | null
  shopName?: string
  shopId?: string
}

export function OrderDetailModal({
  open,
  onOpenChange,
  order,
  shopName,
  shopId,
}: OrderDetailModalProps) {
  const [copied, setCopied] = useState(false)

  if (!order) return null

  const statusStyle = ORDER_STATUS_STYLES[order.status]
  const StatusIcon = statusStyle.Icon

  const customerName = `${order.customers?.first_name ?? ''} ${order.customers?.last_name ?? ''}`.trim() || 'Valued Client'
  const customerPhone = (order.customers as { phone?: string | null } | null)?.phone

  const deliveryRelative = formatRelativeDate(order.estimated_delivery_date)

  const trackingUrl = typeof window !== 'undefined' ? `${window.location.origin}/track/${order.id}` : ''

  const handleCopyTracking = () => {
    if (!trackingUrl) return
    void navigator.clipboard.writeText(trackingUrl)
    setCopied(true)
    toast.success('Client tracking link copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleWhatsApp = () => {
    const msg = getOrderConfirmationMessage({
      customerName,
      shopName,
      orderNumber: order.order_number,
      garmentDescription: order.design_description || 'Custom Bespoke Outfit',
      deliveryDate: order.estimated_delivery_date,
      totalPrice: order.total_price,
      trackingUrl,
    })
    const url = createWhatsAppUrl(customerPhone, msg)
    window.open(url, '_blank', 'noopener,noreferrer')
    toast.success(`Opening WhatsApp for ${customerName}`)
  }

  return (
    <ModalForm
      open={open}
      onOpenChange={onOpenChange}
      title={`Order #${order.order_number}`}
      description="Bespoke Garment Specification & Invoice"
      hideFooter
      maxWidth="xl"
    >
      <div className="space-y-5 w-full min-w-0 max-w-full overflow-x-hidden">
        {/* Status and Client Banner */}
        <div className="bg-brand-cream/60 rounded-2xl border border-brand-border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-brand-ink text-white flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-xs">
              <User size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-brand-ink text-sm truncate">{customerName}</p>
              <p className="text-xs text-brand-stone font-mono flex items-center gap-1 truncate">
                <Hash size={11} className="flex-shrink-0" />
                <span>{order.order_number}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <span
              className={cn(
                'inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border',
                statusStyle.className
              )}
            >
              <StatusIcon size={12} />
              {statusStyle.label}
            </span>
          </div>
        </div>

        {/* Garment Details & Fabric */}
        <div className="bg-white rounded-2xl border border-brand-border p-4 space-y-3 min-w-0">
          <div>
            <span className="text-[10px] font-bold text-brand-stone uppercase tracking-wider block mb-1">
              Garment / Style Description
            </span>
            <p className="text-sm font-semibold text-brand-ink break-words">
              {order.design_description || 'Custom Bespoke Outfit'}
            </p>
          </div>

          {order.fabric_details && (
            <div className="pt-2 border-t border-brand-border">
              <span className="text-[10px] font-bold text-brand-stone uppercase tracking-wider block mb-1 flex items-center gap-1">
                <Scissors size={11} className="text-brand-gold flex-shrink-0" />
                Fabric & Material Details
              </span>
              <p className="text-xs text-brand-charcoal break-words">{order.fabric_details}</p>
            </div>
          )}

          {order.notes && (
            <div className="pt-2 border-t border-brand-border">
              <span className="text-[10px] font-bold text-brand-stone uppercase tracking-wider block mb-1">
                Atelier Notes & Instructions
              </span>
              <p className="text-xs text-brand-stone leading-relaxed whitespace-pre-line break-words">{order.notes}</p>
            </div>
          )}
        </div>

        <OrderAssetsPanel orderId={order.id} customerId={order.customer_id} />
        <OrderLifecyclePanel order={order} shopName={shopName} customerName={customerName} customerPhone={customerPhone} />

        {/* Timeline & Delivery */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0">
          <div className="bg-white rounded-2xl border border-brand-border p-4 min-w-0">
            <span className="text-[10px] font-bold text-brand-stone uppercase tracking-wider block mb-1 flex items-center gap-1">
              <Calendar size={11} className="flex-shrink-0" /> Date Booked
            </span>
            <p className="text-sm font-semibold text-brand-ink truncate">
              {new Date(order.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-brand-border p-4 min-w-0">
            <span className="text-[10px] font-bold text-brand-stone uppercase tracking-wider block mb-1 flex items-center gap-1">
              <Sparkles size={11} className="text-brand-gold flex-shrink-0" /> Estimated Due Date
            </span>
            <p className="text-sm font-semibold text-brand-ink truncate">
              {order.estimated_delivery_date
                ? new Date(order.estimated_delivery_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                : 'To be agreed'}
            </p>
            {order.estimated_delivery_date && (
              <p
                className={cn(
                  'text-[10px] font-medium mt-0.5 truncate',
                  deliveryRelative.isOverdue ? 'text-red-600 font-bold' : deliveryRelative.isUrgent ? 'text-brand-gold font-bold' : 'text-brand-stone'
                )}
              >
                {deliveryRelative.text}
              </p>
            )}
          </div>
        </div>

        {/* Financial Breakdown (Naira) */}
        <div className="bg-white rounded-2xl border border-brand-border p-4 space-y-3 min-w-0">
          <div className="flex items-center justify-between min-w-0">
            <span className="text-xs font-bold text-brand-ink flex items-center gap-1.5">
              <CreditCard size={14} className="text-brand-gold flex-shrink-0" />
              Payment Summary
            </span>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex-shrink-0">
              Naira (₦)
            </span>
          </div>

          <div className="pt-2 border-t border-brand-border flex items-center justify-between text-sm min-w-0">
            <span className="text-brand-stone">Total Bespoke Cost:</span>
            <span className="font-display text-lg font-bold text-brand-ink truncate">
              {formatNaira(order.total_price)}
            </span>
          </div>
        </div>

        {/* Actions Dock */}
        <div className="flex flex-col sm:flex-row gap-2 pt-2 min-w-0">
          <button
            onClick={handleWhatsApp}
            className="flex-1 min-w-0 h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm px-3"
          >
            <MessageCircle size={15} className="flex-shrink-0" />
            <span className="truncate">Send WhatsApp Update</span>
          </button>

          <button
            onClick={handleCopyTracking}
            className="flex-1 min-w-0 h-11 rounded-xl bg-brand-cream border border-brand-border hover:bg-white text-brand-ink text-xs font-bold flex items-center justify-center gap-2 transition-all px-3"
          >
            {copied ? <Check size={14} className="text-emerald-600 flex-shrink-0" /> : <Copy size={14} className="flex-shrink-0" />}
            <span className="truncate">{copied ? 'Tracking Link Copied!' : 'Copy Client Tracking Link'}</span>
          </button>
        </div>
        {shopId && <InvoiceActions order={order} customerName={customerName} shopName={shopName} shopId={shopId} />}
      </div>
    </ModalForm>
  )
}
