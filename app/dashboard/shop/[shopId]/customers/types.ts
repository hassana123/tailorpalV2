// ─── Customer Types ───────────────────────────────────────────────────────────

export interface Customer {
  id: string
  shop_id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  country: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface CustomerFormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  city: string
  country: string
  notes: string
}

export const initialCustomerFormData: CustomerFormData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  country: '',
  notes: '',
}
