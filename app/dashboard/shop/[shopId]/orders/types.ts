export interface CustomerOption {
  id: string
  first_name: string
  last_name: string
}

export type OrderStatus = 'pending' | 'in_progress' | 'completed' | 'delivered' | 'cancelled'

export interface Order {
  id: string
  shop_id: string
  customer_id: string
  order_number: string
  design_description: string | null
  fabric_details?: string | null
  status: OrderStatus
  estimated_delivery_date?: string | null
  total_price?: number | null
  notes?: string | null
  catalog_request_id?: string | null
  created_at: string
  updated_at?: string
  customers?: CustomerOption | null
}

export type CatalogRequestStatus =
  | 'pending'
  | 'contacted'
  | 'accepted'
  | 'converted'
  | 'rejected'
  | 'cancelled'
  | 'unknown'

export interface CatalogRequestItem {
  name: string
  price: number
}

export interface CatalogOrderRequest {
  id: string
  requester_name: string
  requester_email: string | null
  requester_phone: string | null
  notes: string | null
  status: string
  created_at: string
  updated_at: string
  linked_order_id: string | null
  owner_response_channel: 'email' | 'whatsapp' | 'none' | null
  owner_response_message: string | null
  owner_response_sent_at: string | null
  accepted_at: string | null
  rejected_at: string | null
  shop_catalog_items: CatalogRequestItem | CatalogRequestItem[] | null
}

export interface OrderFormState {
  customerId: string
  designDescription: string
  estimatedDeliveryDate: string
  totalPrice: string
  notes: string
}

export interface EditOrderFormState {
  status: OrderStatus
  designDescription: string
  estimatedDeliveryDate: string
  totalPrice: string
  notes: string
}

export interface CatalogActionPayload {
  action: 'accept' | 'reject' | 'contact' | 'reopen' | 'convert' | 'cancel'
  channel?: 'email' | 'whatsapp' | 'none'
  message?: string
  estimatedDeliveryDate?: string
  totalPrice?: number
  orderNotes?: string
}
