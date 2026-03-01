import { createClient } from '@/lib/supabase/server';

export interface Order {
  id: string;
  shop_id: string;
  customer_id: string;
  order_number: string;
  status: 'pending' | 'in_progress' | 'completed' | 'delivered' | 'cancelled';
  design_description: string | null;
  fabric_details: string | null;
  estimated_delivery_date: string | null;
  total_price: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Get all orders for a shop
 */
export async function getShopOrders(shopId: string): Promise<Order[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('shop_id', shopId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching orders:', error);
    return [];
  }

  return data as Order[];
}

/**
 * Get orders for a specific customer
 */
export async function getCustomerOrders(customerId: string): Promise<Order[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching customer orders:', error);
    return [];
  }

  return data as Order[];
}

/**
 * Get order by ID
 */
export async function getOrderById(orderId: string): Promise<Order | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (error) {
    console.error('Error fetching order:', error);
  }

  return data as Order | null;
}

/**
 * Create new order
 */
export async function createOrder(
  shopId: string,
  customerId: string,
  orderData: Partial<Order>
): Promise<Order | null> {
  const supabase = await createClient();

  // Generate order number
  const orderNumber = `ORD-${Date.now()}`;

  const { data, error } = await supabase
    .from('orders')
    .insert([
      {
        shop_id: shopId,
        customer_id: customerId,
        order_number: orderNumber,
        status: orderData.status || 'pending',
        design_description: orderData.design_description,
        fabric_details: orderData.fabric_details,
        total_price: orderData.total_price,
        estimated_delivery_date: orderData.estimated_delivery_date,
        notes: orderData.notes,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('Error creating order:', error);
  }

  return data as Order | null;
}

/**
 * Update order
 */
export async function updateOrder(
  orderId: string,
  updates: Partial<Order>
): Promise<Order | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('orders')
    .update(updates)
    .eq('id', orderId)
    .select()
    .single();

  if (error) {
    console.error('Error updating order:', error);
  }

  return data as Order | null;
}

/**
 * Delete order
 */
export async function deleteOrder(orderId: string): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase.from('orders').delete().eq('id', orderId);

  if (error) {
    console.error('Error deleting order:', error);
    return false;
  }

  return true;
}
