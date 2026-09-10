import {
  Eye,
  Scissors,
  RefreshCw,
  Copy,
  MessageCircle,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
  PhoneCall,
  RotateCcw,
  ExternalLink,
} from 'lucide-react'
import { TableAction } from '@/components/dashboard/shared/table-actions'
import { findLinkedOrder } from '@/components/dashboard/orders/status'
import { normalizeCatalogRequestStatus } from '@/lib/catalog-request-status'
import type { CatalogActionPayload, CatalogOrderRequest, Order } from '@/app/dashboard/shop/[shopId]/orders/types'

export interface BuildOrderActionsOptions {
  onViewDetails: (order: Order) => void
  onViewProduction?: (order: Order) => void
  onOpenStatusModal?: (order: Order) => void
  onCopyTracking?: (order: Order) => void
  onWhatsApp?: (order: Order) => void
  onEdit: (order: Order) => void
  onDelete: (order: Order) => void
}

export function buildOrderActions(order: Order, options: BuildOrderActionsOptions): TableAction[] {
  const actions: TableAction[] = [
    {
      label: 'View Full Details',
      onClick: () => options.onViewDetails(order),
      icon: <Eye size={14} className="text-brand-stone" />,
      variant: 'default',
    },
  ]

  if (options.onViewProduction) {
    actions.push({
      label: 'Production Activities',
      onClick: () => options.onViewProduction!(order),
      icon: <Scissors size={14} className="text-brand-gold" />,
      variant: 'default',
    })
  }

  if (options.onOpenStatusModal) {
    actions.push({
      label: 'Update Order Stage',
      onClick: () => options.onOpenStatusModal!(order),
      icon: <RefreshCw size={14} className="text-brand-stone" />,
      variant: 'default',
    })
  }

  if (options.onCopyTracking) {
    actions.push({
      label: 'Copy Live Tracking Link',
      onClick: () => options.onCopyTracking!(order),
      icon: <Copy size={14} className="text-brand-stone" />,
      variant: 'default',
      divider: true,
    })
  }

  if (options.onWhatsApp) {
    actions.push({
      label: 'Send WhatsApp Update',
      onClick: () => options.onWhatsApp!(order),
      icon: <MessageCircle size={14} className="text-emerald-600" />,
      variant: 'success',
      divider: !options.onCopyTracking,
    })
  }

  actions.push(
    {
      label: 'Edit Commission',
      onClick: () => options.onEdit(order),
      icon: <Pencil size={14} className="text-brand-stone" />,
      variant: 'outline',
      divider: true,
    },
    {
      label: 'Delete Order',
      onClick: () => options.onDelete(order),
      icon: <Trash2 size={14} className="text-red-500" />,
      variant: 'destructive',
    },
  )

  return actions
}

export interface BuildRequestActionsOptions {
  orders: Order[]
  onViewDetails: (request: CatalogOrderRequest) => void
  onOpenAction: (request: CatalogOrderRequest, action: CatalogActionPayload['action']) => void
  onOpenLinkedOrder: (request: CatalogOrderRequest) => void
  onDelete: (request: CatalogOrderRequest) => void
}

export function buildRequestActions(
  request: CatalogOrderRequest,
  options: BuildRequestActionsOptions,
): TableAction[] {
  const normalizedStatus = normalizeCatalogRequestStatus(request.status)
  const linkedOrder = findLinkedOrder(request, options.orders)
  const actions: TableAction[] = [
    {
      label: 'View Details',
      onClick: () => options.onViewDetails(request),
      icon: <Eye size={14} className="text-brand-stone" />,
      variant: 'default',
    },
  ]

  if ((normalizedStatus === 'pending' || normalizedStatus === 'contacted') && !linkedOrder) {
    actions.unshift(
      {
        label: 'Accept Request',
        onClick: () => options.onOpenAction(request, 'accept'),
        icon: <CheckCircle2 size={14} className="text-emerald-600" />,
        variant: 'success',
      },
      {
        label: 'Contact Client',
        onClick: () => options.onOpenAction(request, 'contact'),
        icon: <PhoneCall size={14} className="text-brand-gold" />,
        variant: 'outline',
      },
      {
        label: 'Reject',
        onClick: () => options.onOpenAction(request, 'reject'),
        icon: <XCircle size={14} className="text-red-500" />,
        variant: 'destructive',
      },
      {
        label: 'Cancel',
        onClick: () => options.onOpenAction(request, 'cancel'),
        icon: <XCircle size={14} className="text-slate-500" />,
        variant: 'outline',
      },
    )
  }

  if (normalizedStatus === 'accepted') {
    actions.unshift(
      {
        label: 'Contact Client',
        onClick: () => options.onOpenAction(request, 'contact'),
        icon: <PhoneCall size={14} className="text-brand-gold" />,
        variant: 'outline',
      },
      {
        label: 'Mark Converted',
        onClick: () => options.onOpenAction(request, 'convert'),
        icon: <CheckCircle2 size={14} className="text-emerald-600" />,
        variant: 'success',
      },
    )
    if (linkedOrder) {
      actions.unshift({
        label: 'View Linked Order',
        onClick: () => options.onOpenLinkedOrder(request),
        icon: <ExternalLink size={14} className="text-brand-ink" />,
        variant: 'default',
      })
    }
  }

  if (normalizedStatus === 'converted') {
    actions.unshift({
      label: 'Contact Client',
      onClick: () => options.onOpenAction(request, 'contact'),
      icon: <PhoneCall size={14} className="text-brand-gold" />,
      variant: 'outline',
    })
    if (linkedOrder) {
      actions.unshift({
        label: 'View Linked Order',
        onClick: () => options.onOpenLinkedOrder(request),
        icon: <ExternalLink size={14} className="text-brand-ink" />,
        variant: 'default',
      })
    }
  }

  if ((normalizedStatus === 'rejected' || normalizedStatus === 'cancelled') && !linkedOrder) {
    actions.unshift({
      label: 'Reopen',
      onClick: () => options.onOpenAction(request, 'reopen'),
      icon: <RotateCcw size={14} className="text-brand-stone" />,
      variant: 'outline',
    })
    actions.push({
      label: 'Delete',
      onClick: () => options.onDelete(request),
      icon: <Trash2 size={14} className="text-red-500" />,
      variant: 'destructive',
      divider: true,
    })
  }

  return actions
}
