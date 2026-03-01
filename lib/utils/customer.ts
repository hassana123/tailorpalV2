import { createClient } from '@/lib/supabase/server';

export interface Customer {
  id: string;
  shop_id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Get customers for a shop
 */
export async function getShopCustomers(shopId: string): Promise<Customer[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('shop_id', shopId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching customers:', error);
    return [];
  }

  return data as Customer[];
}

/**
 * Get customer by ID
 */
export async function getCustomerById(customerId: string): Promise<Customer | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', customerId)
    .single();

  if (error) {
    console.error('Error fetching customer:', error);
  }

  return data as Customer | null;
}

/**
 * Add new customer to shop
 */
export async function addCustomer(
  shopId: string,
  customerData: Omit<Customer, 'id' | 'shop_id' | 'created_at' | 'updated_at'> & {
    created_by?: string
  }
): Promise<Customer | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('customers')
    .insert([
      {
        shop_id: shopId,
        first_name: customerData.first_name,
        last_name: customerData.last_name,
        email: customerData.email,
        phone: customerData.phone,
        address: customerData.address,
        created_by: customerData.created_by,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('Error adding customer:', error);
  }

  return data as Customer | null;
}

/**
 * Update customer information
 */
export async function updateCustomer(
  customerId: string,
  updates: Partial<Customer>
): Promise<Customer | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('customers')
    .update(updates)
    .eq('id', customerId)
    .select()
    .single();

  if (error) {
    console.error('Error updating customer:', error);
  }

  return data as Customer | null;
}

/**
 * Delete customer
 */
export async function deleteCustomer(customerId: string): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('customers')
    .delete()
    .eq('id', customerId);

  if (error) {
    console.error('Error deleting customer:', error);
    return false;
  }

  return true;
}

/**
 * Search customers by name or phone
 */
export async function searchCustomers(
  shopId: string,
  query: string
): Promise<Customer[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('shop_id', shopId)
    .or(
      `first_name.ilike.%${query}%,last_name.ilike.%${query}%,phone.ilike.%${query}%,email.ilike.%${query}%`
    );

  if (error) {
    console.error('Error searching customers:', error);
    return [];
  }

  return data as Customer[];
}
