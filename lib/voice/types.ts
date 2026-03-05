export type VoicePermission =
  | 'manage_customers'
  | 'manage_measurements'
  | 'manage_orders'

export type VoiceIntent =
  | 'add_customer'
  | 'add_measurement'
  | 'create_order'
  | 'update_order_status'
  | 'delete_customer'
  | 'list_customers'
  | 'find_customer'
  | 'list_orders'
  | 'pending_orders'
  | 'shop_stats'
  | 'help'
  | 'unknown'

export type VoiceFlow =
  | 'add_customer'
  | 'add_measurement'
  | 'create_order'
  | 'update_order_status'
  | 'delete_customer'

export type PendingAction =
  | 'none'
  | 'ask_name'
  | 'ask_last_name'
  | 'ask_phone'
  | 'ask_email'
  | 'ask_address'
  | 'ask_city'
  | 'ask_country'
  | 'ask_notes'
  | 'ask_measurement_timing'
  | 'ask_customer'
  | 'ask_standard_selection'
  | 'ask_standard_value'
  | 'ask_custom_choice'
  | 'ask_custom_measurements'
  | 'ask_measurements'
  | 'ask_description'
  | 'ask_fabric'
  | 'ask_due_date'
  | 'ask_total_price'
  | 'ask_order_number'
  | 'ask_status'
  | 'confirm'

export interface AddCustomerDraft {
  firstName?: string
  lastName?: string | null
  phone?: string | null
  email?: string | null
  address?: string | null
  city?: string | null
  country?: string | null
  notes?: string | null
  addMeasurementsNow?: boolean
}

export interface AddMeasurementDraft {
  customerId?: string
  customerName?: string
  selectedStandardKeys: string[]
  currentStandardIndex: number
  standardMeasurements: Record<string, number>
  customMeasurements: Record<string, number>
  notes?: string | null
}

export interface CreateOrderDraft {
  customerId?: string
  customerName?: string
  designDescription?: string
  fabricDetails?: string | null
  estimatedDeliveryDate?: string | null
  totalPrice?: number | null
  notes?: string | null
}

export interface UpdateOrderDraft {
  orderNumber?: string
  status?: 'pending' | 'in_progress' | 'completed' | 'delivered' | 'cancelled'
}

export interface DeleteCustomerDraft {
  customerId?: string
  customerName?: string
}

export interface VoiceSession {
  flow: VoiceFlow
  step: PendingAction
  expiresAt: number
  addCustomer?: AddCustomerDraft
  addMeasurement?: AddMeasurementDraft
  createOrder?: CreateOrderDraft
  updateOrder?: UpdateOrderDraft
  deleteCustomer?: DeleteCustomerDraft
}

export interface VoiceMeasurementOption {
  key: string
  label: string
  category: string
}

export interface VoiceMeasurementPickerPrompt {
  type: 'measurement_standard_picker'
  measurements: VoiceMeasurementOption[]
}

export type VoicePrompt = VoiceMeasurementPickerPrompt

export interface VoiceReply {
  reply: string
  action?: string
  prompt?: VoicePrompt
}
