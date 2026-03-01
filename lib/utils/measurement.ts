import { createClient } from '@/lib/supabase/server';

export interface Measurement {
  id: string;
  customer_id: string;
  shop_id: string;
  chest: number | null;
  waist: number | null;
  hip: number | null;
  shoulder_width: number | null;
  sleeve_length: number | null;
  inseam: number | null;
  neck: number | null;
  notes: string | null;
  status: 'pending' | 'completed';
  created_at: string;
}

/**
 * Get all measurements for a customer
 */
export async function getCustomerMeasurements(customerId: string): Promise<Measurement[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('measurements')
    .select('*')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching measurements:', error);
    return [];
  }

  return data as Measurement[];
}

/**
 * Get latest measurement for a customer
 */
export async function getLatestMeasurement(customerId: string): Promise<Measurement | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('measurements')
    .select('*')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching latest measurement:', error);
  }

  return data as Measurement | null;
}

/**
 * Create new measurement
 */
export async function addMeasurement(
  customerId: string,
  shopId: string,
  measurementData: Partial<Measurement>
): Promise<Measurement | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('measurements')
    .insert([
      {
        customer_id: customerId,
        shop_id: shopId,
        chest: measurementData.chest,
        waist: measurementData.waist,
        hip: measurementData.hip,
        shoulder_width: measurementData.shoulder_width,
        sleeve_length: measurementData.sleeve_length,
        inseam: measurementData.inseam,
        neck: measurementData.neck,
        notes: measurementData.notes,
        status: measurementData.status || 'completed',
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('Error adding measurement:', error);
  }

  return data as Measurement | null;
}

/**
 * Update measurement
 */
export async function updateMeasurement(
  measurementId: string,
  updates: Partial<Measurement>
): Promise<Measurement | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('measurements')
    .update(updates)
    .eq('id', measurementId)
    .select()
    .single();

  if (error) {
    console.error('Error updating measurement:', error);
  }

  return data as Measurement | null;
}

/**
 * Delete measurement
 */
export async function deleteMeasurement(measurementId: string): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('measurements')
    .delete()
    .eq('id', measurementId);

  if (error) {
    console.error('Error deleting measurement:', error);
    return false;
  }

  return true;
}
