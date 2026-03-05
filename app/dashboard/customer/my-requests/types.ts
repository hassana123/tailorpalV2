import type { ElementType } from 'react'

export interface CatalogRequestShop {
  name: string
  logo_url: string | null
}

export interface CatalogRequestItem {
  name: string
  price: number
  image_url: string | null
}

export interface LinkedOrder {
  id: string
  order_number: string
  status: string
  estimated_delivery_date: string | null
  total_price: number | null
  updated_at?: string
}

export interface CatalogRequest {
  id: string
  shop_id: string
  requester_name: string
  requester_email: string | null
  requester_phone: string | null
  notes: string | null
  status: string
  created_at: string
  updated_at: string
  owner_response_channel: 'email' | 'whatsapp' | 'none' | null
  owner_response_message: string | null
  owner_response_sent_at: string | null
  accepted_at: string | null
  rejected_at: string | null
  linked_order_id: string | null
  shop: CatalogRequestShop | null
  catalog_item: CatalogRequestItem | null
  order: LinkedOrder | null
}

export interface StatusStyle {
  label: string
  className: string
  Icon: ElementType
}
